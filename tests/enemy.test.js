'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Enemy } = require('../src/core/enemy.js');
const { Path } = require('../src/core/path.js');
const { ENEMY_DEFS } = require('../src/core/config.js');

const path = new Path([[0, 0], [5, 0]]); // 160px long

test('Enemy: base damage per type (normal -1, fast -1, tank -2, boss -5)', () => {
  const dmg = Object.fromEntries(Object.keys(ENEMY_DEFS).map(t => [t, new Enemy(t, 1, path).damage]));
  assert.deepEqual(dmg, { normal: 1, fast: 1, tank: 2, boss: 5 });
});

test('Enemy: wave 1 HP equals the base HP, later waves scale up', () => {
  assert.equal(Enemy.hpMultiplier(1), 1);
  assert.equal(new Enemy('normal', 1, path).maxHp, ENEMY_DEFS.normal.hp);
  assert.ok(Enemy.hpMultiplier(10) > Enemy.hpMultiplier(5));
  assert.ok(Enemy.hpMultiplier(20) > 10);
});

test('Enemy: rejects unknown types', () => {
  assert.throws(() => new Enemy('dragon', 1, path), /Unknown enemy/);
});

test('Enemy: moves at its speed along the path', () => {
  const e = new Enemy('normal', 1, path);
  e.update(1, 0);
  assert.equal(e.distance, ENEMY_DEFS.normal.speed);
  assert.equal(e.x, 20 + ENEMY_DEFS.normal.speed);
});

test('Enemy: update reports reaching the base exactly once', () => {
  const e = new Enemy('fast', 1, path);
  assert.equal(e.update(1, 0), false);
  assert.equal(e.update(1, 0), true);
  assert.ok(e.dead && e.reachedBase);
  assert.equal(e.update(1, 0), false);
});

test('Enemy: takeDamage reports the killing blow once', () => {
  const e = new Enemy('normal', 1, path);
  assert.equal(e.takeDamage(10), false);
  assert.equal(e.hp, 12);
  assert.equal(e.takeDamage(12), true);
  assert.equal(e.takeDamage(5), false);
});

test('Enemy: slow reduces speed until it expires, stronger slow wins', () => {
  const e = new Enemy('normal', 1, path);
  e.applySlow(0.5, 2, 0);
  e.update(1, 0);
  assert.equal(e.distance, ENEMY_DEFS.normal.speed * 0.5);

  e.applySlow(0.2, 1, 1);
  assert.equal(e.slowAmount, 0.5);
  assert.equal(e.slowUntil, 2);

  assert.ok(!e.isSlowed(2.5));
  e.applySlow(0.2, 1, 3);
  assert.equal(e.slowAmount, 0.2);
});
