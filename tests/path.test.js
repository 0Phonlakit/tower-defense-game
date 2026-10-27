'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Path } = require('../src/core/path.js');
const { TILE, WAYPOINTS } = require('../src/core/config.js');

test('Path: length equals the sum of segment lengths', () => {
  const path = new Path([[0, 0], [3, 0], [3, 2]]);
  assert.equal(path.length, 5 * TILE);
});

test('Path: positionAt returns tile centers at start, corners and past the end', () => {
  const path = new Path([[0, 0], [3, 0], [3, 2]]);
  assert.deepEqual(path.positionAt(0), { x: 20, y: 20 });
  assert.deepEqual(path.positionAt(3 * TILE), { x: 140, y: 20 });
  assert.deepEqual(path.positionAt(4 * TILE), { x: 140, y: 60 });
  assert.deepEqual(path.positionAt(99999), { x: 140, y: 100 });
});

test('Path: tiles cover every in-bounds tile between waypoints, skipping off-screen ones', () => {
  const path = new Path([[-1, 1], [2, 1], [2, 3]]);
  assert.deepEqual([...path.tiles].sort(), ['0,1', '1,1', '2,1', '2,2', '2,3']);
  assert.ok(path.isPathTile(2, 2));
  assert.ok(!path.isPathTile(-1, 1));
  assert.ok(!path.isPathTile(5, 5));
});

test('Path: spawn tile is the first visible tile and base tile is the last waypoint', () => {
  const path = new Path();
  assert.deepEqual(path.spawnTile, [0, WAYPOINTS[0][1]]);
  assert.deepEqual(path.baseTile, WAYPOINTS[WAYPOINTS.length - 1]);
});

test('Path: rejects fewer than two waypoints', () => {
  assert.throws(() => new Path([[0, 0]]), /at least 2/);
});
