// Draws the map and a Game onto a canvas. Read-only: never changes game state.
// This file has the frame loop entry (draw), the cached static layer and small helpers; the drawing
// itself is split by part: map-layer.js (ground, roads, spawners, base, route arrows), units.js
// (towers, enemies, placement preview) and effects.js (shots, hits, floating text).
(function (root) {
  'use strict';
  const TD = root.TD;

  class Renderer {
    // scale: canvas pixels per board pixel (resolution and screen density); see setScale.
    constructor(canvas, scale = 1) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.scale = scale;
      this.ox = 0;
      this.oy = 0;
      this.width = canvas.width / scale;
      this.height = canvas.height / scale;
      this.map = null;
      this.deco = [];
      this.layer = null;    // cached static layer (ground, scenery, roads, base)
      this.layerKey = '';
    }

    // scale: canvas px per board px; ox/oy: where the board's top-left sits on the canvas (canvas px).
    setScale(scale, ox = 0, oy = 0) {
      this.scale = scale;
      this.ox = ox;
      this.oy = oy;
      this.width = this.canvas.width / scale;
      this.height = this.canvas.height / scale;
    }

    setMap(map) {
      this.map = map;
      this.deco = Renderer.scatterDeco(map);
    }

    // view: { placing, selected, hover } from the App
    draw(game, view = {}) {
      if (!this.map) return;
      this.ctx.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
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
      const key = `${this.map.id}|${open}|${this.canvas.width}x${this.canvas.height}|${this.ox},${this.oy}`;
      if (key !== this.layerKey || !this.layer) {
        const layer = this.layer || document.createElement('canvas');
        layer.width = this.canvas.width;
        layer.height = this.canvas.height;
        const main = this.ctx;
        this.ctx = layer.getContext('2d');
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
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

    // Blends hex color a toward hex color b by t (0..1).
    static mix(a, b, t) {
      const ch = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
      return '#' + [0, 1, 2].map(i => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0')).join('');
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

    circle(x, y, r) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
    }
  }

  TD.Renderer = Renderer;
})(self);
