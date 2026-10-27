// App: the save-slot screen (first screen): pick, start or delete one of the 3 slots.
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;
  const { t } = TD.UIText;

  Object.assign(App.prototype, {
    // ---------- Save slots ----------
    // First screen: pick one of the 3 save slots. Each card shows coins, best wave and runs, or empty.
    openSlots() {
      this.game = null;
      this.renderSlots();
      this.showOverlay('ov-slots');
    },

    renderSlots() {
      const list = this.$('slot-list');
      list.innerHTML = '';
      for (const s of this.saves.summaries()) {
        const card = this.doc.createElement('div');
        card.className = 'slot-card' + (s.slot === this.slot ? ' current' : '') + (s.empty ? ' empty' : '');
        card.innerHTML = `<div class="slot-info"><b>${t('slots.slot', { n: s.slot })}</b>${s.slot === this.slot ? ` <span class="muted small">${t('slots.last')}</span>` : ''}<div class="muted small">`
          + (s.empty ? t('slots.empty') : t('slots.summary', s)) + '</div></div>';
        const actions = this.doc.createElement('div');
        actions.className = 'row';
        const play = this.doc.createElement('button');
        play.className = 'btn primary small-btn';
        play.textContent = s.empty ? t('slots.new') : t('slots.play');
        play.onclick = () => this.selectSlot(s.slot);
        actions.appendChild(play);
        if (!s.empty) {
          const del = this.doc.createElement('button');
          del.className = 'btn danger small-btn';
          del.textContent = t('slots.delete');
          del.onclick = () => this.deleteSlot(s.slot);
          actions.appendChild(del);
        }
        card.appendChild(actions);
        list.appendChild(card);
      }
    },

    selectSlot(n) {
      this.slot = n;
      this.meta = this.saves.open(n);
      this.openMenu();
    },

    deleteSlot(n) {
      if (!confirm(t('slots.confirmDelete', { n }))) return;
      this.saves.remove(n);
      if (n === this.slot) this.meta = this.saves.open(n);
      this.renderSlots();
    },
  });
})(self);
