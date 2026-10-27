(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./config.js'));
  else root.TD = Object.assign(root.TD || {}, factory(root.TD));
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  class Enemy {
    static hpMultiplier(wave) {
      const w = wave - 1;
      return (1 + 0.15 * w + 0.012 * w * w) * Math.pow(1.09, w);
    }

    constructor(type, wave, path) {
      const def = TD.ENEMY_DEFS[type];
      if (!def) throw new Error(`Unknown enemy type: ${type}`);
      this.type = type;
      this.path = path;
      this.distance = 0;
      const p = path.positionAt(0);
      this.x = p.x;
      this.y = p.y;
      this.maxHp = def.hp * Enemy.hpMultiplier(wave);
      this.hp = this.maxHp;
      this.speed = def.speed;
      this.damage = def.dmg;
      this.reward = def.reward * (1 + wave * 0.03);
      this.radius = def.r;
      this.flying = !!def.flying;
      this.unique = !!def.unique;
      this.resist = def.resist || {};
      this.color = def.color;
      this.slowAmount = 0;
      this.slowUntil = 0;
      this.aura = null;       // element name, or null
      this.auraUntil = 0;
      this.burnDps = 0;
      this.burnUntil = 0;
      this.poisonDps = 0;     // per stack
      this.poisonStacks = 0;
      this.poisonUntil = 0;
      this.frozenUntil = 0;
      this.vulnAmount = 0;
      this.vulnUntil = 0;
      this.dead = false;
      this.reachedBase = false;
    }

    get hpRatio() {
      return Math.max(0, this.hp / this.maxHp);
    }

    isSlowed(time) {
      return time < this.slowUntil;
    }

    applySlow(amount, duration, time) {
      this.slowAmount = this.isSlowed(time) ? Math.max(this.slowAmount, amount) : amount;
      this.slowUntil = Math.max(this.slowUntil, time + duration);
    }

    // Share of damage of this type the enemy takes: 1 normally, 0 if immune.
    resistance(type) {
      return type in this.resist ? this.resist[type] : 1;
    }

    activeAura(time) {
      return time < this.auraUntil ? this.aura : null;
    }

    setAura(element, time) {
      this.aura = element;
      this.auraUntil = time + TD.AURA_DURATION;
    }

    clearAura() {
      this.aura = null;
      this.auraUntil = 0;
    }

    isFrozen(time) {
      return time < this.frozenUntil;
    }

    freeze(duration, time) {
      this.frozenUntil = Math.max(this.frozenUntil, time + duration);
    }

    makeVulnerable(amount, duration, time) {
      this.vulnAmount = Math.max(time < this.vulnUntil ? this.vulnAmount : 0, amount);
      this.vulnUntil = Math.max(this.vulnUntil, time + duration);
    }

    damageTakenMultiplier(time) {
      return time < this.vulnUntil ? 1 + this.vulnAmount : 1;
    }

    // Keeps the strongest burn and restarts its timer.
    applyBurn(dps, time) {
      this.burnDps = time < this.burnUntil ? Math.max(this.burnDps, dps) : dps;
      this.burnUntil = time + TD.BURN_DURATION;
    }

    // Adds a stack (up to the cap) and restarts the timer for all stacks.
    applyPoison(dps, time) {
      if (time >= this.poisonUntil) this.poisonStacks = 0;
      this.poisonDps = Math.max(this.poisonDps, dps);
      this.poisonStacks = Math.min(TD.POISON_MAX_STACKS, this.poisonStacks + 1);
      this.poisonUntil = time + TD.POISON_DURATION;
    }

    // Burn + poison damage for this frame (before the damage-taken multiplier).
    dotDamage(dt, time) {
      let dmg = 0;
      if (time < this.burnUntil) dmg += this.burnDps * this.resistance('fire') * dt;
      if (time < this.poisonUntil) dmg += this.poisonDps * this.poisonStacks * this.resistance('poison') * dt;
      return dmg;
    }

    // Returns true if this hit killed the enemy.
    takeDamage(amount) {
      if (this.dead) return false;
      this.hp -= amount;
      if (this.hp > 0) return false;
      this.dead = true;
      return true;
    }

    // Moves along the path. Returns true on the frame the enemy reaches the base.
    update(dt, time) {
      if (this.dead) return false;
      if (this.isFrozen(time)) return false;
      const slow = this.isSlowed(time) ? this.slowAmount : 0;
      this.distance += this.speed * (1 - slow) * dt;
      if (this.distance >= this.path.length) {
        this.dead = true;
        this.reachedBase = true;
        return true;
      }
      const p = this.path.positionAt(this.distance);
      this.x = p.x;
      this.y = p.y;
      return false;
    }
  }

  return { Enemy };
});
