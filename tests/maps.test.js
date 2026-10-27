'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { MAP_DEFS, GameMap } = require('../src/core/maps.js');
const { COLS, ROWS, TILE } = require('../src/core/config.js');
const { createRng } = require('../src/core/utils.js');
const { makeGame, runUntil } = require('./helpers.js');

const offMap = ([c, r]) => c === -1 || c === COLS || r === -1 || r === ROWS;

test('Maps: 10 maps, each with its own background and 5 routes', () => {
  assert.equal(MAP_DEFS.length, 10);
  assert.equal(new Set(MAP_DEFS.map(d => d.id)).size, 10);
  assert.equal(new Set(MAP_DEFS.map(d => d.theme.ground.join())).size, 10, 'backgrounds differ');
  for (const d of MAP_DEFS) assert.equal(d.routes.length, 5, d.id);
});

test('Maps: every route starts off the map edge, moves in straight lines and ends at the shared base', () => {
  for (const def of MAP_DEFS) {
    const base = def.routes[0].at(-1);
    def.routes.forEach((wp, i) => {
      const id = `${def.id} route ${i}`;
      assert.ok(offMap(wp[0]), `${id} starts off the map`);
      assert.deepEqual(wp.at(-1), base, `${id} ends at the base`);
      for (let k = 1; k < wp.length; k++) {
        const [a, b] = [wp[k - 1], wp[k]];
        assert.ok(a[0] === b[0] || a[1] === b[1], `${id} has no diagonal steps`);
        assert.ok(b[0] >= 0 && b[0] < COLS && b[1] >= 0 && b[1] < ROWS, `${id} stays on the map`);
      }
    });
  }
});

test('Maps: routes are long enough to defend and leave room to build', () => {
  for (const def of MAP_DEFS) {
    const map = new GameMap(def);
    for (const r of map.routes) assert.ok(r.length >= 15 * TILE, `${def.id} route length`);
    assert.ok(COLS * ROWS - map.tiles.size >= 150, `${def.id} buildable tiles`);
  }
});

test('GameMap: 2 routes open from the start and 1 more every 10 waves, up to 5', () => {
  const map = new GameMap();
  assert.deepEqual([1, 9, 10, 19, 20, 30, 99].map(w => map.routesOpen(w)), [2, 2, 3, 3, 4, 5, 5]);
  assert.deepEqual([0, 1, 2, 3, 4].map(i => map.routeOpensAt(i)), [1, 1, 10, 20, 30]);
});

test('GameMap: tiles of every route (open or not) block building', () => {
  const map = new GameMap();
  for (const r of map.routes) for (const key of r.tiles) assert.ok(map.tiles.has(key));
  const game = makeGame({ map });
  const [c, r] = [...map.routes[4].tiles][0].split(',').map(Number);
  assert.equal(game.canPlace(c, r), false);
});

test('GameMap.random picks a map from the 10', () => {
  const ids = new Set();
  const rng = createRng(3);
  for (let i = 0; i < 200; i++) ids.add(GameMap.random(rng).id);
  assert.equal(ids.size, 10);
});

test('Game: the next wave plan is shown before wave 1 and during the countdown, not while spawning', () => {
  const game = makeGame();
  assert.equal(game.upcoming.wave, 1);
  assert.equal(game.upcoming.counts.length, 2);
  assert.equal(game.upcoming.counts.reduce((a, b) => a + b, 0), game.upcoming.queue.length);

  const plan = game.upcoming;
  game.startWave();
  assert.equal(game.upcoming, null);
  const spawned = [];
  runUntil(game, g => {
    for (const e of g.enemies) if (!spawned.includes(e)) spawned.push(e);
    return g.countdown !== null;
  });
  assert.deepEqual(spawned.map(e => [e.type, e.route]), plan.queue.map(e => [e.type, e.route]),
    'enemies spawn on the routes the preview showed');
  assert.equal(game.upcoming.wave, 2);
});

test('Game: waves only use open routes, and wave 10 opens a third route', () => {
  const game = makeGame();
  for (let w = 1; w <= 12; w++) {
    const plan = w === 1 ? game.upcoming : game.nextPlan;
    assert.equal(plan.wave, w);
    assert.equal(plan.counts.length, w >= 10 ? 3 : 2, `wave ${w}`);
    assert.ok(plan.queue.every(e => e.route < plan.counts.length));
    if (w === 1) game.startWave(); else { game.spawnQueue = []; game.countdown = 0.01; game.update(0.02); }
    game.spawnQueue = [];
    game.update(0.02);
    if (game.phase === 'perk') game.choosePerk(0);
  }
});
