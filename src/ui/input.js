// App: mouse and keyboard: canvas clicks (build / select towers), hotkeys, Esc and button wiring.
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;
  const { t } = TD.UIText;

  Object.assign(App.prototype, {
    bindInput() {
      this.canvas.addEventListener('mousemove', ev => { this.hover = this.tileFromEvent(ev); });
      this.canvas.addEventListener('mouseleave', () => { this.hover = null; });
      this.canvas.addEventListener('click', ev => this.onCanvasClick(this.tileFromEvent(ev)));
      this.canvas.addEventListener('contextmenu', ev => { ev.preventDefault(); this.clearSelection(); });
      this.doc.addEventListener('keydown', ev => this.onKey(ev));
      // Audio can only start after a user gesture.
      this.doc.addEventListener('pointerdown', () => this.sound.unlock());
      this.doc.addEventListener('keydown', () => this.sound.unlock());
      this.doc.addEventListener('click', ev => { if (ev.target.closest('button')) this.sound.play('click'); }, true);
      root.addEventListener('resize', () => {
        this.demo.resize();
        this.applyResolution();
      });

      this.$('btn-wave').onclick = () => this.nextWave();
      this.$('btn-upgrade').onclick = () => this.upgradeSelected();
      this.$('btn-sell').onclick = () => this.sellSelected();
      this.$('btn-speed').onclick = () => {
        this.speed = this.speed === 3 ? 1 : this.speed + 1;
        this.$('btn-speed').textContent = t('hud.speed', { n: this.speed });
      };
      this.$('btn-pause').onclick = () => this.pause();
      this.$('btn-start').onclick = () => this.startRun();
      this.$('btn-open-upgrade').onclick = () => this.openUpgrades();
      this.$('btn-change-slot').onclick = () => this.openSlots();
      this.$('btn-open-settings').onclick = () => this.openSettings('ov-menu');
      this.$('btn-open-guide').onclick = () => this.openGuide('ov-menu');
      this.$('btn-pause-guide').onclick = () => this.openGuide('ov-pause');
      this.$('btn-guide-back').onclick = () => this.showOverlay(this.guideReturn);
      this.$('btn-exit').onclick = () => this.exitGame();
      this.$('btn-exit-back').onclick = () => this.openMenu();
      this.$('btn-upgrade-back').onclick = () => this.openMenu();
      this.$('btn-settings-back').onclick = () => this.showOverlay(this.settingsReturn);
      this.$('btn-resume').onclick = () => this.resume();
      this.$('btn-pause-settings').onclick = () => this.openSettings('ov-pause');
      this.$('btn-quit-run').onclick = () => this.quitRun();
      this.$('btn-retry').onclick = () => this.startRun();
      this.$('btn-to-menu').onclick = () => this.openMenu();
      this.$('btn-reset').onclick = () => {
        if (!confirm(t('up.confirmReset', { n: this.slot }))) return;
        this.meta.reset();
        this.renderUpgrades();
      };
      this.bindSettings();
    },

    // ---------- Input ----------
    tileFromEvent(ev) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (TD.BOARD_W / rect.width);
      const y = (ev.clientY - rect.top) * (TD.BOARD_H / rect.height);
      return { c: Math.floor(x / this.map.tile), r: Math.floor(y / this.map.tile) };
    },

    onCanvasClick({ c, r }) {
      if (!this.game || !this.game.canBuild || this.paused) return;
      if (this.placing) {
        if (this.game.buildTower(this.placing, c, r) && this.game.gold < this.game.towerCost(this.placing)) this.placing = null;
        return;
      }
      this.selected = this.game.towerAt(c, r);
      this.renderSelection();
    },

    onKey(ev) {
      if (!this.game || this.game.isOver) return;
      if (ev.key === 'Escape') {
        if (this.paused) { if (this.$('ov-pause').hidden) this.showOverlay('ov-pause'); else this.resume(); }
        else if (this.placing || this.selected) this.clearSelection();
        else this.pause();
        return;
      }
      if (this.paused || !this.game.canBuild) return;
      if (ev.code === 'Space') { ev.preventDefault(); this.nextWave(); return; }
      if (ev.key === 'u') { this.upgradeSelected(); return; }
      const type = Object.keys(TD.TOWER_DEFS).find(k => TD.TOWER_DEFS[k].key === ev.key);
      if (type) this.togglePlacing(type);
    },

    togglePlacing(type) {
      if (!this.game || !this.game.canBuild || !this.meta.isUnlocked(type)) return;
      this.placing = this.placing === type ? null : type;
      this.selected = null;
      this.renderSelection();
    },

    clearSelection() {
      this.placing = null;
      this.selected = null;
      this.renderSelection();
    },

    upgradeSelected() {
      if (this.selected && this.game.upgradeTower(this.selected)) this.renderSelection();
    },

    sellSelected() {
      if (this.selected && this.game.sellTower(this.selected)) {
        this.selected = null;
        this.renderSelection();
      }
    },
  });
})(self);
