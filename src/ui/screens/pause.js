// App: pausing a run: the pause screen with this run's perks, resume, and quitting to the menu.
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;
  const { t, L } = TD.UIText;

  Object.assign(App.prototype, {
    pause() {
      if (!this.game || this.game.isOver || this.game.phase === 'perk' || this.paused) return;
      this.paused = true;
      this.renderPerkList();
      this.showOverlay('ov-pause');
    },

    resume() {
      this.paused = false;
      this.showOverlay(null);
    },

    // Quitting ends the run like a Game Over, so the coins for cleared waves are still paid.
    quitRun() {
      this.paused = false;
      this.quitting = true;
      this.game.forfeit();
    },

    // One line per perk taken, with how many times (a perk stops being offered at the limit).
    renderPerkList() {
      const g = this.game;
      const stacks = g ? Object.entries(g.perkStacks) : [];
      this.$('perk-list').innerHTML = stacks.length
        ? stacks.map(([id, n]) => {
          const p = TD.PERKS.find(x => x.id === id);
          const full = n >= TD.MAX_PERK_STACKS ? ` <b class="perk-full">${t('perk.full')}</b>` : '';
          return `<li>${L.perk(p, 'name')} x${n}${full} — ${L.perk(p, 'desc', g)}</li>`;
        }).join('')
        : `<li class="muted">${t('pause.none')}</li>`;
    },
  });
})(self);
