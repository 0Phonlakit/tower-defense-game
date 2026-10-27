// Renderer: the map itself: ground texture, scenery, roads, spawners, the base and the next-wave route
// arrows. Ground, scenery, roads and base go into the cached static layer (see drawStatic).
(function (root) {
  'use strict';
  const TD = root.TD;
  const Renderer = TD.Renderer;

  Object.assign(Renderer, {
    // Fixed scenery spots on free tiles, the same every time a map is drawn.
    scatterDeco(map) {
      const seed = [...map.id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
      const rand = (c, r, k) => { const h = Math.sin(c * 127.1 + r * 311.7 + seed * 74.7 + k * 19.3) * 43758.5453; return h - Math.floor(h); };
      const spots = [];
      for (let r = 0; r < map.rows; r++) {
        for (let c = 0; c < map.cols; c++) {
          if (map.isPathTile(c, r) || rand(c, r, 0) > 0.16) continue;
          spots.push({ x: (c + 0.2 + rand(c, r, 1) * 0.6) * map.tile, y: (r + 0.2 + rand(c, r, 2) * 0.6) * map.tile });
        }
      }
      return spots;
    },
  });

  Object.assign(Renderer.prototype, {
    drawGround() {
      const { ctx, map } = this;
      const T = map.tile;
      const [a, b] = map.theme.ground;
      for (let r = 0; r < map.rows; r++) {
        for (let c = 0; c < map.cols; c++) {
          ctx.fillStyle = (r + c) % 2 ? a : b;
          ctx.fillRect(c * T, r * T, T, T);
        }
      }
      const seed = [...map.id].reduce((n, ch) => n + ch.charCodeAt(0), 0);
      const rand = k => { const h = Math.sin(k * 12.9898 + seed * 78.233) * 43758.5453; return h - Math.floor(h); };
      const light = Renderer.mix(a, '#ffffff', 0.12), dark = TD.shade(a, 0.18);
      for (let i = 0; i < map.cols * map.rows * 3; i++) {
        const x = Math.floor(rand(i * 3) * map.cols * T / 4) * 4;
        const y = Math.floor(rand(i * 3 + 1) * map.rows * T / 4) * 4;
        ctx.fillStyle = rand(i * 3 + 2) < 0.5 ? light : dark;
        ctx.fillRect(x, y, 4, 4);
      }
    },

    drawDeco() {
      const { deco: color, shape } = this.map.theme;
      const extra = { a: color, b: TD.shade(color, 0.3) };
      for (const { x, y } of this.deco) TD.drawSprite(this.ctx, `deco:${shape}`, x, y, 16, { extra });
    },

    // Closed routes are drawn faded under the open ones, so players can see what is coming.
    drawPaths(open) {
      const { ctx, map } = this;
      const [edge, fill] = map.theme.path;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      // All edges first, then all fills, so roads that join look like one connected road.
      // Closed routes use colors mixed toward the ground instead of transparency, so they join cleanly too.
      const ground = map.theme.ground[0];
      const closedOrder = map.routes.map((r, i) => i).filter(i => i >= open);
      const openOrder = map.routes.map((r, i) => i).filter(i => i < open);
      const passes = [
        [closedOrder, Renderer.mix(edge, ground, 0.55), map.tile],
        [openOrder, edge, map.tile],
        [closedOrder, this.cobbles(Renderer.mix(fill, ground, 0.55)), map.tile - 8],
        [openOrder, this.cobbles(fill), map.tile - 8],
      ];
      for (const [ids, color, width] of passes) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        for (const i of ids) {
          const route = map.routes[i];
          ctx.beginPath();
          ctx.moveTo(route.points[0].x, route.points[0].y);
          for (const p of route.points.slice(1)) ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
    },

    // A 16px tile of cobbles in shades of `color`, used as a repeating road texture.
    cobbles(color) {
      const c = document.createElement('canvas');
      c.width = c.height = 16;
      const g = c.getContext('2d');
      g.fillStyle = color;
      g.fillRect(0, 0, 16, 16);
      g.fillStyle = TD.shade(color, 0.12);
      for (const [x, y] of [[0, 0], [8, 4], [4, 8], [12, 12], [0, 12]]) g.fillRect(x, y, 4, 4);
      g.fillStyle = Renderer.mix(color, '#ffffff', 0.15);
      for (const [x, y] of [[4, 0], [12, 4], [8, 12]]) g.fillRect(x, y, 4, 4);
      return this.ctx.createPattern(c, 'repeat');
    },

    drawSpawns(open) {
      const { ctx, map } = this;
      const pulse = 3 * Math.sin(performance.now() / 250);
      map.routes.forEach((route, i) => {
        const x = route.spawnTile[0] * map.tile + map.tile / 2;
        const y = route.spawnTile[1] * map.tile + map.tile / 2;
        if (i >= open) return; // spawners of routes that open later stay hidden
        ctx.fillStyle = 'rgba(155, 81, 224, 0.35)';
        this.circle(x, y, 16 + pulse); ctx.fill();
        ctx.fillStyle = '#9b51e0';
        this.circle(x, y, 9); ctx.fill();
      });
    },

    // Arrows run along the open routes the next wave will use; routes that open later stay unmarked.
    // (The next wave's total is shown in the info bar under the board.)
    drawTracking(plan, open) {
      if (!plan) return;
      const { ctx, map } = this;
      const gap = 46;
      const shift = (performance.now() / 1000 * 70) % gap;
      // Arrows sit at fixed distances from the base, so routes that share a road put their
      // arrows on the same spots; each spot is drawn once.
      const drawn = new Set();
      ctx.fillStyle = 'rgba(229, 72, 77, 0.9)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      plan.counts.forEach((count, i) => {
        if (!count || i >= open) return;
        const route = map.routes[i];
        for (let toBase = map.tile / 2 + gap - shift; toBase <= route.length; toBase += gap) {
          const d = route.length - toBase;
          const p = route.positionAt(d), q = route.positionAt(d + 2);
          const key = `${Math.round(p.x)},${Math.round(p.y)}`;
          if (drawn.has(key)) continue;
          drawn.add(key);
          const a = Math.atan2(q.y - p.y, q.x - p.x);
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(a) * 7, p.y + Math.sin(a) * 7);
          ctx.lineTo(p.x + Math.cos(a + 2.4) * 6, p.y + Math.sin(a + 2.4) * 6);
          ctx.lineTo(p.x + Math.cos(a - 2.4) * 6, p.y + Math.sin(a - 2.4) * 6);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      });
    },

    drawBase() {
      const { map } = this;
      // A little bigger than a tile, so it is kept inside the board when the base sits on an edge.
      const size = map.tile * 1.15, half = size / 2;
      const clamp = (v, max) => Math.min(max - half, Math.max(half, v));
      const x = clamp((map.baseTile[0] + 0.5) * map.tile, this.width);
      const y = clamp((map.baseTile[1] + 0.5) * map.tile - 4, this.height);
      TD.drawSprite(this.ctx, `base:${map.id}`, x, y, size);
    },
  });
})(self);
