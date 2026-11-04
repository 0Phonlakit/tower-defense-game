// Renderer: towers (per-level pixel art and glow), enemies (facing their way, flyers bobbing, status
// marks and HP bars), the range circle, the build grid and the placement preview.
(function (root) {
  'use strict';
  const TD = root.TD;
  const Renderer = TD.Renderer;

  Object.assign(Renderer.prototype, {
    drawGrid() {
      const { ctx, width, height, map } = this;
      ctx.strokeStyle = 'rgba(127,127,127,0.25)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= map.cols; c++) { ctx.beginPath(); ctx.moveTo(c * map.tile, 0); ctx.lineTo(c * map.tile, height); ctx.stroke(); }
      for (let r = 0; r <= map.rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * map.tile); ctx.lineTo(width, r * map.tile); ctx.stroke(); }
    },

    drawRange(x, y, range, ok) {
      const { ctx } = this;
      ctx.fillStyle = ok ? 'rgba(255,255,255,0.08)' : 'rgba(229,72,77,0.15)';
      ctx.strokeStyle = ok ? 'rgba(255,255,255,0.5)' : 'rgba(229,72,77,0.7)';
      ctx.lineWidth = 1;
      this.circle(x, y, range); ctx.fill(); ctx.stroke();
    },

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
    },

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
    },

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
    },
  });
})(self);
