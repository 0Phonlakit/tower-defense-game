'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/render/sprites.js');
const { ENEMY_DEFS, TOWER_DEFS } = require('../src/core/config.js');
const { MAP_DEFS } = require('../src/data/maps.js');

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

test('Sprites: every tower has pixel art for each level 1-4', () => {
  for (const type of Object.keys(TOWER_DEFS)) for (let lv = 1; lv <= 4; lv++) checkSprite(`tower:${type}:${lv}`);
});

test('Sprites: each tower level looks different and adds detail as it goes up', () => {
  const painted = g => g.join('').replace(/[.o]/g, '').length;
  for (const type of Object.keys(TOWER_DEFS)) {
    const grids = [1, 2, 3, 4].map(lv => S.sprite(`tower:${type}:${lv}`).grid);
    assert.equal(new Set(grids.map(g => g.join('|'))).size, 4, `${type}: 4 different looks`);
    for (let i = 1; i < 4; i++) assert.ok(painted(grids[i]) >= painted(grids[i - 1]), `${type}: level ${i + 1} not less detailed than ${i}`);
  }
  assert.equal(S.sprite('tower:gun').grid.join(), S.sprite('tower:gun:1').grid.join(), 'no level means level 1');
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
  for (const type of Object.keys(TOWER_DEFS)) for (let lv = 1; lv <= 4; lv++) {
    const g = S.sprite(`tower:${type}:${lv}`).grid;
    assert.deepEqual([g[0].length, g.length], [16, 16]);
  }
  for (const g of Object.values(S.BASE_ART)) assert.deepEqual([g[0].length, g.length], [16, 16]);
  for (const g of Object.values(S.DECO_ART)) assert.deepEqual([g[0].length, g.length], [8, 8]);
});
