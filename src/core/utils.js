// Small helpers shared by core classes.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Deterministic PRNG (mulberry32) so tests can reproduce waves and perk rolls.
  function createRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Pick up to n distinct items from list.
  function pickRandom(list, n, rng) {
    const pool = [...list];
    const picks = [];
    while (picks.length < n && pool.length) picks.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return picks;
  }

  return { createRng, pickRandom };
});
