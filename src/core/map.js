// A map in play: its routes as Paths, which tiles are road, and when each route opens.
// Routes open in order: 2 at the start, then 1 more every ROUTE_STEP waves.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(Object.assign({}, require('./config.js'), require('./path.js'), require('../data/maps.js')));
  } else {
    root.TD = Object.assign(root.TD || {}, factory(root.TD));
  }
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  const START_ROUTES = 2;
  const ROUTE_STEP = 10;

  class GameMap {
    static random(rng = Math.random, defs = TD.MAP_DEFS) {
      return new GameMap(defs[Math.floor(rng() * defs.length)]);
    }

    constructor(def = TD.MAP_DEFS[0], { tile = TD.TILE, cols = TD.COLS, rows = TD.ROWS } = {}) {
      this.id = def.id;
      this.name = def.name;
      this.theme = def.theme;
      this.uniques = def.uniques || [];
      this.tile = tile;
      this.cols = cols;
      this.rows = rows;
      this.routes = def.routes.map(wp => new TD.Path(wp, { tile, cols, rows }));
      this.tiles = new Set(this.routes.flatMap(p => [...p.tiles]));
      this.baseTile = this.routes[0].baseTile;
    }

    // Routes open at the start, plus one every ROUTE_STEP waves, up to all of them.
    routesOpen(wave) {
      return Math.min(this.routes.length, START_ROUTES + Math.floor(wave / ROUTE_STEP));
    }

    // Wave on which route i opens (routes 0 and 1 are open from wave 1).
    routeOpensAt(i) {
      return i < START_ROUTES ? 1 : (i - START_ROUTES + 1) * ROUTE_STEP;
    }

    inBounds(c, r) {
      return c >= 0 && c < this.cols && r >= 0 && r < this.rows;
    }

    isPathTile(c, r) {
      return this.tiles.has(`${c},${r}`);
    }

    get basePosition() {
      return this.routes[0].basePosition;
    }
  }

  return { GameMap, START_ROUTES, ROUTE_STEP };
});
