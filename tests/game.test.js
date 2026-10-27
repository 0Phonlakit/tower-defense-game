'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Game } = require('../src/core/game.js');
const { Enemy } = require('../src/core/enemy.js');
const { MAX_HP, STARTING_GOLD } = require('../src/core/config.js');
const { makeGame, makeMeta, runUntil } = require('./helpers.js');

test('Game: new run starts with 20 HP, starting gold, wave 0 in build phase', () => {
  const game = makeGame();
  assert.equal(game.hp, MAX_HP);
  assert.equal(MAX_HP, 20);
  assert.equal(game.gold, STARTING_GOLD);
  assert.equal(game.wave, 0);
  assert.equal(game.phase, 'build');
});

test('Game: starting gold includes the permanent upgrade', () => {
  const meta = makeMeta();
  meta.upgrades.startGold = 2;
  assert.equal(makeGame({ meta }).gold, STARTING_GOLD + 60);
});

test('Game: requires a MetaProgress', () => {
  assert.throws(() => new Game({}), /MetaProgress/);
});

test('Game: buildTower charges gold and blocks path, occupied, locked and unaffordable tiles', () => {
  const game = makeGame();
  const tower = game.buildTower('gun', 3, 3);
  assert.ok(tower);
  assert.equal(game.gold, STARTING_GOLD - 50);

  assert.equal(game.buildTower('gun', 3, 3), null, 'occupied');
  assert.equal(game.buildTower('gun', 4, 2), null, 'path tile');
  assert.equal(game.buildTower('gun', -1, 0), null, 'out of bounds');
  assert.equal(game.buildTower('cannon', 6, 6), null, 'locked');
  game.gold = 10;
  assert.equal(game.buildTower('gun', 6, 6), null, 'too poor');
  assert.equal(game.towers.length, 1);
});

test('Game: upgrade and sell towers', () => {
  const game = makeGame();
  const t = game.buildTower('gun', 3, 3);
  assert.ok(game.upgradeTower(t));
  assert.equal(t.level, 2);
  assert.equal(game.gold, STARTING_GOLD - 50 - 40);
  assert.ok(game.sellTower(t));
  assert.equal(game.gold, STARTING_GOLD - 90 + 63);
  assert.equal(game.towers.length, 0);
  assert.equal(game.sellTower(t), false);
});

test('Game: startWave only works in build phase', () => {
  const game = makeGame();
  assert.ok(game.startWave());
  assert.equal(game.phase, 'wave');
  assert.equal(game.wave, 1);
  assert.equal(game.startWave(), false);
});

test('Game: every normal enemy that reaches the base costs exactly 1 HP', () => {
  const game = makeGame();
  game.startWave();
  const hpDrops = [];
  let last = game.hp;
  runUntil(game, g => {
    if (g.hp !== last) { hpDrops.push(last - g.hp); last = g.hp; }
    return g.phase !== 'wave';
  });
  assert.equal(hpDrops.length, 7);
  assert.ok(hpDrops.every(d => d === 1));
  assert.equal(game.hp, MAX_HP - 7);
});

test('Game: tanks cost 2 HP and bosses 5 HP', () => {
  for (const [type, expected] of [['tank', 2], ['boss', 5]]) {
    const game = makeGame();
    game.startWave();
    game.spawnQueue = [type];
    runUntil(game, g => g.phase !== 'wave');
    assert.equal(game.hp, MAX_HP - expected, type);
  }
});

test('Game: towers kill enemies and earn gold', () => {
  const game = makeGame();
  game.gold = 1000;
  for (const [c, r] of [[3, 3], [5, 4], [5, 7], [3, 5]]) game.buildTower('gun', c, r);
  const goldAfterBuild = game.gold;
  game.startWave();
  runUntil(game, g => g.phase !== 'wave');
  assert.equal(game.hp, MAX_HP);
  assert.equal(game.kills, 7);
  assert.ok(game.gold > goldAfterBuild);
});

test('Game: clearing a wave pays the bonus and offers 3 perks', () => {
  const game = makeGame();
  game.buildTower('gun', 3, 3);
  game.startWave();
  game.spawnQueue = [];
  let event = null;
  game.on('wavecleared', e => { event = e; });
  const gold = game.gold;
  game.update(0.02);
  assert.equal(game.phase, 'perk');
  assert.equal(event.wave, 1);
  assert.equal(event.bonus, 25);
  assert.equal(game.gold, gold + 25);
  assert.equal(game.perkChoices.length, 3);
});

test('Game: choosing a perk applies it and returns to build phase', () => {
  const game = makeGame();
  game.startWave();
  game.spawnQueue = [];
  game.update(0.02);
  const before = JSON.stringify(game.mods) + game.gold + game.hp;
  assert.ok(game.choosePerk(0));
  assert.equal(game.phase, 'build');
  assert.equal(game.perksTaken.length, 1);
  assert.notEqual(JSON.stringify(game.mods) + game.gold + game.hp, before);
  assert.equal(game.choosePerk(0), false);
});

test('Game: interest is paid on wave clear and capped', () => {
  const game = makeGame();
  game.mods.interest = 0.1;
  game.gold = 100;
  game.startWave();
  game.spawnQueue = [];
  game.update(0.02);
  assert.equal(game.gold, 100 + 25 + 10);

  const rich = makeGame();
  rich.mods.interest = 0.2;
  rich.gold = 10000;
  rich.startWave();
  rich.spawnQueue = [];
  rich.update(0.02);
  assert.equal(rich.gold, 10000 + 25 + 60);
});

test('Game: HP 0 ends the run, pays coins by waves cleared and stops the simulation', () => {
  const meta = makeMeta();
  const game = makeGame({ meta });
  let result = null;
  game.on('gameover', r => { result = r; });

  for (let i = 0; i < 2; i++) {
    game.startWave();
    game.spawnQueue = [];
    game.update(0.02);
    game.choosePerk(0);
  }
  game.hp = 1;
  game.startWave();
  runUntil(game, g => g.isOver);

  assert.equal(game.hp, 0);
  assert.equal(game.phase, 'over');
  assert.equal(result.wavesCleared, 2);
  assert.equal(result.coins, 12);
  assert.equal(meta.coins, 12);
  assert.equal(meta.runs, 1);

  const time = game.time;
  game.update(1);
  assert.equal(game.time, time);
  assert.equal(game.buildTower('gun', 6, 6), null);
});

test('Game: a fresh Game after game over starts at full HP with banked coins', () => {
  const meta = makeMeta();
  meta.recordRun(5);
  const next = makeGame({ meta });
  assert.equal(next.hp, MAX_HP);
  assert.equal(next.wave, 0);
  assert.equal(meta.coins, 37);
});

test('Game: frost slows and splash hits several enemies', () => {
  const meta = makeMeta();
  meta.unlocked.frost = true;
  const game = makeGame({ meta });
  const tower = game.buildTower('frost', 3, 3);
  game.phase = 'wave';
  const a = new Enemy('tank', 1, game.path);
  const b = new Enemy('tank', 1, game.path);
  a.distance = b.distance = 100;
  game.enemies.push(a, b);
  game.spawnQueue = ['normal'];
  game.spawnTimer = 999;
  runUntil(game, () => a.hp < a.maxHp, { maxSteps: 500 });
  assert.ok(tower);
  assert.ok(b.hp < b.maxHp, 'splash hit second enemy');
  assert.ok(a.isSlowed(game.time));
});
