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
      this.color = def.color;
      this.slowAmount = 0;
      this.slowUntil = 0;
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
