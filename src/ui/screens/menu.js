// App: the main menu (Start, Upgrades, Settings, Guide, Exit).
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;
  const { t } = TD.UIText;

  Object.assign(App.prototype, {
    // The main menu draws a random map behind it as a backdrop.
    openMenu() {
      this.game = null;
      this.paused = false;
      this.$('menu-slot').textContent = this.slot;
      this.$('menu-stats').innerHTML = t('menu.stats', { coins: this.meta.coins, best: this.meta.best, runs: this.meta.runs });
      this.showOverlay('ov-menu');
    },

    // Browsers only let a page close a tab that a script opened; otherwise show a goodbye screen.
    exitGame() {
      if (!confirm(t('menu.confirmExit'))) return;
      root.close();
      setTimeout(() => { if (!root.closed) this.showOverlay('ov-exit'); }, 300);
    },
  });
})(self);
