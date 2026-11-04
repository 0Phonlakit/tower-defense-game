// Base pixel art: one base per map (castle, palace, hut, tree house, spire, citadel, temple shapes).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(Object.assign({}, require('./pixel-grid.js')));
  else root.TD = Object.assign(root.TD || {}, factory(root.TD));
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  const build = TD.pixelGrid;

  // Bases (16x16), one per map: a walls, b trim/steps, c roof/flag/light, d door.
  const BASE_ART = {
    castle: build(16, 16, P => {
      P.rect(1, 4, 4, 10, 'a');
      P.rect(11, 4, 4, 10, 'a');
      for (const x of [1, 3, 11, 13]) P.px(x, 3, 'a');
      P.rect(2, 7, 12, 7, 'a');
      P.rect(6, 10, 4, 4, 'd');
      P.line(8, 1, 8, 6, 'w');
      P.rect(9, 1, 3, 2, 'c');
      P.rect(1, 13, 14, 1, 'b');
    }),
    palace: build(16, 16, P => {
      P.tri(2.5, 0, 4, 4, 'c');
      P.tri(12.5, 0, 4, 4, 'c');
      P.tri(7.5, 2, 6, 4, 'c');
      P.rect(1, 5, 4, 9, 'a');
      P.rect(11, 5, 4, 9, 'a');
      P.rect(5, 7, 6, 7, 'a');
      P.rect(6, 10, 4, 4, 'd');
      P.rect(1, 13, 14, 1, 'b');
    }),
    hut: build(16, 16, P => {
      P.tri(7.5, 1, 7, 13, 'b');
      P.rect(4, 8, 8, 5, 'a');
      P.rect(7, 10, 2, 3, 'd');
      P.px(5, 9, 'c');
      P.rect(4, 13, 1, 2, 'a');
      P.rect(11, 13, 1, 2, 'a');
    }),
    treehouse: build(16, 16, P => {
      P.rect(2, 1, 12, 5, 'c');
      P.rect(4, 5, 8, 4, 'b');
      P.rect(7, 6, 2, 3, 'd');
      P.rect(7, 9, 2, 6, 'a');
    }),
    spire: build(16, 16, P => {
      P.rect(7, 0, 2, 1, 'b');
      P.rect(6, 1, 4, 3, 'c');
      P.rect(6, 4, 4, 9, 'a');
      P.rect(6, 7, 4, 1, 'b');
      P.rect(6, 10, 4, 1, 'b');
      P.rect(7, 11, 2, 2, 'd');
      P.rect(4, 13, 8, 2, 'b');
    }),
    citadel: build(16, 16, P => {
      P.tri(3.5, 4, 10, 4, 'c');
      P.tri(7.5, 0, 10, 6, 'c');
      P.tri(11.5, 3, 10, 4, 'c');
      P.px(7, 3, 'w');
      P.rect(2, 11, 12, 2, 'a');
      P.rect(1, 13, 14, 2, 'b');
    }),
    temple: build(16, 16, P => {
      P.tri(7.5, 1, 4, 14, 'c');
      P.rect(1, 5, 14, 1, 'b');
      for (const x of [2, 5, 10, 13]) P.rect(x, 6, 1, 5, 'a');
      P.rect(7, 8, 2, 3, 'd');
      P.rect(2, 11, 12, 1, 'b');
      P.rect(1, 12, 14, 2, 'b');
    }),
  };

  // Map id -> base art and colors.
  const BASE_LOOKS = {
    meadow:  { art: 'castle',    pal: { a: '#9aa0a8', b: '#6f757e', c: '#2b6cd9', d: '#4a3423' } },
    desert:  { art: 'castle',    pal: { a: '#d9bf86', b: '#a8874f', c: '#c0392b', d: '#5a3a1a' } },
    snow:    { art: 'palace',    pal: { a: '#cfe8ff', b: '#8fb5d6', c: '#7fb8e0', d: '#2a5d8a' } },
    lava:    { art: 'castle',    pal: { a: '#3a2a2a', b: '#1f1515', c: '#ff5a1f', d: '#ff8a3a' } },
    swamp:   { art: 'hut',       pal: { a: '#6b5a3a', b: '#3b4a2f', c: '#c6ff6b', d: '#1f2a17' } },
    beach:   { art: 'spire',     pal: { a: '#f4f8fb', b: '#c0392b', c: '#ffe14d', d: '#5a3a1a' } },
    night:   { art: 'spire',     pal: { a: '#3c4566', b: '#56608a', c: '#f5e6a8', d: '#1d2740' } },
    autumn:  { art: 'treehouse', pal: { a: '#6e4a26', b: '#a37a48', c: '#e0662c', d: '#3a2a1a' } },
    crystal: { art: 'citadel',   pal: { a: '#4a3d6a', b: '#30264a', c: '#b58cff', w: '#f1e6ff' } },
    ruins:   { art: 'temple',    pal: { a: '#c4bfb2', b: '#8c8778', c: '#a39e8f', d: '#3f3c34' } },
  };

  return { BASE_ART, BASE_LOOKS };
});
