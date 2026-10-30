// Draws the map and a Game onto a canvas. Read-only: never changes game state.
(function (root) {
  'use strict';
  const TD = root.TD;

  class Renderer {
    // scale: canvas pixels per board pixel (resolution and screen density); see setScale.
    constructor(canvas, scale = 1) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.scale = scale;
      this.width = canvas.width / scale;
      this.height = canvas.height / scale;
      this.map = null;
      this.deco = [];
      this.layer = null;    // cached static layer (ground, scenery, roads, base)
      this.layerKey = '';
    }

    setScale(scale) {
      this.scale = scale;
      this.width = this.canvas.width / scale;
      this.height = this.canvas.height / scale;
    }

    setMap(map) {
      this.map = map;
      this.deco = Renderer.scatterDeco(map);
    }

    // Fixed scenery spots on free tiles, the same every time a map is drawn.
    static scatterDeco(map) {
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
    }

    // view: { placing, selected, hover } from the App
    draw(game, view = {}) {
      if (!this.map) return;
      this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      const open = this.map.routesOpen(game ? Math.max(1, game.wave) : 1);
      this.drawStatic(open);
      this.drawSpawns(open);
      if (!game) return;
      this.drawTracking(game.upcoming, open);

      if (view.placing) this.drawGrid();
      if (view.selected) this.drawRange(view.selected.x, view.selected.y, game.towerStats(view.selected).range, true);
      for (const t of game.towers) this.drawTower(t, t === view.selected);
      for (const e of game.enemies) this.drawEnemy(e, game.time);
      for (const p of game.projectiles) this.drawProjectile(p);
      for (const fx of game.effects) this.drawEffect(fx);
      if (view.placing && view.hover) this.drawGhost(game, view.placing, view.hover);
    }

    // Ground, scenery, roads and the base only change with the map, the open routes or the scale,
    // so they are drawn into an offscreen canvas once and copied every frame.
    drawStatic(open) {
      const key = `${this.map.id}|${open}|${this.canvas.width}x${this.canvas.height}`;
      if (key !== this.layerKey || !this.layer) {
        const layer = this.layer || document.createElement('canvas');
        layer.width = this.canvas.width;
        layer.height = this.canvas.height;
        const main = this.ctx;
        this.ctx = layer.getContext('2d');
        this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
        this.drawGround();
        this.drawDeco();
        this.drawPaths(open);
        this.drawBase();
        this.ctx = main;
        this.layer = layer;
        this.layerKey = key;
      }
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.drawImage(this.layer, 0, 0);
      this.ctx.restore();
    }

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
    }

    drawDeco() {
      const { deco: color, shape } = this.map.theme;
      const extra = { a: color, b: TD.shade(color, 0.3) };
      for (const { x, y } of this.deco) TD.drawSprite(this.ctx, `deco:${shape}`, x, y, 16, { extra });
    }

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
    }

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
    }

    // Blends hex color a toward hex color b by t (0..1).
    static mix(a, b, t) {
      const ch = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
      return '#' + [0, 1, 2].map(i => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0')).join('');
    }

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
    }

    // Arrows run along the open routes the next wave will use (routes that open later stay unmarked),
    // and a corner label shows how many enemies the next wave has in total.
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
    }

    // Bold centered text with a dark outline, readable on light and dark maps.
    label(text, x, y, color, size) {
      const { ctx } = this;
      ctx.font = `bold ${size}px system-ui`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.strokeText(text, x, y);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    }

    drawBase() {
      const { map } = this;
      // A little bigger than a tile, so it is kept inside the board when the base sits on an edge.
      const size = map.tile * 1.15, half = size / 2;
      const clamp = (v, max) => Math.min(max - half, Math.max(half, v));
      const x = clamp((map.baseTile[0] + 0.5) * map.tile, this.width);
      const y = clamp((map.baseTile[1] + 0.5) * map.tile - 4, this.height);
      TD.drawSprite(this.ctx, `base:${map.id}`, x, y, size);
    }

    drawGrid() {
      const { ctx, width, height, map } = this;
      ctx.strokeStyle = 'rgba(127,127,127,0.25)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= map.cols; c++) { ctx.beginPath(); ctx.moveTo(c * map.tile, 0); ctx.lineTo(c * map.tile, height); ctx.stroke(); }
      for (let r = 0; r <= map.rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * map.tile); ctx.lineTo(width, r * map.tile); ctx.stroke(); }
    }

    drawRange(x, y, range, ok) {
      const { ctx } = this;
      ctx.fillStyle = ok ? 'rgba(255,255,255,0.08)' : 'rgba(229,72,77,0.15)';
      ctx.strokeStyle = ok ? 'rgba(255,255,255,0.5)' : 'rgba(229,72,77,0.7)';
      ctx.lineWidth = 1;
      this.circle(x, y, range); ctx.fill(); ctx.stroke();
    }

    // Each level has its own tower art (no level bars); level 3-4 towers also glow in their color.
    drawTower(t, isSelected = false) {
      const { ctx } = this;
      const level = t.level || 1;
      if (level >= 3) {
        const pulse = level >= 4 ? 0.12 * Math.sin(performance.now() / 300) : 0;
        const glow = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, 24);
        glow.addColorStop(0, TD.TOWER_DEFS[t.type].color);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = (level >= 4 ? 0.45 : 0.25) + pulse;
        ctx.fillStyle = glow;
        this.circle(t.x, t.y, 24); ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath(); ctx.ellipse(t.x, t.y + 14, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
      TD.drawSprite(ctx, `tower:${t.type}:${level}`, t.x, t.y - 2, 36 + (level - 1) * 2);
      if (isSelected) {
        ctx.strokeStyle = '#f5c542';
        ctx.lineWidth = 2;
        ctx.strokeRect(t.x - 20, t.y - 20, 40, 40);
      }
    }

    // Enemies face the way they walk; flyers bob above a shadow.
    drawEnemy(e, time) {
      const { ctx } = this;
      ctx.save();
      if (e.flying) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 6, e.radius, e.radius * 0.45, 0, 0, Math.PI * 2); ctx.fill();
        ctx.translate(0, -10 + 2 * Math.sin(time * 6 + e.distance * 0.05));
      }
      const ahead = e.path.positionAt(e.distance + 4);
      TD.drawSprite(ctx, `enemy:${e.type}`, e.x, e.y, e.radius * 2.6, { flip: ahead.x < e.x - 0.01 });
      if (e.isSlowed(time)) {
        ctx.strokeStyle = '#8be3ff';
        ctx.lineWidth = 2;
        this.circle(e.x, e.y, e.radius + 3); ctx.stroke();
      }
      if (e.isFrozen(time)) {
        ctx.fillStyle = 'rgba(139, 227, 255, 0.55)';
        this.circle(e.x, e.y, e.radius + 2); ctx.fill();
      }
      const aura = e.activeAura(time);
      if (aura) {
        ctx.fillStyle = TD.ELEMENTS[aura].color;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.5;
        this.circle(e.x + e.radius, e.y + e.radius, 4); ctx.fill(); ctx.stroke();
      }
      const w = e.radius * 2 + 6;
      const ratio = e.hpRatio;
      ctx.fillStyle = '#111';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 8, w, 4);
      ctx.fillStyle = ratio > 0.5 ? '#4cd964' : ratio > 0.25 ? '#f5c542' : '#e5484d';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 8, w * ratio, 4);
      ctx.restore();
    }

    // Each tower's shot has its own look, pointed the way it flies.
    drawProjectile(p) {
      const { ctx } = this;
      const a = Math.atan2(p.ty - p.y, p.tx - p.x);
      const t = performance.now() / 1000;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.scale(1.4, 1.4);
      if (p.kind === 'gun') {                       // arrow: wooden shaft, steel head, white fletching
        ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-9, -1, 12, 2);
        ctx.fillStyle = '#c9ced6'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(2, -3); ctx.lineTo(2, 3); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-11, -3, 3, 2); ctx.fillRect(-11, 1, 3, 2);
      } else if (p.kind === 'cannon') {             // tumbling boulder
        ctx.rotate(t * 10);
        ctx.fillStyle = '#8a8478'; ctx.fillRect(-5, -5, 10, 10);
        ctx.fillStyle = '#6f6a60'; ctx.fillRect(-5, 1, 10, 4);
        ctx.fillStyle = '#b0aa9c'; ctx.fillRect(-3, -3, 3, 3);
        ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 1.5; ctx.strokeRect(-5, -5, 10, 10);
      } else if (p.kind === 'frost') {              // ice shard with a sparkle trail
        for (let i = 1; i <= 3; i++) { ctx.fillStyle = `rgba(200, 240, 255, ${0.5 - i * 0.12})`; ctx.fillRect(-4 - i * 5, -1, 2, 2); }
        ctx.fillStyle = '#8be3ff'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(0, -4); ctx.lineTo(-6, 0); ctx.lineTo(0, 4); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-1, -1, 4, 2);
      } else if (p.kind === 'flame') {              // fireball with fading embers behind it
        for (let i = 3; i >= 1; i--) { ctx.fillStyle = `rgba(255, ${120 + i * 20}, 40, ${0.6 - i * 0.15})`; this.circle(-i * 5, Math.sin(t * 30 + i) * 1.5, 5 - i); ctx.fill(); }
        ctx.fillStyle = '#ff6b35'; this.circle(0, 0, 5); ctx.fill();
        ctx.fillStyle = '#ffd84a'; this.circle(1, 0, 2.5); ctx.fill();
      } else if (p.kind === 'tide') {               // water orb with droplets
        ctx.fillStyle = 'rgba(63, 167, 255, 0.45)'; this.circle(-7, 2, 2); ctx.fill(); this.circle(-11, -2, 1.5); ctx.fill();
        ctx.fillStyle = '#3fa7ff'; this.circle(0, 0, 5); ctx.fill();
        ctx.fillStyle = '#dff3ff'; this.circle(-1.5, -1.5, 1.8); ctx.fill();
      } else if (p.kind === 'poison') {             // spinning flask with a green trail
        ctx.fillStyle = 'rgba(123, 192, 67, 0.4)'; this.circle(-8, 0, 3); ctx.fill();
        ctx.rotate(t * 12);
        ctx.fillStyle = '#e8e8e8'; ctx.fillRect(-1, -6, 2, 3);
        ctx.fillStyle = '#7bc043'; this.circle(0, 1, 4); ctx.fill();
        ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 1; this.circle(0, 1, 4); ctx.stroke();
      } else {
        ctx.fillStyle = p.color; this.circle(0, 0, p.splash ? 5 : 3.5); ctx.fill();
      }
      ctx.restore();
    }

    // Hit effects per tower: sparks, dust and debris, frost shards, fire burst, splash, poison cloud.
    drawImpact(fx, k) {
      const { ctx } = this;
      const grow = 1 - k;
      const seed = Math.floor(fx.x * 7 + fx.y * 13);
      const dir = i => (i * 2.399 + seed) % (Math.PI * 2);
      const r = fx.r || 12;
      const bits = (n, dist, size, color) => {
        ctx.fillStyle = color;
        for (let i = 0; i < n; i++) {
          const d = dist * grow;
          ctx.fillRect(fx.x + Math.cos(dir(i)) * d - size / 2, fx.y + Math.sin(dir(i)) * d - size / 2, size, size);
        }
      };
      if (fx.style === 'gun') bits(4, 8, 2, '#ffe9a8');
      else if (fx.style === 'sniper') { bits(6, 12, 2, '#ffffff'); ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 2; this.circle(fx.x, fx.y, 4 + 8 * grow); ctx.stroke(); }
      else if (fx.style === 'cannon') { ctx.fillStyle = 'rgba(160, 140, 110, 0.5)'; this.circle(fx.x, fx.y, r * (0.4 + 0.6 * grow)); ctx.fill(); bits(8, r * 0.9, 4, '#6f6a60'); }
      else if (fx.style === 'frost') { bits(8, r, 3, '#dff7ff'); ctx.strokeStyle = '#8be3ff'; ctx.lineWidth = 2; this.circle(fx.x, fx.y, r * grow); ctx.stroke(); }
      else if (fx.style === 'flame') { ctx.fillStyle = 'rgba(255, 107, 53, 0.55)'; this.circle(fx.x, fx.y, 6 + 8 * grow); ctx.fill(); bits(6, 14, 3, '#ffd84a'); }
      else if (fx.style === 'tide') { bits(10, r, 3, '#8fd0ff'); ctx.strokeStyle = '#3fa7ff'; ctx.lineWidth = 2; this.circle(fx.x, fx.y, r * grow); ctx.stroke(); }
      else if (fx.style === 'poison') { ctx.fillStyle = 'rgba(123, 192, 67, 0.45)'; for (let i = 0; i < 4; i++) { this.circle(fx.x + Math.cos(dir(i)) * 6 * grow, fx.y + Math.sin(dir(i)) * 6 * grow - 4 * grow, 4 + 3 * grow); ctx.fill(); } }
      else if (fx.style === 'tesla') { ctx.fillStyle = 'rgba(232, 245, 91, 0.6)'; this.circle(fx.x, fx.y, 3 + 9 * grow); ctx.fill(); }
    }

    // Lightning: a jagged line that changes shape every frame.
    drawBolt(x1, y1, x2, y2, color) {
      const { ctx } = this;
      const steps = 6, nx = -(y2 - y1), ny = x2 - x1, len = Math.hypot(nx, ny) || 1;
      ctx.beginPath(); ctx.moveTo(x1, y1);
      for (let i = 1; i < steps; i++) {
        const j = (Math.random() - 0.5) * 10;
        ctx.lineTo(x1 + (x2 - x1) * i / steps + nx / len * j, y1 + (y2 - y1) * i / steps + ny / len * j);
      }
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
    }

    drawEffect(fx) {
      const { ctx } = this;
      const k = Math.max(0, fx.life / fx.max);
      ctx.globalAlpha = k;
      if (fx.kind === 'ring') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 3;
        this.circle(fx.x, fx.y, fx.r1 + (fx.r0 - fx.r1) * k); ctx.stroke();
      } else if (fx.kind === 'tracer' && fx.style === 'tesla') {
        this.drawBolt(fx.x, fx.y, fx.x2, fx.y2, fx.color);
      } else if (fx.kind === 'tracer' && fx.style === 'sniper') {   // ballista bolt streak
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
        ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2; ctx.stroke();
      } else if (fx.kind === 'tracer') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
      } else if (fx.kind === 'impact') {
        this.drawImpact(fx, k);
      } else if (fx.kind === 'text') {
        ctx.fillStyle = fx.color;
        ctx.font = 'bold 13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(fx.text, fx.x, fx.y);
      }
      ctx.globalAlpha = 1;
    }

    drawGhost(game, type, hover) {
      const { ctx, map } = this;
      const ok = game.canPlace(hover.c, hover.r) && game.gold >= game.towerCost(type);
      const x = hover.c * map.tile + map.tile / 2, y = hover.r * map.tile + map.tile / 2;
      this.drawRange(x, y, game.previewStats(type).range, ok);
      ctx.globalAlpha = 0.6;
      this.drawTower({ type, x, y, level: 1, angle: -Math.PI / 2 });
      ctx.globalAlpha = 1;
      if (!ok) {
        ctx.strokeStyle = '#e5484d';
        ctx.lineWidth = 2;
        ctx.strokeRect(hover.c * map.tile + 2, hover.r * map.tile + 2, map.tile - 4, map.tile - 4);
      }
    }

    circle(x, y, r) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
    }
  }

  TD.Renderer = Renderer;
})(self);
