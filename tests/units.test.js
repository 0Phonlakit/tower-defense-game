'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Enemy } = require('../src/core/enemy.js');
const { Tower } = require('../src/core/tower.js');
const { WaveGenerator } = require('../src/core/wave.js');
const { MAP_DEFS, GameMap } = require('../src/core/maps.js');
const { ENEMY_DEFS, TOWER_DEFS, AIR_BONUS, AA_GROUND_MULT } = require('../src/core/config.js');
const { createRng } = require('../src/core/utils.js');
const { makeGame, makeMeta } = require('./helpers.js');

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const uniqueTypes = Object.keys(ENEMY_DEFS).filter(t => ENEMY_DEFS[t].unique);

function enemyAt(game, type, x = 100, y = 100) {
  const e = new Enemy(type, 1, game.map.routes[0]);
  e.x = x;
  e.y = y;
  game.enemies.push(e);
  return e;
}

test('Maps: every map has 2 unique units of its own, 20 in total, 9 of them flying', () => {
  const all = MAP_DEFS.flatMap(d => d.uniques);
  for (const d of MAP_DEFS) assert.equal(d.uniques.length, 2, d.id);
  assert.equal(new Set(all).size, 20);
  assert.deepEqual([...all].sort(), [...uniqueTypes].sort());
  assert.equal(uniqueTypes.filter(t => ENEMY_DEFS[t].flying).length, 9);
});

test('Unique units: tougher than a tank but weaker than a boss for the tough ones; each has a resistance', () => {
  for (const t of uniqueTypes) {
    const d = ENEMY_DEFS[t];
    assert.ok(Object.keys(d.resist).length >= 1, t);
    assert.ok(d.hp < ENEMY_DEFS.boss.hp, t);
  }
  const tough = uniqueTypes.filter(t => ENEMY_DEFS[t].hp > ENEMY_DEFS.tank.hp);
  assert.equal(tough.length, 10);
});

test('Lava map: Lava spirit is immune to fire, Magma golem takes 35% fire damage', () => {
  const lava = MAP_DEFS.find(d => d.id === 'lava');
  assert.deepEqual(lava.uniques, ['lavaspirit', 'magmagolem']);
  const game = makeGame({ map: new GameMap(lava) });
  const spirit = enemyAt(game, 'lavaspirit');
  const golem = enemyAt(game, 'magmagolem');
  for (const e of [spirit, golem]) game._hit(e, 100, { element: 'fire', dmgType: 'fire', burn: 50 });
  assert.equal(spirit.hp, spirit.maxHp, 'no fire damage');
  assert.equal(spirit.activeAura(game.time), null, 'no fire aura');
  assert.equal(spirit.dotDamage(1, game.time), 0, 'no burn');
  assert.ok(near(golem.maxHp - golem.hp, 35));
  assert.ok(near(golem.dotDamage(1, game.time + 0.5), 50 * 0.35), 'burn is resisted too');
  game._hit(spirit, 100, { dmgType: 'physical' });
  assert.ok(near(spirit.maxHp - spirit.hp, 100), 'other damage types hit normally');
});

test('Immune hits show IMMUNE at most once per second', () => {
  const game = makeGame();
  const e = enemyAt(game, 'bee');
  for (let i = 0; i < 5; i++) game._hit(e, 10, { dmgType: 'poison', poison: 5 });
  assert.equal(game.effects.filter(fx => fx.text === 'IMMUNE').length, 1);
  assert.equal(e.poisonStacks, 0);
});

test('Towers: only Gun, Sniper and Tesla can hit air; Poison deals poison damage', () => {
  const air = Object.keys(TOWER_DEFS).filter(t => new Tower(t, 0, 0).stats().air);
  assert.deepEqual(air, ['gun', 'sniper', 'tesla']);
  assert.equal(new Tower('poison', 0, 0).stats().dmgType, 'poison');
  assert.equal(new Tower('gun', 0, 0).stats().dmgType, 'physical');
  assert.equal(new Tower('flame', 0, 0).stats().dmgType, 'fire');
});

test('Targeting: ground-only towers ignore flyers, anti-air towers pick them', () => {
  const game = makeGame();
  const flyer = enemyAt(game, 'bee', 140, 140);
  flyer.distance = 50;
  const cannon = new Tower('cannon', 3, 3);
  const gun = new Tower('gun', 3, 3);
  assert.equal(cannon.findTarget(game.enemies, 200, cannon.stats().air), null);
  assert.equal(gun.findTarget(game.enemies, 200, gun.stats().air), flyer);
});

test('Anti-air towers deal x1.15 to flyers and x0.8 to ground units', () => {
  const game = makeGame();
  const flyer = enemyAt(game, 'gargoyle');
  const walker = enemyAt(game, 'beetle');
  const normal = enemyAt(game, 'boss');
  game._hit(flyer, 100, { air: true, dmgType: 'lightning' });
  game._hit(walker, 100, { air: true, dmgType: 'lightning' });
  game._hit(normal, 100, { dmgType: 'physical' });
  assert.ok(near(flyer.maxHp - flyer.hp, 100 * AIR_BONUS));
  assert.ok(near(walker.maxHp - walker.hp, 100 * AA_GROUND_MULT));
  assert.ok(near(normal.maxHp - normal.hp, 100), 'ground-only towers deal full damage');
});

test('Gargoyle takes 50% physical damage; Haunted armor 35%', () => {
  const game = makeGame();
  const g = enemyAt(game, 'gargoyle');
  const h = enemyAt(game, 'hauntedarmor');
  game._hit(g, 10, { dmgType: 'physical', air: true });
  game._hit(h, 10, { dmgType: 'physical' });
  assert.ok(near(g.maxHp - g.hp, 10 * 0.5 * AIR_BONUS));
  assert.ok(near(h.maxHp - h.hp, 3.5));
});

test('Splash from ground-only towers does not hit flyers', () => {
  const { Projectile } = require('../src/core/projectile.js');
  const game = makeGame();
  const walker = enemyAt(game, 'normal', 300, 300);
  const flyer = enemyAt(game, 'bee', 305, 300);
  game._impact(new Projectile({ x: 300, y: 300, target: walker, speed: 1000, damage: 5, splash: 50 }));
  assert.ok(walker.hp < walker.maxHp);
  assert.equal(flyer.hp, flyer.maxHp);
});

test('Waves: no unique units before wave 5; from wave 5 about 25% rising to 40% by wave 20', () => {
  const gen = new WaveGenerator(createRng(7));
  const uniques = ['lavaspirit', 'magmagolem'];
  assert.ok(gen.build(4, uniques).every(t => !uniques.includes(t)));
  assert.equal(gen.uniqueShare(5), 0.25);
  assert.equal(gen.uniqueShare(20), 0.4);
  assert.equal(gen.uniqueShare(50), 0.4);
  let count = 0, total = 0;
  for (let i = 0; i < 300; i++) {
    const list = gen.build(20, uniques);
    total += list.filter(t => t !== 'boss').length;
    count += list.filter(t => uniques.includes(t)).length;
  }
  assert.ok(Math.abs(count / total - 0.4) < 0.03, `share ${count / total}`);
  assert.deepEqual(gen.build(5, []).filter(t => ENEMY_DEFS[t].unique), [], 'no uniques without a map list');
});

test('Game: a wave on the lava map only uses lava uniques, and they walk the planned routes', () => {
  const game = makeGame({ map: new GameMap(MAP_DEFS.find(d => d.id === 'lava')) });
  const seen = new Set();
  for (let w = 1; w <= 12; w++) game._planWave(w).queue.forEach(e => { if (ENEMY_DEFS[e.type].unique) seen.add(e.type); });
  assert.deepEqual([...seen].sort(), ['lavaspirit', 'magmagolem']);
});
