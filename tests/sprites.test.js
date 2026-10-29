'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/ui/sprites.js');
const { ENEMY_DEFS, TOWER_DEFS } = require('../src/core/config.js');
const { MAP_DEFS } = require('../src/core/maps.js');

// Every grid is rectangular plain ASCII and every letter in it has a color.
function checkSprite(key, extraLetters = '') {
  const s = S.sprite(key);
  assert.ok(s, `${key} has a sprite`);
  const w = s.grid[0].length;
  const pal = Object.assign({}, S.BASE_PALETTE, s.pal);
  s.grid.forEach((row, i) => {
    assert.equal(row.length, w, `${key} row ${i} width`);
    assert.match(row, /^[\x21-\x7e]+$/, `${key} row ${i} is plain ASCII`);
    for (const ch of row) if (ch !== '.') assert.ok(pal[ch] || extraLetters.includes(ch), `${key}: no color for '${ch}'`);
  });
}

test('Sprites: every enemy type (including map units and ground twins) has pixel art', () => {
  for (const type of Object.keys(ENEMY_DEFS)) checkSprite(`enemy:${type}`);
  assert.equal(Object.keys(S.ENEMY_LOOKS).length, Object.keys(ENEMY_DEFS).length);
});

test('Sprites: every tower has pixel art', () => {
  for (const type of Object.keys(TOWER_DEFS)) checkSprite(`tower:${type}`);
});

test('Sprites: every map has its own base and scenery', () => {
  for (const def of MAP_DEFS) {
    checkSprite(`base:${def.id}`);
    checkSprite(`deco:${def.theme.shape}`, 'ab'); // a/b come from the theme's deco color at draw time
  }
  assert.equal(new Set(MAP_DEFS.map(d => JSON.stringify(S.BASE_LOOKS[d.id]))).size, 10, 'no two maps share a base look');
});

test('Sprites: enemy bodies are 12x12, towers and bases 16x16, scenery 8x8', () => {
  for (const g of Object.values(S.BODIES)) assert.deepEqual([g[0].length, g.length], [12, 12]);
  for (const t of Object.values(S.TOWER_ART)) assert.deepEqual([t.grid[0].length, t.grid.length], [16, 16]);
  for (const g of Object.values(S.BASE_ART)) assert.deepEqual([g[0].length, g.length], [16, 16]);
  for (const g of Object.values(S.DECO_ART)) assert.deepEqual([g[0].length, g.length], [8, 8]);
});
