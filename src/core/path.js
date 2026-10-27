// The route enemies walk along, in pixel space, plus the set of tiles it covers.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./config.js'));
  else root.TD = Object.assign(root.TD || {}, factory(root.TD));
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  class Path {
    constructor(waypoints = TD.WAYPOINTS, { tile = TD.TILE, cols = TD.COLS, rows = TD.ROWS } = {}) {
      if (waypoints.length < 2) throw new Error('Path needs at least 2 waypoints');
      this.tile = tile;
      this.cols = cols;
      this.rows = rows;
      this.points = waypoints.map(([c, r]) => ({ x: c * tile + tile / 2, y: r * tile + tile / 2 }));
      this.segments = [];
      this.length = 0;
      for (let i = 0; i < this.points.length - 1; i++) {
        const a = this.points[i], b = this.points[i + 1];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        this.segments.push({ a, b, len, start: this.length });
        this.length += len;
      }

      this.tiles = new Set();
      const ordered = [];
      for (let i = 0; i < waypoints.length - 1; i++) {
        let [c, r] = waypoints[i];
        const [c2, r2] = waypoints[i + 1];
        const dc = Math.sign(c2 - c), dr = Math.sign(r2 - r);
        while (true) {
          const key = `${c},${r}`;
          if (this.inBounds(c, r) && !this.tiles.has(key)) { this.tiles.add(key); ordered.push([c, r]); }
          if (c === c2 && r === r2) break;
          c += dc; r += dr;
        }
      }
      this.spawnTile = ordered[0];
      this.baseTile = waypoints[waypoints.length - 1];
    }

    inBounds(c, r) {
      return c >= 0 && c < this.cols && r >= 0 && r < this.rows;
    }

    isPathTile(c, r) {
      return this.tiles.has(`${c},${r}`);
    }

    get basePosition() {
      return this.points[this.points.length - 1];
    }

    // Pixel position after travelling distance d from the spawn point.
    positionAt(d) {
      for (const s of this.segments) {
        if (d <= s.start + s.len) {
          const t = s.len ? Math.max(0, d - s.start) / s.len : 0;
          return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
        }
      }
      return { ...this.basePosition };
    }
  }

  return { Path };
});
