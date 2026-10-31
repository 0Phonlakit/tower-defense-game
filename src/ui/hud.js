// App: the in-game sidebar (status, tower buttons, wave controls), the tower upgrade/sell popup and
// the info bar under the board, updated every frame.
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;
  const { t, L } = TD.UIText;

  Object.assign(App.prototype, {
    // ---------- Panels ----------
    buildTowerButtons() {
      const box = this.$('tower-buttons');
      box.innerHTML = '';
      for (const [type, d] of Object.entries(TD.TOWER_DEFS)) {
        const b = this.doc.createElement('button');
        b.className = 'tower-btn';
        b.dataset.type = type;
        b.innerHTML = `
          <div class="t-name"><span class="dot" style="background:${d.color}"></span>${d.key}. ${L.tower(type)}</div>
          <div class="t-cost"></div>
          <div class="t-desc">${this.meta.isUnlocked(type) ? L.tower(type, 'desc') : t('tower.locked')}</div>`;
        b.title = `${L.tower(type)} — ${this.meta.isUnlocked(type) ? L.tower(type, 'desc') : t('tower.locked')}`;
        b.onclick = () => this.togglePlacing(type);
        box.appendChild(b);
      }
    },

    // Upgrade/sell popup for the tower the player clicked; positioned every frame in placeTowerPop().
    renderSelection() {
      const t = this.selected;
      if (!t || !this.game) { this.show('tower-pop', false); return; }
      this.$('pop-name').textContent = `${L.tower(t.type)} Lv.${t.level}`;
      this.$('btn-sell').textContent = TD.t('pop.sell', { v: t.sellValue });
      this.show('tower-pop', true);
    },

    // Above the tower if there is room, otherwise below it; kept inside the board.
    placeTowerPop() {
      const pop = this.$('tower-pop');
      const t = this.selected;
      if (!t || !this.game || this.paused || this.game.isOver) { pop.hidden = true; return; }
      pop.hidden = false;
      const c = this.canvas;
      const k = c.clientWidth / TD.BOARD_W;
      const half = pop.offsetWidth / 2;
      const x = Math.min(c.offsetLeft + c.clientWidth - half, Math.max(c.offsetLeft + half, c.offsetLeft + t.x * k));
      const above = t.y * k - 24 * k > pop.offsetHeight;
      pop.style.left = `${x}px`;
      pop.style.top = `${c.offsetTop + (above ? t.y - 24 : t.y + 24) * k}px`;
      pop.classList.toggle('below', !above);
    },

    setText(id, value) {
      if (this.hudCache[id] === value) return;
      this.hudCache[id] = value;
      this.$(id).textContent = value;
    },

    updateHUD() {
      const g = this.game;
      if (!g) { this.setText('info-bar', ''); return; }
      this.setText('hud-hp', `${g.hp} / ${TD.MAX_HP}`);
      this.setText('hud-gold', String(Math.floor(g.gold)));
      this.setText('hud-wave', String(g.wave));
      this.setText('hud-left', String(g.enemiesRemaining));
      const plan = g.upcoming;
      this.setText('info-bar', t('hud.info', { hp: g.hp, max: TD.MAX_HP, wave: g.wave }) + (plan ? t('hud.infoNext', { next: plan.wave, n: plan.queue.length }) : ''));
      this.setText('hud-map', t('hud.map', { map: L.map(g.map), open: g.map.routesOpen(Math.max(1, g.wave)), total: g.map.routes.length }));

      for (const b of this.$('tower-buttons').children) {
        const type = b.dataset.type;
        const cost = g.towerCost(type);
        const unlocked = this.meta.isUnlocked(type);
        b.disabled = !unlocked || !g.canBuild || g.gold < cost;
        b.classList.toggle('active', this.placing === type);
        b.querySelector('.t-cost').textContent = unlocked ? t('tower.cost', { cost }) + (g.gold < cost ? t('tower.notEnough') : '') : '';
      }

      const waveBtn = this.$('btn-wave');
      const canSkip = g.phase === 'wave' && g.countdown !== null;
      waveBtn.disabled = g.phase !== 'build' && !canSkip;
      if (g.phase === 'build') waveBtn.textContent = t('wave.start', { n: g.wave + 1 });
      else if (canSkip) waveBtn.textContent = t('wave.skip', { n: g.wave + 1, gold: g.skipBonus, s: Math.ceil(g.countdown) });
      else waveBtn.textContent = t('wave.running', { n: g.wave });

      this.placeTowerPop();
      if (this.selected) {
        const up = this.$('btn-upgrade');
        if (this.selected.isMaxLevel) {
          up.textContent = t('pop.max');
          up.disabled = true;
        } else {
          const cost = g.upgradeCost(this.selected);
          up.textContent = t('pop.upgrade', { cost });
          up.disabled = g.gold < cost || !g.canBuild;
        }
      }
    },
  });
})(self);
