'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { WaveGenerator } = require('../src/core/wave.js');
const { PERKS, PerkPicker } = require('../src/core/perks.js');
const { createRng } = require('../src/core/utils.js');
const { MAX_HP } = require('../src/core/config.js');
const { makeGame, makeMeta } = require('./helpers.js');

test('WaveGenerator: enemy count grows each wave', () => {
  const w = new WaveGenerator(createRng(1));
  assert.equal(w.build(1).length, 7);
  assert.ok(w.build(20).length > w.build(5).length);
});

test('WaveGenerator: waves 1-2 are all normal, fast from wave 3, tanks from wave 5', () => {
  const w = new WaveGenerator(createRng(7));
  for (const wave of [1, 2]) assert.ok(w.build(wave).every(t => t === 'normal'));
  for (let i = 0; i < 20; i++) assert.ok(!w.build(3).includes('tank'));
  const many = Array.from({ length: 20 }, () => w.build(8)).flat();
  assert.ok(many.includes('fast') && many.includes('tank'));
});

test('WaveGenerator: one boss per 10 waves on every 10th wave only', () => {
  const w = new WaveGenerator(createRng(3));
  const bosses = n => w.build(n).filter(t => t === 'boss').length;
  assert.equal(bosses(9), 0);
  assert.equal(bosses(10), 1);
  assert.equal(bosses(20), 2);
  assert.equal(bosses(21), 0);
});

test('WaveGenerator: same seed gives the same wave', () => {
  assert.deepEqual(new WaveGenerator(createRng(42)).build(12), new WaveGenerator(createRng(42)).build(12));
});

test('WaveGenerator: spawn interval shrinks but never below 0.3s', () => {
  const w = new WaveGenerator();
  assert.ok(w.spawnInterval(10) < w.spawnInterval(1));
  assert.equal(w.spawnInterval(100), 0.3);
});

test('PerkPicker: offers 3 distinct perks', () => {
  const picks = new PerkPicker(createRng(5)).choices(makeGame());
  assert.equal(picks.length, 3);
  assert.equal(new Set(picks.map(p => p.id)).size, 3);
});

test('PerkPicker: heal only offered when the base is damaged', () => {
  const game = makeGame();
  const picker = new PerkPicker(createRng(1));
  assert.ok(!picker.available(game).some(p => p.id === 'heal'));
  game.hp = 10;
  assert.ok(picker.available(game).some(p => p.id === 'heal'));
});

test('PerkPicker: tower-specific perks need the tower unlocked', () => {
  const picker = new PerkPicker(createRng(1));
  const locked = picker.available(makeGame()).map(p => p.id);
  assert.ok(!locked.includes('slow') && !locked.includes('splash'));

  const meta = makeMeta();
  meta.unlocked.frost = true;
  const unlocked = picker.available(makeGame({ meta })).map(p => p.id);
  assert.ok(unlocked.includes('slow') && unlocked.includes('splash'));
});

test('Perks: effects are additive and heal is capped at max HP', () => {
  const game = makeGame();
  const perk = id => PERKS.find(p => p.id === id);
  perk('dmg').apply(game);
  perk('dmg').apply(game);
  assert.ok(Math.abs(game.mods.dmg - 1.3) < 1e-9);

  game.hp = MAX_HP - 1;
  perk('heal').apply(game);
  assert.equal(game.hp, MAX_HP);

  const gold = game.gold;
  game.wave = 4;
  perk('cash').apply(game);
  assert.equal(game.gold, gold + 100);
});
