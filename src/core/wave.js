(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WaveGenerator {
    constructor(rng = Math.random) {
      this.rng = rng;
    }

    enemyCount(wave) {
      return 6 + Math.floor(wave * 1.6);
    }

    // List of enemy types to spawn, in order. Fast from wave 3, tanks from wave 5, bosses every 10 waves.
    build(wave) {
      const list = [];
      for (let i = 0; i < this.enemyCount(wave); i++) {
        const roll = this.rng();
        if (wave >= 5 && roll < Math.min(0.3, 0.05 + wave * 0.01)) list.push('tank');
        else if (wave >= 3 && roll < Math.min(0.6, 0.3 + wave * 0.01)) list.push('fast');
        else list.push('normal');
      }
      if (wave % 10 === 0) for (let i = 0; i < wave / 10; i++) list.push('boss');
      return list;
    }

    spawnInterval(wave) {
      return Math.max(0.3, 0.9 - wave * 0.02);
    }

    clearBonus(wave) {
      return 20 + wave * 5;
    }
  }

  return { WaveGenerator };
});
