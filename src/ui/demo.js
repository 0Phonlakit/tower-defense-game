// Menu background: a silent demo game on a random map that plays itself behind the menu screens.
// It has its own throwaway progress (never saved) and never loses: base HP is refilled every frame.
(function (root) {
  'use strict';
  const TD = root.TD;

  const WAVES_PER_MAP = 12;
  const TOWER_COUNT = 12;

  class MenuDemo {
    constructor(canvas) {
      this.canvas = canvas;
      this.renderer = new TD.Renderer(canvas);
      this.game = null;
    }

    // Fills the whole window, keeping the board's shape (cropped at the edges like a cover image).
    resize() {
      const dpr = root.devicePixelRatio || 1;
      const w = root.innerWidth, h = root.innerHeight;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      const scale = Math.max(this.canvas.width / TD.BOARD_W, this.canvas.height / TD.BOARD_H);
      this.renderer.setScale(scale, (this.canvas.width - TD.BOARD_W * scale) / 2, (this.canvas.height - TD.BOARD_H * scale) / 2);
    }

    // New map, all towers unlocked, a dozen towers at random levels next to the open roads.
    restart() {
      const meta = new TD.MetaProgress(null);
      for (const type of Object.keys(TD.TOWER_DEFS)) meta.unlocked[type] = true;
      const map = TD.GameMap.random();
      const g = this.game = new TD.Game({ meta, map });
      g.gold = 1e9;
      const open = map.routes.slice(0, map.routesOpen(1));
      const spots = [];
      for (let r = 0; r < map.rows; r++) {
        for (let c = 0; c < map.cols; c++) {
          if (!g.canPlace(c, r)) continue;
          const near = open.some(route => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => route.isPathTile(c + dc, r + dr)));
          if (near) spots.push([c, r]);
        }
      }
      const types = Object.keys(TD.TOWER_DEFS);
      for (let i = 0; i < TOWER_COUNT && spots.length; i++) {
        const [c, r] = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
        const t = g.buildTower(types[i % types.length], c, r);
        const level = 1 + Math.floor(Math.random() * 4);
        while (t && t.level < level) g.upgradeTower(t);
      }
      this.renderer.setMap(map);
      g.startWave();
    }

    // Plays itself: skips the countdown early, takes the first perk, never loses.
    step(dt) {
      if (!this.game || this.game.isOver || this.game.wave > WAVES_PER_MAP) this.restart();
      const g = this.game;
      if (g.phase === 'perk') g.choosePerk(0);
      if (g.countdown !== null && g.countdown < TD.WAVE_COUNTDOWN - 4) g.skipCountdown();
      g.hp = TD.MAX_HP;
      g.update(dt);
      this.renderer.draw(g, {});
    }
  }

  TD.MenuDemo = MenuDemo;
})(self);
