'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { SaveSlots, SLOT_COUNT, slotKey } = require('../src/core/saves.js');
const { SAVE_KEY } = require('../src/core/config.js');
const { MemoryStorage } = require('./helpers.js');

test('SaveSlots: 3 slots, all empty on a new device, slot 1 picked by default', () => {
  const saves = new SaveSlots(new MemoryStorage());
  assert.equal(SLOT_COUNT, 3);
  assert.deepEqual(saves.summaries().map(s => s.empty), [true, true, true]);
  assert.equal(saves.lastSlot(), 1);
});

test('SaveSlots: each slot keeps its own coins, upgrades and unlocks', () => {
  const storage = new MemoryStorage();
  const saves = new SaveSlots(storage);
  const a = saves.open(1);
  a.coins = 200;
  assert.ok(a.buyUpgrade('dmg'));
  assert.ok(a.unlockTower('frost'));
  const b = saves.open(2);
  b.recordRun(5);

  const again = new SaveSlots(storage);
  const one = again.open(1), two = again.open(2), three = again.open(3);
  assert.equal(one.coins, 200 - 20 - 50);
  assert.equal(one.upgrades.dmg, 1);
  assert.ok(one.isUnlocked('frost'));
  assert.equal(two.coins, 33);
  assert.equal(two.upgrades.dmg, 0);
  assert.ok(!two.isUnlocked('frost'));
  assert.equal(three.coins, 0);
  assert.deepEqual(again.summary(2), { slot: 2, empty: false, coins: 33, best: 5, runs: 1 });
});

test('SaveSlots: opening an empty slot does not use it up; it stays empty until saved', () => {
  const saves = new SaveSlots(new MemoryStorage());
  saves.open(3);
  assert.equal(saves.summary(3).empty, true);
  assert.equal(saves.lastSlot(), 3, 'remembers the last slot');
});

test('SaveSlots: deleting a slot empties only that slot', () => {
  const storage = new MemoryStorage();
  const saves = new SaveSlots(storage);
  saves.open(1).recordRun(3);
  saves.open(2).recordRun(4);
  saves.remove(1);
  assert.equal(saves.summary(1).empty, true);
  assert.equal(saves.open(1).coins, 0);
  assert.equal(saves.summary(2).runs, 1);
});

test('SaveSlots: progress from before slots existed moves into slot 1 once, old data kept', () => {
  const old = JSON.stringify({ coins: 77, best: 9, runs: 4, upgrades: { dmg: 2 }, unlocked: { cannon: true } });
  const storage = new MemoryStorage({ [SAVE_KEY]: old });
  const saves = new SaveSlots(storage);
  const meta = saves.open(1);
  assert.equal(meta.coins, 77);
  assert.equal(meta.upgrades.dmg, 2);
  assert.ok(meta.isUnlocked('cannon'));
  assert.equal(storage.getItem(SAVE_KEY), old, 'old save left as a backup');

  saves.remove(1);
  assert.equal(new SaveSlots(storage).summary(1).empty, true, 'not migrated again after deleting slot 1');
});

test('SaveSlots: corrupt slot data shows as empty and loads as a fresh save; bad slot numbers are rejected', () => {
  const saves = new SaveSlots(new MemoryStorage({ [slotKey(2)]: '{broken' }));
  assert.equal(saves.summary(2).empty, true);
  assert.equal(saves.open(2).coins, 0);
  assert.throws(() => saves.open(4), /No save slot 4/);
  assert.throws(() => saves.open(0), /No save slot 0/);
});

test('SaveSlots: works without storage, and when storage throws', () => {
  const none = new SaveSlots(null);
  assert.equal(none.summary(1).empty, true);
  assert.equal(none.open(1).coins, 0);
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  const s = new SaveSlots(throwing);
  assert.equal(s.lastSlot(), 1);
  assert.doesNotThrow(() => s.remove(1));
  assert.equal(s.open(2).coins, 0);
});
