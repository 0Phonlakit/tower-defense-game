// Core numbers of the game (board size, base HP, starting gold, ...) and per-run modifiers.
// In Node this module also re-exports all game data from src/data/, so `require('./config.js')`
// gives the full set; in the browser each data file adds itself to TD.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = Object.assign(factory(), require('../data/towers.js'), require('../data/elements.js'),
      require('../data/enemies.js'), require('../data/upgrades.js'));
  } else {
    root.TD = Object.assign(root.TD || {}, factory());
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TILE = 40;
  const COLS = 24;
  const ROWS = 16;
  const MAX_HP = 20;
  const MAX_TOWER_LEVEL = 4;
  const STARTING_GOLD = 120;
  const WAVE_COUNTDOWN = 30; // seconds after a wave's last spawn before the next wave starts
  const SAVE_KEY = 'rogue-td-save-v1';

  // Path waypoints (tile col,row). First point is off-screen spawn, last point is the base.
  const WAYPOINTS = [[-1, 2], [5, 2], [5, 12], [11, 12], [11, 4], [17, 4], [17, 8], [23, 8]];

  // Per-run modifiers changed by perks.
  function defaultModifiers() {
    return { dmg: 1, rate: 1, range: 1, gold: 1, crit: 0, splash: 1, slow: 0, cost: 1, interest: 0 };
  }

  return {
    TILE, COLS, ROWS, MAX_HP, MAX_TOWER_LEVEL, STARTING_GOLD, WAVE_COUNTDOWN, SAVE_KEY,
    WAYPOINTS, defaultModifiers,
  };
});
