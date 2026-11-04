// App: the guide screen: tower stats, enemies (common and map units) and elemental reactions.
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;
  const { t, L } = TD.UIText;

  Object.assign(App.prototype, {
    // from: the overlay to return to (main menu or pause menu). In a run it shows this map's units.
    openGuide(from) {
      this.guideReturn = from;
      this.renderGuide();
      this.showOverlay('ov-guide');
    },

    // ---------- Guide ----------
    renderGuide() {
      const tabs = this.$('guide-tabs');
      tabs.innerHTML = '';
      for (const [id, label] of [['towers', t('guide.tabTowers')], ['enemies', t('guide.tabEnemies')], ['reactions', t('guide.tabReactions')]]) {
        const b = this.doc.createElement('button');
        b.className = 'tab' + (id === this.guideTab ? ' active' : '');
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', String(id === this.guideTab));
        b.textContent = label;
        b.onclick = () => { this.guideTab = id; this.renderGuide(); };
        tabs.appendChild(b);
      }
      const body = { towers: () => this.guideTowers(), enemies: () => this.guideEnemies(), reactions: () => this.guideReactions() };
      this.$('guide-body').innerHTML = body[this.guideTab]();
    },

    // Level-1 base stats of every tower, before permanent upgrades and perks.
    guideTowers() {
      return `<p class="muted small">${t('guide.towersNote')}</p><div class="shop-grid">`
        + Object.entries(TD.TOWER_DEFS).map(([type, d]) => {
          const lines = this.towerStatLines(new TD.Tower(type, 0, 0).stats());
          const unlock = d.unlock ? t('up.unlock', { cost: d.unlock }) : t('guide.startTower');
          return `<div class="shop-item"><div class="s-name"><span class="dot" style="background:${d.color}"></span> ${d.key}. ${L.tower(type)}</div>`
            + `<div class="s-desc">${L.tower(type, 'desc')}</div><div class="s-level">${t('up.build', { cost: d.cost })} · ${unlock}</div>`
            + `<div class="sel-stats">${lines.join('<br>')}</div></div>`;
        }).join('') + '</div>';
    },

    // Common enemies, then map units: this map's during a run, every map's from the main menu.
    guideEnemies() {
      const common = Object.keys(TD.ENEMY_DEFS).filter(t => !TD.ENEMY_DEFS[t].unique);
      let html = `<div class="legend">${common.map(t => this.unitLine(t)).join('')}</div>`;
      const maps = this.game ? [this.game.map] : TD.MAP_DEFS;
      html += `<h3>${t('guide.mapUnits')} <small>${t('guide.fromWave')}</small></h3>`;
      for (const m of maps) {
        html += `<div class="legend guide-map"><div class="guide-map-name">${L.map(m)}</div>${m.uniques.map(t => this.unitLine(t)).join('')}</div>`;
      }
      return html;
    },

    guideReactions() {
      const el = k => `<span class="dot" style="background:${TD.ELEMENTS[k].color}"></span>${L.element(k)}`;
      return `<p class="muted small">${t('guide.reactionsNote')}</p><div class="legend">`
        + Object.entries(TD.REACTIONS).map(([pair, r]) => {
          const [a, b] = pair.split('+');
          return `<div class="legend-item"><b>${el(a)} + ${el(b)}</b><span>${r.name}</span></div>`
            + `<div class="legend-note">${L.reaction(r)}</div>`;
        }).join('') + '</div>';
    },

    // One enemy row for the legend, with flying and resistances for map-unique units.
    unitLine(type) {
      const d = TD.ENEMY_DEFS[type];
      const resist = Object.entries(d.resist || {}).map(([k, v]) =>
        v === 0 ? t('unit.immune', { type: L.dmgType(k) }) : t('unit.resist', { type: L.dmgType(k), pct: Math.round(v * 100) }));
      const twin = d.groundTwin ? t('unit.twin', { name: L.enemy(d.groundTwin) }) : '';
      const note = [d.flying ? t('unit.flying') : '', twin, ...resist].filter(Boolean).join(' · ');
      return `<div class="legend-item"><b><span class="dot" style="background:${d.color}"></span>${d.flying ? '✈ ' : ''}${L.enemy(type)}</b><span>${t('unit.base', { dmg: d.dmg })}</span></div>`
        + (note ? `<div class="legend-note">${note}</div>` : '');
    },

    // Stat lines for one tower's stats object (Guide tab).
    towerStatLines(s) {
      const lines = [t('stat.dmg', { v: s.dmg.toFixed(1) }), t('stat.rate', { v: s.rate.toFixed(2) }), t('stat.range', { v: Math.round(s.range) })];
      if (s.splash) lines.push(t('stat.splash', { v: Math.round(s.splash) }));
      if (s.slow) lines.push(t('stat.slow', { v: Math.round(s.slow * 100), s: s.slowDur }));
      if (s.crit) lines.push(t('stat.crit', { v: Math.round(s.crit * 100) }));
      if (s.element) lines.push(t('stat.element', { v: L.element(s.element) }));
      if (s.burn) lines.push(t('stat.burn', { v: s.burn.toFixed(1), s: TD.BURN_DURATION }));
      if (s.poison) lines.push(t('stat.poison', { v: s.poison.toFixed(1), max: TD.POISON_MAX_STACKS }));
      if (s.chain) lines.push(t('stat.chain', { v: s.chain }));
      lines.push(t('stat.dmgType', { v: L.dmgType(s.dmgType) }));
      lines.push(s.air ? t('stat.air', { a: TD.AIR_BONUS, g: TD.AA_GROUND_MULT }) : t('stat.groundOnly'));
      return lines;
    },
  });
})(self);
