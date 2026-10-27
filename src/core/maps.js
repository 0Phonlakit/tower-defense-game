// The 10 maps: themes plus 5 routes each. All routes of a map end at the same base.
// Routes open in order: 2 at the start, then 1 more every ROUTE_STEP waves.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(Object.assign({}, require('./config.js'), require('./path.js')));
  } else {
    root.TD = Object.assign(root.TD || {}, factory(root.TD));
  }
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  const START_ROUTES = 2;
  const ROUTE_STEP = 10;

  // Hand-made layouts (tile col,row). A route starts one tile off the map edge and ends at the base.
  // Routes never cross: where two routes meet they merge and share the rest of the road to the base.
  const LAYOUTS = {
    winding: [
      [[-1, 2], [4, 2], [4, 9], [9, 9], [9, 3], [14, 3], [14, 10], [17, 10], [17, 6], [19, 6]],
      [[-1, 11], [11, 11], [11, 10], [17, 10], [17, 6], [19, 6]],
      [[5, 13], [5, 12], [13, 12], [13, 10], [17, 10], [17, 6], [19, 6]],
      [[7, -1], [7, 5], [9, 5], [9, 3], [14, 3], [14, 10], [17, 10], [17, 6], [19, 6]],
      [[20, 3], [14, 3], [14, 10], [17, 10], [17, 6], [19, 6]],
    ],
    crossroads: [
      [[-1, 1], [3, 1], [3, 10], [7, 10], [7, 6], [10, 6]],
      [[20, 11], [16, 11], [16, 2], [13, 2], [13, 6], [10, 6]],
      [[8, -1], [8, 2], [5, 2], [5, 4], [10, 4], [10, 6]],
      [[-1, 12], [9, 12], [9, 7], [10, 7], [10, 6]],
      [[20, 1], [13, 1], [13, 6], [10, 6]],
    ],
    terraces: [
      [[-1, 1], [6, 1], [6, 6], [12, 6], [12, 10], [19, 10]],
      [[-1, 4], [6, 4], [6, 6], [12, 6], [12, 10], [19, 10]],
      [[-1, 11], [13, 11], [13, 10], [19, 10]],
      [[10, -1], [10, 3], [17, 3], [17, 10], [19, 10]],
      [[5, 13], [5, 12], [15, 12], [15, 10], [19, 10]],
    ],
    funnel: [
      [[-1, 2], [8, 2], [8, 9], [10, 9], [10, 12]],
      [[20, 2], [12, 2], [12, 9], [10, 9], [10, 12]],
      [[20, 7], [17, 7], [17, 4], [13, 4], [13, 11], [11, 11], [11, 12], [10, 12]],
      [[-1, 5], [2, 5], [2, 12], [10, 12]],
      [[15, -1], [15, 2], [12, 2], [12, 9], [10, 9], [10, 12]],
    ],
  };

  // Mirrors a layout: h flips left/right, v flips top/bottom (off-map starts stay off-map).
  function mirror(routes, { h = false, v = false }) {
    return routes.map(route => route.map(([c, r]) => [h ? TD.COLS - 1 - c : c, v ? TD.ROWS - 1 - r : r]));
  }

  // theme: ground = checker colors, path = [edge, fill], deco = scattered detail color/shape.
  const MAP_DEFS = [
    { id: 'meadow',  name: 'ทุ่งหญ้า',        uniques: ['bee', 'beetle'], routes: LAYOUTS.winding,
      theme: { ground: ['#3d6b3a', '#427240'], path: ['#8f7650', '#c9ad7c'], deco: '#2c5429', shape: 'bush' } },
    { id: 'desert',  name: 'ทะเลทราย',       uniques: ['firehawk', 'sandworm'], routes: LAYOUTS.crossroads,
      theme: { ground: ['#c9a25e', '#d1ab68'], path: ['#8a6a3e', '#e8d3a0'], deco: '#6f8f3c', shape: 'cactus' } },
    { id: 'snow',    name: 'ลานหิมะ',        uniques: ['snowowl', 'frostgiant'], routes: LAYOUTS.terraces,
      theme: { ground: ['#d9e3ec', '#e3ebf2'], path: ['#7d8d9b', '#aebccb'], deco: '#ffffff', shape: 'flake' } },
    { id: 'lava',    name: 'ภูเขาไฟ',        uniques: ['lavaspirit', 'magmagolem'], routes: LAYOUTS.funnel,
      theme: { ground: ['#2b1d1d', '#332121'], path: ['#5a2a1a', '#7a3b22'], deco: '#ff5a1f', shape: 'ember' } },
    { id: 'swamp',   name: 'บึงหมอก',        uniques: ['mosquito', 'bogcroc'], routes: mirror(LAYOUTS.winding, { h: true }),
      theme: { ground: ['#3b4a2f', '#425234'], path: ['#4a3c28', '#6b5a3a'], deco: '#6f8f45', shape: 'reed' } },
    { id: 'beach',   name: 'ชายหาด',         uniques: ['stormgull', 'crab'], routes: mirror(LAYOUTS.terraces, { v: true }),
      theme: { ground: ['#e6d3a0', '#ecdcae'], path: ['#b2945a', '#d6bb84'], deco: '#3fa7c9', shape: 'shell' } },
    { id: 'night',   name: 'ทุ่งราตรี',       uniques: ['bat', 'hauntedarmor'], routes: mirror(LAYOUTS.funnel, { v: true }),
      theme: { ground: ['#1d2740', '#222d4a'], path: ['#3c4566', '#56608a'], deco: '#f5e6a8', shape: 'star' } },
    { id: 'autumn',  name: 'ป่าใบไม้ร่วง',    uniques: ['crow', 'treant'], routes: mirror(LAYOUTS.terraces, { h: true }),
      theme: { ground: ['#6e4a26', '#77512c'], path: ['#4f341c', '#a37a48'], deco: '#e0662c', shape: 'leaf' } },
    { id: 'crystal', name: 'ถ้ำคริสตัล',      uniques: ['crystalgolem', 'crystalmoth'], routes: mirror(LAYOUTS.crossroads, { v: true }),
      theme: { ground: ['#2a2140', '#30264a'], path: ['#4a3d6a', '#6e5c9a'], deco: '#b58cff', shape: 'crystal' } },
    { id: 'ruins',   name: 'ซากเมืองโบราณ',   uniques: ['gargoyle', 'mummy'], routes: mirror(LAYOUTS.crossroads, { h: true }),
      theme: { ground: ['#5d5a4f', '#646155'], path: ['#3f3c34', '#8c8778'], deco: '#85806f', shape: 'rubble' } },
  ];

  class GameMap {
    static random(rng = Math.random, defs = MAP_DEFS) {
      return new GameMap(defs[Math.floor(rng() * defs.length)]);
    }

    constructor(def = MAP_DEFS[0], { tile = TD.TILE, cols = TD.COLS, rows = TD.ROWS } = {}) {
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

  return { MAP_DEFS, GameMap, START_ROUTES, ROUTE_STEP };
});
