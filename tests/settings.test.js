'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Settings, RESOLUTIONS, SETTINGS_KEY, BOARD_W, BOARD_H } = require('../src/core/settings.js');
const { META_UPGRADES, UPGRADE_TABS } = require('../src/core/config.js');
const { MemoryStorage, makeGame, runUntil } = require('./helpers.js');

test('Settings: defaults are auto resolution, sfx 70%, music 40%, other 70%', () => {
  const s = new Settings(new MemoryStorage());
  assert.deepEqual({ r: s.resolution, sfx: s.sfx, music: s.music, ui: s.ui }, { r: 'auto', sfx: 0.7, music: 0.4, ui: 0.7 });
});

test('Settings: changes are saved and survive a reload; volumes are clamped to 0..1', () => {
  const storage = new MemoryStorage();
  const s = new Settings(storage);
  assert.ok(s.setResolution('1200x800'));
  assert.ok(s.setVolume('music', 1.5));
  assert.ok(s.setVolume('sfx', -1));
  assert.equal(s.setResolution('4k'), false);
  assert.equal(s.setVolume('master', 0.5), false);
  const again = new Settings(storage);
  assert.equal(again.resolution, '1200x800');
  assert.equal(again.music, 1);
  assert.equal(again.sfx, 0);
  assert.ok(storage.getItem(SETTINGS_KEY));
});

test('Settings: a resolution saved by an older version (old board size) falls back to auto', () => {
  const s = new Settings(new MemoryStorage({ [SETTINGS_KEY]: JSON.stringify({ resolution: '1200x780', music: 0.2 }) }));
  assert.equal(s.resolution, 'auto');
  assert.equal(s.music, 0.2);
});

test('Settings: corrupt or blocked storage falls back to defaults', () => {
  assert.equal(new Settings(new MemoryStorage({ [SETTINGS_KEY]: '{oops' })).resolution, 'auto');
  const bad = new Settings(new MemoryStorage({ [SETTINGS_KEY]: JSON.stringify({ resolution: 'huge', sfx: 'loud' }) }));
  assert.equal(bad.resolution, 'auto');
  assert.equal(bad.sfx, 0.7);
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const s = new Settings(throwing);
  assert.ok(s.setVolume('ui', 0.2));
  assert.equal(s.ui, 0.2);
});

test('Settings.displaySize: fixed sizes keep the 3:2 board, auto fits the space given', () => {
  const s = new Settings();
  for (const [id, r] of Object.entries(RESOLUTIONS)) {
    if (!r.width) continue;
    s.setResolution(id);
    assert.deepEqual(s.displaySize(5000, 5000), { width: r.width, height: r.width * BOARD_H / BOARD_W }, `${id} when it fits`);
  }
  s.setResolution('auto');
  assert.deepEqual(Object.keys(RESOLUTIONS), ['auto', '960x640', '1200x800', '1440x960']);
  assert.deepEqual(s.displaySize(1200, 2000), { width: 1200, height: 800 }, 'limited by width');
  assert.deepEqual(s.displaySize(5000, 640), { width: 960, height: 640 }, 'limited by height');
  assert.equal(s.displaySize(100, 100).width, 320, 'never smaller than 320px');
});

test('Upgrade tabs: every permanent upgrade belongs to an existing tab, and each tab has items', () => {
  for (const [key, u] of Object.entries(META_UPGRADES)) assert.ok(u.tab in UPGRADE_TABS, key);
  assert.deepEqual(Object.keys(UPGRADE_TABS), ['attack', 'economy', 'towers']);
  for (const tab of ['attack', 'economy']) assert.ok(Object.values(META_UPGRADES).some(u => u.tab === tab), tab);
});

test('Game: forfeit ends the run and pays coins for waves cleared, once', () => {
  const game = makeGame();
  let result = null;
  game.on('gameover', r => { result = r; });
  game.startWave();
  game.spawnQueue = [];
  game.update(0.02);
  game.choosePerk(0);
  assert.ok(game.forfeit());
  assert.equal(game.phase, 'over');
  assert.equal(result.wavesCleared, 1);
  assert.equal(game.meta.coins, 5);
  assert.equal(game.forfeit(), false);
});

test('Game: emits sound events for shots, kills, base hits, skips and new routes', () => {
  const game = makeGame();
  game.gold = 1000;
  game.buildTower('gun', 3, 3);
  const seen = {};
  for (const name of ['fire', 'kill', 'basehit', 'skip', 'routeopen']) game.on(name, () => { seen[name] = (seen[name] || 0) + 1; });
  game.startWave();
  runUntil(game, g => g.phase !== 'wave');
  assert.ok(seen.fire > 0 && seen.kill > 0, 'gun fired and killed');
  assert.ok(seen.basehit > 0, 'one gun cannot stop wave 1');
  game.choosePerk(0);
  game.skipCountdown();
  assert.equal(seen.skip, 1);
  while (game.wave < 10) { game.spawnQueue = []; game.countdown = 0.01; game.update(0.02); if (game.phase === 'perk') game.choosePerk(0); game.hp = 20; }
  assert.equal(seen.routeopen, 1);
});

test('Settings.displaySize: a fixed size bigger than the space shrinks to fit, so nothing scrolls', () => {
  const s = new Settings();
  s.setResolution('1440x960');
  assert.deepEqual(s.displaySize(1200, 700), { width: 1050, height: 700 }, 'limited by height');
  assert.deepEqual(s.displaySize(900, 2000), { width: 900, height: 600 }, 'limited by width');
  s.setResolution('960x640');
  assert.deepEqual(s.displaySize(2000, 2000), { width: 960, height: 640 }, 'never grows past the chosen size');
});
