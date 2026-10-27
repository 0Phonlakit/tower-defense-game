// One run of the game: base HP, gold, towers, waves. No DOM access, so it can be unit tested.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(Object.assign({},
      require('./config.js'), require('./path.js'), require('./enemy.js'), require('./tower.js'),
      require('./projectile.js'), require('./wave.js'), require('./perks.js')));
  } else {
    root.TD = Object.assign(root.TD || {}, factory(root.TD));
  }
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  // Phases: build (before wave 1) -> wave -> perk (choose reward) -> wave ... -> over
  // After a wave's last spawn a countdown runs; at 0 (or on skip) the next wave starts, so waves can overlap.
  class Game {
    constructor({ meta, path = new TD.Path(), rng = Math.random } = {}) {
      if (!meta) throw new Error('Game requires a MetaProgress');
      this.meta = meta;
      this.path = path;
      this.rng = rng;
      this.waves = new TD.WaveGenerator(rng);
      this.perkPicker = new TD.PerkPicker(rng);
      this.listeners = {};

      this.phase = 'build';
      this.wave = 0;
      this.hp = TD.MAX_HP;
      this.gold = TD.STARTING_GOLD + meta.upgrades.startGold * 30;
      this.time = 0;
      this.kills = 0;
      this.mods = TD.defaultModifiers();
      this.towers = [];
      this.enemies = [];
      this.projectiles = [];
      this.effects = [];
      this.spawnQueue = [];
      this.spawnTimer = 0;
      this.spawnInterval = 1;
      this.spawning = false;
      this.countdown = null; // seconds until the next wave, null while spawning
      this.wavesCleared = 0;
      this.perkChoices = [];
      this.perksTaken = [];
      this.result = null;
    }

    // ---------- Events ----------
    on(name, fn) {
      (this.listeners[name] ||= []).push(fn);
      return this;
    }

    emit(name, payload) {
      for (const fn of this.listeners[name] || []) fn(payload);
    }

    // ---------- Queries ----------
    get isOver() {
      return this.phase === 'over';
    }

    get canBuild() {
      return this.phase === 'build' || this.phase === 'wave';
    }

    get enemiesRemaining() {
      return this.enemies.length + this.spawnQueue.length;
    }

    // Gold paid for skipping the countdown now: the full clear bonus at 30s left, 0 at 0s.
    get skipBonus() {
      if (this.countdown === null) return 0;
      return Math.floor(this.waves.clearBonus(this.wave) * this.countdown / TD.WAVE_COUNTDOWN);
    }

    towerCost(type) {
      return Math.round(TD.TOWER_DEFS[type].cost * this.mods.cost);
    }

    upgradeCost(tower) {
      return tower.upgradeCost(this.mods.cost);
    }

    towerStats(tower) {
      return tower.stats(this.mods, this.meta.upgrades);
    }

    previewStats(type) {
      return this.towerStats(new TD.Tower(type, 0, 0));
    }

    towerAt(c, r) {
      return this.towers.find(t => t.c === c && t.r === r) || null;
    }

    canPlace(c, r) {
      return this.path.inBounds(c, r) && !this.path.isPathTile(c, r) && !this.towerAt(c, r);
    }

    // ---------- Player actions ----------
    buildTower(type, c, r) {
      if (!this.canBuild || !this.meta.isUnlocked(type) || !this.canPlace(c, r)) return null;
      const cost = this.towerCost(type);
      if (this.gold < cost) return null;
      this.gold -= cost;
      const tower = new TD.Tower(type, c, r, cost, this.path.tile);
      this.towers.push(tower);
      return tower;
    }

    upgradeTower(tower) {
      if (!this.canBuild || !tower || tower.isMaxLevel) return false;
      const cost = this.upgradeCost(tower);
      if (this.gold < cost) return false;
      this.gold -= cost;
      return tower.upgrade(cost);
    }

    sellTower(tower) {
      if (!this.canBuild || !this.towers.includes(tower)) return false;
      this.gold += tower.sellValue;
      this.towers = this.towers.filter(t => t !== tower);
      return true;
    }

    startWave() {
      if (this.phase !== 'build') return false;
      this._launchWave();
      return true;
    }

    // Starts the next wave early. Returns the gold bonus paid, or null if there is no countdown to skip.
    skipCountdown() {
      if (this.phase !== 'wave' || this.countdown === null) return null;
      const bonus = this.skipBonus;
      this.gold += bonus;
      if (bonus) this._text(this.path.cols * this.path.tile / 2, this.path.rows * this.path.tile / 2 + 30, `ข้าม! +${bonus} gold`, '#f5c542', 1.2);
      this._launchWave();
      return bonus;
    }

    choosePerk(index) {
      if (this.phase !== 'perk') return false;
      const perk = this.perkChoices[index];
      if (!perk) return false;
      const label = `${perk.name} — ${perk.desc(this)}`;
      perk.apply(this);
      this.perksTaken.push(label);
      this.perkChoices = [];
      this.phase = 'wave';
      this.emit('perkchosen', { perk, label });
      return true;
    }

    // ---------- Simulation ----------
    update(dt) {
      if (!this.canBuild) return;
      this.time += dt;

      if (this.phase === 'wave' && this.spawnQueue.length) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          const enemy = new TD.Enemy(this.spawnQueue.shift(), this.wave, this.path);
          enemy.wave = this.wave;
          this.enemies.push(enemy);
          this.spawnTimer = this.spawnInterval;
        }
      }
      if (this.phase === 'wave' && this.spawning && !this.spawnQueue.length) {
        this.spawning = false;
        this.countdown = TD.WAVE_COUNTDOWN;
      } else if (this.countdown !== null) {
        this.countdown -= dt;
        if (this.countdown <= 0) this._launchWave();
      }

      for (const e of this.enemies) {
        if (!e.update(dt, this.time)) continue;
        this.hp = Math.max(0, this.hp - e.damage);
        const base = this.path.basePosition;
        this._text(base.x, base.y - 24, `-${e.damage} HP`, '#ff6b6b', 1);
        this._effect({ kind: 'ring', x: base.x, y: base.y, r0: 10, r1: 34, color: '#ff6b6b', life: 0.4 });
        if (this.hp <= 0) { this._gameOver(); return; }
      }

      for (const t of this.towers) {
        const stats = this.towerStats(t);
        const target = t.tick(dt, this.enemies, stats);
        if (target) this._fire(t, target, stats);
      }

      for (const p of this.projectiles) {
        if (p.update(dt)) this._impact(p);
      }

      for (const fx of this.effects) {
        fx.life -= dt;
        if (fx.kind === 'text') fx.y -= 30 * dt;
      }

      this.enemies = this.enemies.filter(e => !e.dead);
      this.projectiles = this.projectiles.filter(p => !p.done);
      this.effects = this.effects.filter(fx => fx.life > 0);

      // Older waves are fully spawned, so a wave is cleared once none of its enemies are left.
      while (this.phase === 'wave' && this.wavesCleared < this.wave) {
        const w = this.wavesCleared + 1;
        if ((w === this.wave && this.spawnQueue.length) || this.enemies.some(e => e.wave === w)) break;
        this._endWave(w);
      }
    }

    // ---------- Internals ----------
    _fire(tower, target, stats) {
      const def = tower.def;
      const crit = this.rng() < stats.crit;
      const damage = stats.dmg * (crit ? 2 : 1);
      if (def.instant) {
        this._damage(target, damage);
        this._effect({ kind: 'tracer', x: tower.x, y: tower.y, x2: target.x, y2: target.y, color: def.color, life: 0.15 });
        if (crit) this._text(target.x, target.y - 18, 'CRIT!', '#ff6b6b', 0.6);
        return;
      }
      this.projectiles.push(new TD.Projectile({
        x: tower.x + Math.cos(tower.angle) * 14,
        y: tower.y + Math.sin(tower.angle) * 14,
        target, speed: def.proj, damage, crit,
        splash: stats.splash, slow: stats.slow, slowDur: stats.slowDur, color: def.color,
      }));
    }

    _impact(p) {
      if (p.splash) {
        for (const e of this.enemies) {
          if (e.dead || Math.hypot(e.x - p.tx, e.y - p.ty) > p.splash + e.radius) continue;
          if (p.slow) e.applySlow(p.slow, p.slowDur, this.time);
          this._damage(e, p.damage);
        }
        this._effect({ kind: 'ring', x: p.tx, y: p.ty, r0: 4, r1: p.splash, color: p.color, life: 0.3 });
      } else if (p.target && !p.target.dead) {
        this._damage(p.target, p.damage);
      }
      if (p.crit) this._text(p.tx, p.ty - 18, 'CRIT!', '#ff6b6b', 0.6);
    }

    _damage(enemy, amount) {
      if (!enemy.takeDamage(amount)) return;
      this.kills++;
      const gold = Math.max(1, Math.floor(enemy.reward * this.mods.gold * (1 + 0.08 * this.meta.upgrades.gold)));
      this.gold += gold;
      this._text(enemy.x, enemy.y - 10, `+${gold}`, '#f5c542', 0.8);
      this._effect({ kind: 'ring', x: enemy.x, y: enemy.y, r0: enemy.radius, r1: enemy.radius * 2.2, color: enemy.color, life: 0.35 });
    }

    _launchWave() {
      this.wave++;
      this.spawnQueue = this.waves.build(this.wave);
      this.spawnInterval = this.waves.spawnInterval(this.wave);
      this.spawnTimer = 0;
      this.spawning = true;
      this.countdown = null;
      this.phase = 'wave';
      this.emit('wavestart', { wave: this.wave });
    }

    _endWave(wave) {
      const bonus = this.waves.clearBonus(wave);
      const interest = Math.floor(Math.min(this.gold * this.mods.interest, 50 + wave * 10));
      this.gold += bonus + interest;
      this.wavesCleared = wave;
      this._text(this.path.cols * this.path.tile / 2, this.path.rows * this.path.tile / 2,
        `ผ่าน Wave ${wave}! +${bonus + interest} gold`, '#f5c542', 1.6);
      this.perkChoices = this.perkPicker.choices(this);
      if (this.perkChoices.length) this.phase = 'perk';
      this.emit('wavecleared', { wave, bonus, interest, choices: this.perkChoices });
    }

    _gameOver() {
      this.phase = 'over';
      this.spawnQueue = [];
      this.countdown = null;
      this.result = { ...this.meta.recordRun(this.wavesCleared), kills: this.kills };
      this.emit('gameover', this.result);
    }

    _effect(fx) {
      this.effects.push({ ...fx, max: fx.life });
    }

    _text(x, y, text, color, life) {
      this._effect({ kind: 'text', x, y, text, color, life });
    }
  }

  return { Game };
});
