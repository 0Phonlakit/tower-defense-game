// App: the perk choice shown after each cleared wave.
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;
  const { t, L } = TD.UIText;

  Object.assign(App.prototype, {
    // ---------- Overlays ----------
    showPerkChoice({ wave, bonus, interest, choices }) {
      if (!choices.length) return;
      this.$('perk-title').textContent = t('perk.title', { wave });
      this.$('perk-sub').textContent = t('perk.sub', { bonus, interest: interest ? t('perk.interest', { n: interest }) : '' });
      const box = this.$('perk-cards');
      box.innerHTML = '';
      choices.forEach((p, i) => {
        const b = this.doc.createElement('button');
        b.className = 'perk-card';
        const have = this.game.perkStacks[p.id] || 0;
        b.innerHTML = `<div class="p-name">${L.perk(p, 'name')}</div><div class="p-desc">${L.perk(p, 'desc', this.game)}</div>`
          + (have ? `<div class="p-stack">${t('perk.have', { n: have, max: TD.MAX_PERK_STACKS })}</div>` : '');
        b.onclick = () => this.choosePerk(i);
        box.appendChild(b);
      });
      this.show('ov-perk', true);
    },

    choosePerk(index) {
      if (!this.game.choosePerk(index)) return;
      this.sound.play('perk');
      this.show('ov-perk', false);
      this.renderPerkList();
      this.renderSelection();
    },
  });
})(self);
