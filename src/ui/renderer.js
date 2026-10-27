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
      this.drawGround();
      this.drawDeco();
      this.drawPaths(open);
      this.drawSpawns(open);
      this.drawBase(game);
      if (!game) return;
      this.drawTracking(game.upcoming);

      if (view.placing) this.drawGrid();
      if (view.selected) this.drawRange(view.selected.x, view.selected.y, game.towerStats(view.selected).range, true);
      for (const t of game.towers) this.drawTower(t, t === view.selected);
      for (const e of game.enemies) this.drawEnemy(e, game.time);
      for (const p of game.projectiles) this.drawProjectile(p);
      for (const fx of game.effects) this.drawEffect(fx);
      if (view.placing && view.hover) this.drawGhost(game, view.placing, view.hover);
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
    }

    drawDeco() {
      const { ctx } = this;
      const { deco: color, shape } = this.map.theme;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (const { x, y } of this.deco) {
        if (shape === 'cactus' || shape === 'reed') { ctx.fillRect(x - 2, y - 7, 4, 14); if (shape === 'cactus') ctx.fillRect(x - 6, y - 3, 12, 3); }
        else if (shape === 'flake' || shape === 'star') { const s = shape === 'flake' ? 5 : 2.5; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke(); }
        else if (shape === 'crystal') { ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill(); }
        else if (shape === 'rubble') { ctx.fillRect(x - 4, y - 3, 8, 6); ctx.fillRect(x + 3, y + 2, 4, 4); }
        else if (shape === 'leaf') { ctx.beginPath(); ctx.ellipse(x, y, 5, 3, 0.6, 0, Math.PI * 2); ctx.fill(); }
        else { this.circle(x, y, shape === 'ember' ? 2.5 : shape === 'shell' ? 3.5 : 6); ctx.fill(); }
      }
    }

    // Closed routes are drawn faded under the open ones, so players can see what is coming.
    drawPaths(open) {
      const { ctx, map } = this;
      const [edge, fill] = map.theme.path;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      const order = map.routes.map((r, i) => i).reverse();
      for (const i of order) {
        const route = map.routes[i];
        ctx.globalAlpha = i < open ? 1 : 0.4;
        for (const [color, width] of [[edge, map.tile], [fill, map.tile - 8]]) {
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(route.points[0].x, route.points[0].y);
          for (const p of route.points.slice(1)) ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    drawSpawns(open) {
      const { ctx, map } = this;
      const pulse = 3 * Math.sin(performance.now() / 250);
      map.routes.forEach((route, i) => {
        const x = route.spawnTile[0] * map.tile + map.tile / 2;
        const y = route.spawnTile[1] * map.tile + map.tile / 2;
        if (i < open) {
          ctx.fillStyle = 'rgba(155, 81, 224, 0.35)';
          this.circle(x, y, 16 + pulse); ctx.fill();
          ctx.fillStyle = '#9b51e0';
          this.circle(x, y, 9); ctx.fill();
          return;
        }
        ctx.fillStyle = 'rgba(30, 30, 30, 0.7)';
        this.circle(x, y, 12); ctx.fill();
        this.label(`W${map.routeOpensAt(i)}`, x, y + 4, '#ddd', 11);
      });
    }

    // Arrows run along the routes the next wave will use; the badge shows how many enemies take each one.
    drawTracking(plan) {
      if (!plan) return;
      const { ctx, map } = this;
      const shift = (performance.now() / 1000 * 70) % 46;
      plan.counts.forEach((count, i) => {
        if (!count) return;
        const route = map.routes[i];
        ctx.fillStyle = 'rgba(229, 72, 77, 0.9)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        for (let d = shift; d < route.length - map.tile / 2; d += 46) {
          const p = route.positionAt(d), q = route.positionAt(d + 2);
          const a = Math.atan2(q.y - p.y, q.x - p.x);
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(a) * 7, p.y + Math.sin(a) * 7);
          ctx.lineTo(p.x + Math.cos(a + 2.4) * 6, p.y + Math.sin(a + 2.4) * 6);
          ctx.lineTo(p.x + Math.cos(a - 2.4) * 6, p.y + Math.sin(a - 2.4) * 6);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        const x = route.spawnTile[0] * map.tile + map.tile / 2;
        const y = route.spawnTile[1] * map.tile + map.tile / 2;
        ctx.fillStyle = '#e5484d';
        this.circle(x + 12, y - 12, 10); ctx.fill();
        this.label(String(count), x + 12, y - 8, '#fff', 12);
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

    drawBase(game) {
      const { ctx, map } = this;
      const T = map.tile;
      const x = map.baseTile[0] * T, y = map.baseTile[1] * T;
      ctx.fillStyle = '#5b6370';
      ctx.fillRect(x + 4, y + 10, T - 8, T - 12);
      ctx.fillStyle = '#727b89';
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 4 + i * 12, y + 4, 8, 8);
      ctx.fillStyle = '#3a2f25';
      ctx.fillRect(x + 15, y + 22, 10, 16);
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 20, y + 4); ctx.lineTo(x + 20, y - 12); ctx.stroke();
      ctx.fillStyle = '#e5484d';
      ctx.fillRect(x + 20, y - 12, 12, 7);
      if (game) {
        const lx = Math.min(this.width - 24, Math.max(24, x + T / 2));
        this.label(`❤ ${game.hp}`, lx, y < T ? y + T + 14 : y - 16, '#fff', 12);
      }
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

    drawTower(t, isSelected = false) {
      const { ctx } = this;
      const def = TD.TOWER_DEFS[t.type];
      ctx.fillStyle = '#2a2e36';
      ctx.fillRect(t.x - 16, t.y - 16, 32, 32);
      ctx.fillStyle = def.color;
      this.circle(t.x, t.y, 11); ctx.fill();
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      ctx.fillStyle = '#1b1e24';
      const len = t.type === 'sniper' ? 20 : t.type === 'cannon' ? 14 : 16;
      const wid = t.type === 'cannon' ? 9 : t.type === 'sniper' ? 4 : 5;
      ctx.fillRect(0, -wid / 2, len, wid);
      ctx.restore();
      ctx.fillStyle = '#f5c542';
      for (let i = 0; i < t.level; i++) ctx.fillRect(t.x - 14 + i * 8, t.y + 12, 5, 3);
      if (isSelected) {
        ctx.strokeStyle = '#f5c542';
        ctx.lineWidth = 2;
        ctx.strokeRect(t.x - 17, t.y - 17, 34, 34);
      }
    }

    // Flyers float above a shadow with flapping wings; map-unique units get a white ring.
    drawEnemy(e, time) {
      const { ctx } = this;
      ctx.save();
      if (e.flying) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 6, e.radius, e.radius * 0.45, 0, 0, Math.PI * 2); ctx.fill();
        ctx.translate(0, -10);
        const flap = 0.6 + 0.4 * Math.sin(time * 18);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (const side of [-1, 1]) {
          ctx.beginPath(); ctx.ellipse(e.x + side * e.radius, e.y - 2, e.radius * 0.8, e.radius * 0.45 * flap, side * 0.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.fillStyle = e.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      if (e.type === 'tank') {
        ctx.fillRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
        ctx.strokeRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
      } else {
        this.circle(e.x, e.y, e.radius); ctx.fill(); ctx.stroke();
      }
      if (e.type === 'boss') {
        ctx.fillStyle = '#f5c542';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('♛', e.x, e.y + 5);
      }
      if (e.unique) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5;
        this.circle(e.x, e.y, e.radius + 1.5); ctx.stroke();
      }
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

    drawProjectile(p) {
      this.ctx.fillStyle = p.color;
      this.circle(p.x, p.y, p.splash ? 5 : 3.5);
      this.ctx.fill();
    }

    drawEffect(fx) {
      const { ctx } = this;
      const k = Math.max(0, fx.life / fx.max);
      ctx.globalAlpha = k;
      if (fx.kind === 'ring') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 3;
        this.circle(fx.x, fx.y, fx.r1 + (fx.r0 - fx.r1) * k); ctx.stroke();
      } else if (fx.kind === 'tracer') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
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
