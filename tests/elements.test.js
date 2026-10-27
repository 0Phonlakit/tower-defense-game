'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Enemy } = require('../src/core/enemy.js');
const { Tower } = require('../src/core/tower.js');
const {
  TOWER_DEFS, REACTIONS, AURA_DURATION, BURN_DURATION, POISON_MAX_STACKS, reactionFor,
} = require('../src/core/config.js');
const { makeGame, makeMeta } = require('./helpers.js');

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

function enemyAt(game, x, y, type = 'boss') {
  const e = new Enemy(type, 1, game.map.routes[0]);
  e.x = x;
  e.y = y;
  game.enemies.push(e);
  return e;
}

// Hits `enemy` with `element` (no damage) so it carries that aura.
function prime(game, enemy, element) {
  game._hit(enemy, 0, { element });
  assert.equal(enemy.activeAura(game.time), element);
}

function reactions(game) {
  const seen = [];
  game.on('reaction', r => seen.push(r.id));
  return seen;
}

test('reactionFor: order does not matter; same or missing element gives none', () => {
  assert.equal(reactionFor('ice', 'fire').id, 'melt');
  assert.equal(reactionFor('fire', 'ice').id, 'melt');
  assert.equal(reactionFor('water', 'fire').id, 'vaporize');
  assert.equal(reactionFor('lightning', 'fire').id, 'overload');
  assert.equal(reactionFor('water', 'ice').id, 'freeze');
  assert.equal(reactionFor('lightning', 'ice').id, 'superconduct');
  assert.equal(reactionFor('water', 'lightning').id, 'electrocharged');
  assert.equal(reactionFor('fire', 'fire'), null);
  assert.equal(reactionFor(null, 'fire'), null);
  assert.equal(Object.keys(REACTIONS).length, 6);
});

test('Towers: frost and the new elemental towers carry their element; physical towers do not', () => {
  const element = type => new Tower(type, 0, 0).stats().element;
  assert.equal(element('frost'), 'ice');
  assert.equal(element('flame'), 'fire');
  assert.equal(element('tesla'), 'lightning');
  assert.equal(element('tide'), 'water');
  for (const type of ['gun', 'cannon', 'sniper', 'poison']) assert.equal(element(type), null, type);
  assert.deepEqual(Object.values(TOWER_DEFS).map(d => d.key), ['1', '2', '3', '4', '5', '6', '7', '8']);
});

test('Towers: burn and poison scale with level like damage', () => {
  const flame = new Tower('flame', 0, 0);
  const poison = new Tower('poison', 0, 0);
  assert.equal(flame.stats().burn, TOWER_DEFS.flame.burn);
  flame.upgrade(0);
  poison.upgrade(0);
  assert.ok(near(flame.stats().burn, TOWER_DEFS.flame.burn * 1.6));
  assert.ok(near(poison.stats().poison, TOWER_DEFS.poison.poison * 1.6));
  assert.equal(new Tower('tesla', 0, 0).stats().chain, 2);
});

test('Enemy: aura expires, freeze stops movement, superconduct raises damage taken', () => {
  const game = makeGame();
  const e = new Enemy('normal', 1, game.map.routes[0]);
  e.setAura('fire', 0);
  assert.equal(e.activeAura(AURA_DURATION - 0.01), 'fire');
  assert.equal(e.activeAura(AURA_DURATION), null);

  e.freeze(1.5, 0);
  e.update(1, 1);
  assert.equal(e.distance, 0, 'frozen enemies do not move');
  e.update(1, 2);
  assert.ok(e.distance > 0);

  e.makeVulnerable(0.25, 4, 0);
  assert.equal(e.damageTakenMultiplier(1), 1.25);
  assert.equal(e.damageTakenMultiplier(4), 1);
});

test('Enemy: burn keeps the strongest; poison stacks up to the cap and resets after expiring', () => {
  const e = new Enemy('normal', 1, makeGame().map.routes[0]);
  e.applyBurn(8, 0);
  e.applyBurn(5, 1);
  assert.ok(near(e.dotDamage(1, 2), 8));
  assert.equal(e.dotDamage(1, 1 + BURN_DURATION), 0);

  const p = new Enemy('normal', 1, makeGame().map.routes[0]);
  for (let i = 0; i < 7; i++) p.applyPoison(6, 0);
  assert.equal(p.poisonStacks, POISON_MAX_STACKS);
  assert.ok(near(p.dotDamage(1, 1), 6 * POISON_MAX_STACKS));
  p.applyPoison(6, 100);
  assert.equal(p.poisonStacks, 1, 'expired stacks are dropped');
});

test('Game: the first element sets an aura; the same element only refreshes it', () => {
  const game = makeGame();
  const seen = reactions(game);
  const e = enemyAt(game, 100, 100);
  game._hit(e, 10, { element: 'fire' });
  game._hit(e, 10, { element: 'fire' });
  assert.deepEqual(seen, []);
  assert.equal(e.activeAura(game.time), 'fire');
  assert.ok(near(e.maxHp - e.hp, 20));
});

test('Game: Melt doubles and Vaporize x1.5 the triggering hit, and both clear the aura', () => {
  for (const [aura, element, mult, id] of [['ice', 'fire', 2, 'melt'], ['water', 'fire', 1.5, 'vaporize']]) {
    const game = makeGame();
    const seen = reactions(game);
    const e = enemyAt(game, 100, 100);
    prime(game, e, aura);
    game._hit(e, 10, { element });
    assert.deepEqual(seen, [id]);
    assert.ok(near(e.maxHp - e.hp, 10 * mult), id);
    assert.equal(e.activeAura(game.time), null);
  }
});

test('Game: Overload blasts every enemy nearby for 1.5x, not far ones', () => {
  const game = makeGame();
  const target = enemyAt(game, 100, 100);
  const close = enemyAt(game, 140, 100);
  const far = enemyAt(game, 300, 100);
  prime(game, target, 'fire');
  game._hit(target, 10, { element: 'lightning' });
  assert.ok(near(target.maxHp - target.hp, 10 + 15));
  assert.ok(near(close.maxHp - close.hp, 15));
  assert.equal(far.hp, far.maxHp);
});

test('Game: Freeze stops an enemy for 1.5s, a boss only 0.5s', () => {
  for (const [type, duration] of [['tank', 1.5], ['boss', 0.5]]) {
    const game = makeGame();
    const e = enemyAt(game, 100, 100, type);
    prime(game, e, 'water');
    game._hit(e, 1, { element: 'ice' });
    assert.ok(e.isFrozen(game.time + duration - 0.01), type);
    assert.ok(!e.isFrozen(game.time + duration), type);
  }
});

test('Game: Superconduct makes the enemy take 25% more from later hits', () => {
  const game = makeGame();
  const e = enemyAt(game, 100, 100);
  prime(game, e, 'ice');
  game._hit(e, 10, { element: 'lightning' });
  const hp = e.hp;
  game._hit(e, 10, {});
  assert.ok(near(hp - e.hp, 12.5));
});

test('Game: Electro-charged shocks up to 3 other nearby enemies for 50%', () => {
  const game = makeGame();
  const seen = reactions(game);
  const target = enemyAt(game, 100, 100);
  const others = [130, 160, 170, 100].map((x, i) => enemyAt(game, x, i === 3 ? 160 : 100));
  const far = enemyAt(game, 400, 100);
  prime(game, target, 'water');
  game._hit(target, 20, { element: 'lightning' });
  assert.deepEqual(seen, ['electrocharged']);
  assert.equal(others.filter(e => near(e.maxHp - e.hp, 10)).length, 3);
  assert.equal(far.hp, far.maxHp);
});

test('Game: Tesla chains to 2 more enemies with 70% falloff per jump', () => {
  const meta = makeMeta();
  meta.unlocked.tesla = true;
  const game = makeGame({ meta });
  const tower = game.buildTower('tesla', 3, 3);
  const [a, b, c] = [0, 50, 100].map(dx => enemyAt(game, tower.x + 40 + dx, tower.y));
  a.distance = 10; // furthest along the path, so the tower targets it first
  game._fire(tower, a, game.towerStats(tower));
  const dmg = TOWER_DEFS.tesla.dmg * 0.8; // anti-air tower vs ground
  assert.ok(near(a.maxHp - a.hp, dmg));
  assert.ok(near(b.maxHp - b.hp, dmg * 0.7));
  assert.ok(near(c.maxHp - c.hp, dmg * 0.49));
});

test('Game: burn and poison damage enemies every frame and kills pay gold', () => {
  const game = makeGame();
  game.phase = 'wave';
  game.spawnQueue = [{ type: 'normal', route: 0 }];
  game.spawnTimer = 999;
  const e = enemyAt(game, 100, 100, 'normal');
  e.distance = 100;
  e.applyBurn(1000, game.time);
  const gold = game.gold;
  game.update(0.05);
  assert.ok(e.dead);
  assert.equal(game.kills, 1);
  assert.ok(game.gold > gold);
});

test('Shots remember which tower fired them and leave a matching hit effect', () => {
  const meta = makeMeta();
  for (const k of Object.keys(TOWER_DEFS)) meta.unlocked[k] = true;
  const game = makeGame({ meta });
  game.gold = 1e6;
  const cannon = game.buildTower('cannon', 2, 0) || game.buildTower('cannon', 2, 1);
  const tesla = game.buildTower('tesla', 6, 0) || game.buildTower('tesla', 6, 1);
  const target = enemyAt(game, cannon.x + 30, cannon.y + 30);
  game._fire(cannon, target, game.towerStats(cannon));
  assert.equal(game.projectiles.at(-1).kind, 'cannon');
  game._impact(game.projectiles.at(-1));
  assert.ok(game.effects.some(fx => fx.kind === 'impact' && fx.style === 'cannon'));
  game._fire(tesla, target, game.towerStats(tesla));
  assert.ok(game.effects.some(fx => fx.kind === 'tracer' && fx.style === 'tesla'));
  assert.ok(game.effects.some(fx => fx.kind === 'impact' && fx.style === 'tesla'));
});
