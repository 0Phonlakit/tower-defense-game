// Draws the map and a Game onto a canvas. Read-only: never changes game state.
(function (root) {
  'use strict';
  const TD = root.TD;

  class Renderer {
    constructor(canvas, path) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.path = path;
      this.width = canvas.width;
      this.height = canvas.height;
    }

    // view: { placing, selected, hover } from the App
    draw(game, view = {}) {
      this.drawGround();
      this.drawPath();
      this.drawSpawn();
      this.drawBase(game);
      if (!game) return;

      if (view.placing) this.drawGrid();
      if (view.selected) this.drawRange(view.selected.x, view.selected.y, game.towerStats(view.selected).range, true);
      for (const t of game.towers) this.drawTower(t, t === view.selected);
      for (const e of game.enemies) this.drawEnemy(e, game.time);
      for (const p of game.projectiles) this.drawProjectile(p);
      for (const fx of game.effects) this.drawEffect(fx);
      if (view.placing && view.hover) this.drawGhost(game, view.placing, view.hover);
    }

    drawGround() {
      const { ctx, path } = this;
      const T = path.tile;
      for (let r = 0; r < path.rows; r++) {
        for (let c = 0; c < path.cols; c++) {
          ctx.fillStyle = (r + c) % 2 ? '#3d6b3a' : '#427240';
          ctx.fillRect(c * T, r * T, T, T);
        }
      }
    }

    drawPath() {
      const { ctx, path } = this;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      for (const [color, width] of [['#8f7650', path.tile], ['#c9ad7c', path.tile - 8]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (const p of path.points.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }

    drawSpawn() {
      const { ctx, path } = this;
      const x = path.spawnTile[0] * path.tile + path.tile / 2;
      const y = path.spawnTile[1] * path.tile + path.tile / 2;
      const pulse = 3 * Math.sin(performance.now() / 250);
      ctx.fillStyle = 'rgba(155, 81, 224, 0.35)';
      this.circle(x, y, 16 + pulse); ctx.fill();
      ctx.fillStyle = '#9b51e0';
      this.circle(x, y, 9); ctx.fill();
    }

    drawBase(game) {
      const { ctx, path } = this;
      const T = path.tile;
      const x = path.baseTile[0] * T, y = path.baseTile[1] * T;
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
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`❤ ${game.hp}`, x + T / 2 - 20, y - 4);
      }
    }

    drawGrid() {
      const { ctx, width, height, path } = this;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= path.cols; c++) { ctx.beginPath(); ctx.moveTo(c * path.tile, 0); ctx.lineTo(c * path.tile, height); ctx.stroke(); }
      for (let r = 0; r <= path.rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * path.tile); ctx.lineTo(width, r * path.tile); ctx.stroke(); }
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

    drawEnemy(e, time) {
      const { ctx } = this;
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
      const { ctx, path } = this;
      const ok = game.canPlace(hover.c, hover.r) && game.gold >= game.towerCost(type);
      const x = hover.c * path.tile + path.tile / 2, y = hover.r * path.tile + path.tile / 2;
      this.drawRange(x, y, game.previewStats(type).range, ok);
      ctx.globalAlpha = 0.6;
      this.drawTower({ type, x, y, level: 1, angle: -Math.PI / 2 });
      ctx.globalAlpha = 1;
      if (!ok) {
        ctx.strokeStyle = '#e5484d';
        ctx.lineWidth = 2;
        ctx.strokeRect(hover.c * path.tile + 2, hover.r * path.tile + 2, path.tile - 4, path.tile - 4);
      }
    }

    circle(x, y, r) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
    }
  }

  TD.Renderer = Renderer;
})(self);
