'use strict';
const { MetaProgress } = require('../src/core/meta.js');
const { Game } = require('../src/core/game.js');
const { GameMap } = require('../src/core/map.js');
const { createRng } = require('../src/core/utils.js');

// In-memory stand-in for localStorage.
class MemoryStorage {
  constructor(initial = {}) {
    this.data = { ...initial };
  }
  getItem(k) { return k in this.data ? this.data[k] : null; }
  setItem(k, v) { this.data[k] = String(v); }
  removeItem(k) { delete this.data[k]; }
}

function makeMeta(overrides = {}) {
  const meta = new MetaProgress(new MemoryStorage());
  Object.assign(meta, overrides);
  return meta;
}

function makeGame({ seed = 1, meta = makeMeta(), map = new GameMap() } = {}) {
  return new Game({ meta, map, rng: createRng(seed) });
}

// Runs the simulation until predicate is true or the step budget is spent.
function runUntil(game, predicate, { dt = 0.02, maxSteps = 200000 } = {}) {
  for (let i = 0; i < maxSteps; i++) {
    if (predicate(game)) return true;
    game.update(dt);
  }
  return predicate(game);
}

module.exports = { MemoryStorage, makeMeta, makeGame, runUntil };
