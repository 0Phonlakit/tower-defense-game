(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const UNIQUE_FROM_WAVE = 5;

  class WaveGenerator {
    constructor(rng = Math.random) {
      this.rng = rng;
    }

    enemyCount(wave) {
      return 6 + Math.floor(wave * 1.6);
    }

    // Share of a wave made of the map's unique units: 25% at wave 5, rising to 40% by wave 20.
    uniqueShare(wave) {
      return wave < UNIQUE_FROM_WAVE ? 0 : Math.min(0.4, 0.25 + (wave - UNIQUE_FROM_WAVE) * 0.01);
    }

    // List of enemy types to spawn, in order. Fast from wave 3, tanks and the map's unique units
    // from wave 5, bosses every 10 waves.
    build(wave, uniques = []) {
      const list = [];
      const share = uniques.length ? this.uniqueShare(wave) : 0;
      for (let i = 0; i < this.enemyCount(wave); i++) {
        if (share && this.rng() < share) { list.push(uniques[Math.floor(this.rng() * uniques.length)]); continue; }
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

  return { WaveGenerator, UNIQUE_FROM_WAVE };
});
