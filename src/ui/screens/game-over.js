// App: the end-of-run summary (Game Over or quit) with Coins earned.
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;
  const { t } = TD.UIText;

  Object.assign(App.prototype, {
    showGameOver({ wavesCleared, coins, newBest, totalCoins, kills }) {
      this.placing = null;
      this.$('over-title').textContent = this.quitting ? t('over.quitTitle') : t('over.title');
      this.$('over-summary').innerHTML = `
        <div>${t('over.waves', { n: wavesCleared })} ${newBest ? `<b style="color:#4cd964">${t('over.best')}</b>` : ''}</div>
        <div>${t('over.kills', { n: kills })}</div>
        <div class="muted small">Coin = ${wavesCleared} × 5 + ${wavesCleared}² ÷ 3</div>
        <div class="coins">${t('over.coins', { coins, total: totalCoins })}</div>`;
      this.showOverlay('ov-over');
    },
  });
})(self);
