(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Homing shot. If the target dies mid-flight it lands on the last known position.
  class Projectile {
    constructor({ x, y, target, speed, damage, crit = false, splash = 0, slow = 0, slowDur = 0, color = '#fff' }) {
      this.x = x;
      this.y = y;
      this.target = target;
      this.tx = target.x;
      this.ty = target.y;
      this.speed = speed;
      this.damage = damage;
      this.crit = crit;
      this.splash = splash;
      this.slow = slow;
      this.slowDur = slowDur;
      this.color = color;
      this.done = false;
    }

    // Returns true on the frame the projectile arrives.
    update(dt) {
      if (this.done) return false;
      if (this.target && !this.target.dead) {
        this.tx = this.target.x;
        this.ty = this.target.y;
      }
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const dist = Math.hypot(dx, dy);
      const step = this.speed * dt;
      if (dist <= step) {
        this.x = this.tx;
        this.y = this.ty;
        this.done = true;
        return true;
      }
      this.x += dx / dist * step;
      this.y += dy / dist * step;
      return false;
    }
  }

  return { Projectile };
});
