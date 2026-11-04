// The App: owns the game, settings, saves, sound and renderer, and runs the main loop.
// Screens and parts add their methods from their own files (loaded after this one):
//   input.js, hud.js, screens/*.js (splash, slots, menu, upgrades, settings, guide, pause, perk, game-over).
(function (root) {
  'use strict';
  const TD = root.TD;

  function safeStorage() {
    try { return root.localStorage; } catch (e) { return null; }
  }

  class App {
    constructor(doc = document) {
      this.doc = doc;
      this.saves = new TD.SaveSlots(safeStorage());
      this.slot = this.saves.lastSlot();
      this.meta = this.saves.open(this.slot);
      this.map = null;
      this.canvas = this.$('game');
      this.renderer = new TD.Renderer(this.canvas);
      this.demo = new TD.MenuDemo(this.$('menu-bg'));
      this.settings = new TD.Settings(safeStorage());
      this.sound = new TD.SoundSystem(this.settings);
      this.game = null;
      this.paused = false;
      this.quitting = false;
      this.upgradeTab = 'attack';
      this.settingsReturn = 'ov-menu';
      this.guideTab = 'towers';
      this.guideReturn = 'ov-menu';
      this.placing = null;
      this.selected = null;
      this.hover = null;
      this.speed = 1;
      this.hudCache = {};
      this.lastFrame = 0;
    }

    $(id) {
      return this.doc.getElementById(id);
    }

    show(id, visible) {
      this.$(id).hidden = !visible;
    }

    // Shows exactly one overlay (or none) and hides the rest.
    showOverlay(id) {
      for (const el of this.doc.querySelectorAll('.overlay')) el.hidden = el.id !== id;
    }

    start() {
      this.bindInput();
      this.applyLanguage();
      this.applyResolution();
      this.demo.resize();
      this.showSplash();
      this.lastFrame = performance.now();
      requestAnimationFrame(t => this.frame(t));
      return this;
    }

    // ---------- Main loop ----------
    frame(now) {
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      // Outside a run the menu background demo plays instead.
      this.$('menu-bg').hidden = !!this.game;
      if (!this.game) this.demo.step(dt);
      if (this.game && !this.paused) {
        for (let i = 0; i < this.speed && this.game.canBuild; i++) this.game.update(dt);
      }
      this.renderer.draw(this.game, { placing: this.placing, selected: this.selected, hover: this.hover });
      this.updateHUD();
      requestAnimationFrame(t => this.frame(t));
    }

    // Start goes straight into a run on a freshly rolled random map.
    startRun() {
      this.rollMap();
      const g = this.game = new TD.Game({ meta: this.meta, map: this.map });
      g.on('wavecleared', e => { this.sound.play('waveclear'); this.showPerkChoice(e); });
      g.on('gameover', r => { this.sound.play('gameover'); this.showGameOver(r); });
      g.on('fire', e => this.sound.play(e.type));
      for (const name of ['kill', 'reaction', 'basehit', 'wavestart', 'routeopen', 'skip']) g.on(name, () => this.sound.play(name));
      this.placing = null;
      this.selected = null;
      this.paused = false;
      this.quitting = false;
      this.showOverlay(null);
      this.buildTowerButtons();
      this.renderSelection();
      this.renderPerkList();
    }

    rollMap() {
      this.map = TD.GameMap.random();
      this.renderer.setMap(this.map);
    }

    // Starts wave 1, or skips the countdown to the next wave for bonus gold.
    nextWave() {
      if (!this.game) return;
      if (this.game.phase === 'build') this.game.startWave();
      else this.game.skipCountdown();
    }
  }

  TD.App = App;
})(self);
