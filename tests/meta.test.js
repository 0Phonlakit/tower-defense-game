'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { MetaProgress } = require('../src/core/meta.js');
const { META_UPGRADES, SAVE_KEY } = require('../src/core/config.js');
const { MemoryStorage } = require('./helpers.js');

test('coinsForWaves: more waves give more coins, growing faster than linear', () => {
  assert.equal(MetaProgress.coinsForWaves(0), 0);
  assert.equal(MetaProgress.coinsForWaves(2), 11);
  assert.equal(MetaProgress.coinsForWaves(5), 33);
  assert.equal(MetaProgress.coinsForWaves(10), 83);
  assert.equal(MetaProgress.coinsForWaves(20), 233);
});

test('new save: no coins, only the machine gun unlocked', () => {
  const meta = new MetaProgress(new MemoryStorage());
  assert.equal(meta.coins, 0);
  assert.deepEqual(meta.unlocked, {
    gun: true, cannon: false, frost: false, sniper: false, flame: false, tesla: false, tide: false, poison: false,
  });
  assert.ok(Object.values(meta.upgrades).every(l => l === 0));
});

test('buyUpgrade: spends coins, raises level, cost grows per level', () => {
  const meta = new MetaProgress(new MemoryStorage());
  meta.coins = 100;
  assert.equal(meta.upgradeCost('dmg'), 20);
  assert.equal(meta.buyUpgrade('dmg'), true);
  assert.equal(meta.coins, 80);
  assert.equal(meta.upgrades.dmg, 1);
  assert.equal(meta.upgradeCost('dmg'), 35);
});

test('buyUpgrade: refuses without enough coins, at max level, or for unknown keys', () => {
  const meta = new MetaProgress(new MemoryStorage());
  meta.coins = 10;
  assert.equal(meta.buyUpgrade('dmg'), false);
  assert.equal(meta.upgrades.dmg, 0);

  meta.coins = 1e6;
  meta.upgrades.rate = META_UPGRADES.rate.max;
  assert.equal(meta.buyUpgrade('rate'), false);
  assert.equal(meta.buyUpgrade('nope'), false);
  assert.equal(meta.coins, 1e6);
});

test('unlockTower: unlocks once and charges the unlock price', () => {
  const meta = new MetaProgress(new MemoryStorage());
  meta.coins = 70;
  assert.equal(meta.unlockTower('cannon'), true);
  assert.equal(meta.coins, 10);
  assert.ok(meta.isUnlocked('cannon'));
  assert.equal(meta.unlockTower('cannon'), false);
  assert.equal(meta.unlockTower('sniper'), false);
  assert.equal(meta.unlockTower('gun'), false);
});

test('recordRun: pays coins, tracks best and runs', () => {
  const meta = new MetaProgress(new MemoryStorage());
  assert.deepEqual(meta.recordRun(10), { wavesCleared: 10, coins: 83, newBest: true, totalCoins: 83 });
  assert.deepEqual(meta.recordRun(4), { wavesCleared: 4, coins: 25, newBest: false, totalCoins: 108 });
  assert.equal(meta.best, 10);
  assert.equal(meta.runs, 2);
});

test('progress persists through storage and survives a reload', () => {
  const storage = new MemoryStorage();
  const meta = new MetaProgress(storage);
  meta.coins = 200;
  meta.buyUpgrade('crit');
  meta.unlockTower('frost');

  const reloaded = new MetaProgress(storage);
  assert.equal(reloaded.coins, 120);
  assert.equal(reloaded.upgrades.crit, 1);
  assert.ok(reloaded.isUnlocked('frost'));
});

test('load: corrupt or partial saves fall back to defaults', () => {
  const corrupt = new MetaProgress(new MemoryStorage({ [SAVE_KEY]: '{not json' }));
  assert.equal(corrupt.coins, 0);

  const partial = new MetaProgress(new MemoryStorage({ [SAVE_KEY]: JSON.stringify({ coins: 5, upgrades: { dmg: 2 } }) }));
  assert.equal(partial.coins, 5);
  assert.equal(partial.upgrades.dmg, 2);
  assert.equal(partial.upgrades.rate, 0);
  assert.ok(partial.isUnlocked('gun'));
});

test('works without storage and when storage throws', () => {
  const none = new MetaProgress(null);
  none.coins = 50;
  assert.equal(none.buyUpgrade('startGold'), true);

  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const meta = new MetaProgress(throwing);
  meta.coins = 50;
  assert.equal(meta.buyUpgrade('startGold'), true);
});

test('reset: wipes progress and saves the wipe', () => {
  const storage = new MemoryStorage();
  const meta = new MetaProgress(storage);
  meta.recordRun(10);
  meta.reset();
  assert.equal(meta.coins, 0);
  assert.equal(new MetaProgress(storage).best, 0);
});
