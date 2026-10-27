'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Tower } = require('../src/core/tower.js');
const { Projectile } = require('../src/core/projectile.js');
const { TOWER_DEFS, MAX_TOWER_LEVEL, defaultModifiers } = require('../src/core/config.js');

const near = (a, b) => Math.abs(a - b) < 1e-9;

test('Tower: level 1 with no upgrades uses the base stats', () => {
  const s = new Tower('gun', 0, 0).stats();
  assert.equal(s.dmg, TOWER_DEFS.gun.dmg);
  assert.equal(s.rate, TOWER_DEFS.gun.rate);
  assert.equal(s.range, TOWER_DEFS.gun.range);
  assert.equal(s.splash, 0);
  assert.equal(s.crit, 0);
});

test('Tower: levels, permanent upgrades and perks all multiply damage', () => {
  const t = new Tower('gun', 0, 0);
  t.level = 2;
  const mods = { ...defaultModifiers(), dmg: 1.15 };
  const s = t.stats(mods, { dmg: 5, rate: 0, range: 0, crit: 2 });
  assert.ok(near(s.dmg, 8 * 1.6 * 1.5 * 1.15));
  assert.ok(near(s.crit, 0.06));
});

test('Tower: frost slow is capped at 80%', () => {
  const s = new Tower('frost', 0, 0).stats({ ...defaultModifiers(), slow: 5 });
  assert.equal(s.slow, 0.8);
});

test('Tower: upgrade cost scales with level, stops at max level', () => {
  const t = new Tower('gun', 0, 0, 50);
  assert.equal(t.upgradeCost(), 40);
  assert.ok(t.upgrade(40));
  assert.equal(t.upgradeCost(), 80);
  assert.equal(t.upgradeCost(0.9), 72);
  t.level = MAX_TOWER_LEVEL;
  assert.ok(t.isMaxLevel);
  assert.equal(t.upgrade(0), false);
});

test('Tower: sells for 70% of everything spent', () => {
  const t = new Tower('gun', 0, 0, 50);
  t.upgrade(40);
  assert.equal(t.sellValue, 63);
});

test('Tower: targets the in-range enemy furthest along the path', () => {
  const t = new Tower('gun', 0, 0); // at (20,20)
  const enemies = [
    { x: 60, y: 20, radius: 5, distance: 10, dead: false },
    { x: 80, y: 20, radius: 5, distance: 50, dead: false },
    { x: 80, y: 20, radius: 5, distance: 90, dead: true },
    { x: 500, y: 20, radius: 5, distance: 999, dead: false },
  ];
  assert.equal(t.findTarget(enemies, 110), enemies[1]);
  assert.equal(t.findTarget([], 110), null);
});

test('Tower: tick fires once per cooldown', () => {
  const t = new Tower('gun', 0, 0);
  const stats = t.stats();
  const enemy = { x: 60, y: 20, radius: 5, distance: 1, dead: false };
  assert.equal(t.tick(0.01, [enemy], stats), enemy);
  assert.equal(t.tick(0.01, [enemy], stats), null);
  assert.equal(t.tick(1 / stats.rate, [enemy], stats), enemy);
  assert.equal(t.tick(10, [], stats), null);
});

test('Tower: rejects unknown types', () => {
  assert.throws(() => new Tower('laser', 0, 0), /Unknown tower/);
});

test('Projectile: homes on its target and lands on the last position if it dies', () => {
  const target = { x: 100, y: 0, dead: false };
  const p = new Projectile({ x: 0, y: 0, target, speed: 50, damage: 1 });
  assert.equal(p.update(1), false);
  assert.equal(p.x, 50);
  target.y = 10;
  target.dead = true;
  target.x = 999;
  assert.equal(p.update(1), true);
  assert.deepEqual([p.x, p.y, p.done], [100, 0, true]);
});
