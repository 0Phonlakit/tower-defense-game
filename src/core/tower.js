(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./config.js'));
  else root.TD = Object.assign(root.TD || {}, factory(root.TD));
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  const NO_META = { dmg: 0, rate: 0, range: 0, crit: 0 };

  class Tower {
    constructor(type, c, r, cost = 0, tile = TD.TILE) {
      if (!TD.TOWER_DEFS[type]) throw new Error(`Unknown tower type: ${type}`);
      this.type = type;
      this.c = c;
      this.r = r;
      this.x = c * tile + tile / 2;
      this.y = r * tile + tile / 2;
      this.level = 1;
      this.cooldown = 0;
      this.angle = -Math.PI / 2;
      this.spent = cost;
    }

    get def() {
      return TD.TOWER_DEFS[this.type];
    }

    // Final stats after tower level, permanent upgrades and run perks.
    stats(mods = TD.defaultModifiers(), metaUpgrades = NO_META) {
      const d = this.def;
      const lv = this.level - 1;
      const dmgScale = (1 + 0.6 * lv) * (1 + 0.1 * metaUpgrades.dmg) * mods.dmg; // also scales burn/poison
      return {
        dmg: d.dmg * dmgScale,
        rate: d.rate * (1 + 0.15 * lv) * (1 + 0.06 * metaUpgrades.rate) * mods.rate,
        range: d.range * (1 + 0.1 * lv) * (1 + 0.05 * metaUpgrades.range) * mods.range,
        splash: d.splash ? d.splash * mods.splash * (1 + 0.1 * lv) : 0,
        slow: d.slow ? Math.min(0.8, d.slow + mods.slow) : 0,
        slowDur: d.slowDur || 0,
        crit: Math.min(0.9, 0.03 * metaUpgrades.crit + mods.crit),
        element: d.element || null,
        burn: d.burn ? d.burn * dmgScale : 0,
        poison: d.poison ? d.poison * dmgScale : 0,
        chain: d.chain || 0,
      };
    }

    get isMaxLevel() {
      return this.level >= TD.MAX_TOWER_LEVEL;
    }

    upgradeCost(costMultiplier = 1) {
      return Math.round(this.def.cost * 0.8 * this.level * costMultiplier);
    }

    upgrade(cost) {
      if (this.isMaxLevel) return false;
      this.level++;
      this.spent += cost;
      return true;
    }

    get sellValue() {
      return Math.floor(this.spent * 7 / 10); // avoids 90 * 0.7 = 62.999...
    }

    // Targets the enemy furthest along the path within range.
    findTarget(enemies, range) {
      let best = null;
      for (const e of enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - this.x, e.y - this.y) > range + e.radius) continue;
        if (!best || e.distance > best.distance) best = e;
      }
      return best;
    }

    // Aims and counts down the cooldown. Returns the enemy to shoot this frame, or null.
    tick(dt, enemies, stats) {
      this.cooldown -= dt;
      const target = this.findTarget(enemies, stats.range);
      if (!target) return null;
      this.angle = Math.atan2(target.y - this.y, target.x - this.x);
      if (this.cooldown > 0) return null;
      this.cooldown = 1 / stats.rate;
      return target;
    }
  }

  return { Tower };
});
