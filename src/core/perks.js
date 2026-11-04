// Picks which perks to offer after a cleared wave (perk definitions are in src/data/perks.js).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const data = require('../data/perks.js');
    module.exports = Object.assign({}, data, factory(Object.assign({}, require('./config.js'), require('./utils.js'), data)));
  } else {
    root.TD = Object.assign(root.TD || {}, factory(root.TD));
  }
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  class PerkPicker {
    constructor(rng = Math.random, perks = TD.PERKS) {
      this.rng = rng;
      this.perks = perks;
    }

    available(game) {
      const stacks = game.perkStacks || {};
      return this.perks.filter(p => (stacks[p.id] || 0) < TD.MAX_PERK_STACKS && (!p.cond || p.cond(game)));
    }

    choices(game, count = 3) {
      return TD.pickRandom(this.available(game), count, this.rng);
    }
  }

  return { PerkPicker };
});
