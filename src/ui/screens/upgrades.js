// App: the upgrade screen: permanent upgrades by tab and tower unlocks, bought with Coins.
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;
  const { t, L } = TD.UIText;

  Object.assign(App.prototype, {
    openUpgrades() {
      this.renderUpgrades();
      this.showOverlay('ov-upgrade');
    },

    // ---------- Upgrade screen ----------
    renderUpgrades() {
      const m = this.meta;
      this.$('up-coins').textContent = m.coins;
      const tabs = this.$('up-tabs');
      tabs.innerHTML = '';
      for (const id of Object.keys(TD.UPGRADE_TABS)) {
        const label = L.tab(id);
        const b = this.doc.createElement('button');
        b.className = 'tab' + (id === this.upgradeTab ? ' active' : '');
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', String(id === this.upgradeTab));
        b.textContent = label;
        b.onclick = () => { this.upgradeTab = id; this.renderUpgrades(); };
        tabs.appendChild(b);
      }

      const list = this.$('up-list');
      list.innerHTML = '';
      if (this.upgradeTab === 'towers') { this.renderUnlocks(list); return; }
      for (const [key, u] of Object.entries(TD.META_UPGRADES)) {
        if (u.tab !== this.upgradeTab) continue;
        const lvl = m.upgrades[key];
        const cost = m.upgradeCost(key);
        list.appendChild(this.shopItem(
          `<div class="s-name">${L.upgrade(key, 'name')}</div><div class="s-desc">${L.upgrade(key, 'desc')}</div>
           <div class="s-level">${t('up.level', { lvl, max: u.max, now: u.show(lvl) })}</div>`,
          m.isMaxed(key) ? t('up.maxed') : t('up.buy', { cost }),
          m.isMaxed(key) || m.coins < cost,
          () => m.buyUpgrade(key)));
      }
    },

    renderUnlocks(list) {
      const m = this.meta;
      for (const [type, d] of Object.entries(TD.TOWER_DEFS)) {
        if (!d.unlock) continue;
        const owned = m.isUnlocked(type);
        const item = this.shopItem(
          `<div class="s-name"><span class="dot" style="background:${d.color}"></span> ${L.tower(type)}</div>
           <div class="s-desc">${L.tower(type, 'desc')} · ${t('up.build', { cost: d.cost })}</div>`,
          owned ? t('up.unlocked') : t('up.unlock', { cost: d.unlock }),
          owned || m.coins < d.unlock,
          () => m.unlockTower(type));
        if (owned) item.classList.add('owned');
        list.appendChild(item);
      }
    },

    shopItem(html, label, disabled, onBuy) {
      const div = this.doc.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = html;
      const b = this.doc.createElement('button');
      b.className = 'btn';
      b.textContent = label;
      b.disabled = disabled;
      // Redraw right away: Coins, the bought item and every button that is now too expensive.
      b.onclick = () => { if (onBuy()) this.renderUpgrades(); };
      div.appendChild(b);
      return div;
    },
  });
})(self);
