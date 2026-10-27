// Browser glue: DOM panels, overlays, mouse/keyboard input and the main loop.
(function (root) {
  'use strict';
  const TD = root.TD;

  function safeStorage() {
    try { return root.localStorage; } catch (e) { return null; }
  }

  class App {
    constructor(doc = document) {
      this.doc = doc;
      this.meta = new TD.MetaProgress(safeStorage());
      this.path = new TD.Path();
      this.canvas = this.$('game');
      this.renderer = new TD.Renderer(this.canvas, this.path);
      this.game = null;
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

    start() {
      this.bindInput();
      this.renderLegend();
      this.openHub();
      this.lastFrame = performance.now();
      requestAnimationFrame(t => this.frame(t));
      return this;
    }

    // ---------- Flow ----------
    startRun() {
      this.game = new TD.Game({ meta: this.meta, path: this.path });
      this.game.on('wavecleared', e => this.showPerkChoice(e));
      this.game.on('gameover', r => this.showGameOver(r));
      this.placing = null;
      this.selected = null;
      this.show('ov-hub', false);
      this.show('ov-over', false);
      this.show('ov-perk', false);
      this.buildTowerButtons();
      this.renderSelection();
      this.renderPerkList();
    }

    openHub() {
      this.show('ov-over', false);
      this.show('ov-perk', false);
      this.renderHub();
      this.show('ov-hub', true);
    }

    // Starts wave 1, or skips the countdown to the next wave for bonus gold.
    nextWave() {
      if (!this.game) return;
      if (this.game.phase === 'build') this.game.startWave();
      else this.game.skipCountdown();
    }

    choosePerk(index) {
      if (!this.game.choosePerk(index)) return;
      this.show('ov-perk', false);
      this.renderPerkList();
      this.renderSelection();
    }

    // ---------- Main loop ----------
    frame(now) {
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      if (this.game) {
        for (let i = 0; i < this.speed && this.game.canBuild; i++) this.game.update(dt);
      }
      this.renderer.draw(this.game, { placing: this.placing, selected: this.selected, hover: this.hover });
      this.updateHUD();
      requestAnimationFrame(t => this.frame(t));
    }

    // ---------- Input ----------
    tileFromEvent(ev) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (this.canvas.height / rect.height);
      return { c: Math.floor(x / this.path.tile), r: Math.floor(y / this.path.tile) };
    }

    bindInput() {
      this.canvas.addEventListener('mousemove', ev => { this.hover = this.tileFromEvent(ev); });
      this.canvas.addEventListener('mouseleave', () => { this.hover = null; });
      this.canvas.addEventListener('click', ev => this.onCanvasClick(this.tileFromEvent(ev)));
      this.canvas.addEventListener('contextmenu', ev => { ev.preventDefault(); this.clearSelection(); });
      this.doc.addEventListener('keydown', ev => this.onKey(ev));

      this.$('btn-wave').onclick = () => this.nextWave();
      this.$('btn-upgrade').onclick = () => this.upgradeSelected();
      this.$('btn-sell').onclick = () => this.sellSelected();
      this.$('btn-speed').onclick = () => {
        this.speed = this.speed === 3 ? 1 : this.speed + 1;
        this.$('btn-speed').textContent = `ความเร็ว x${this.speed}`;
      };
      this.$('btn-start').onclick = () => this.startRun();
      this.$('btn-retry').onclick = () => this.startRun();
      this.$('btn-to-hub').onclick = () => this.openHub();
      this.$('btn-reset').onclick = () => {
        if (!confirm('ล้างเซฟทั้งหมด (Coin, อัพเกรด, ป้อมที่ปลดล็อก)?')) return;
        this.meta.reset();
        this.renderHub();
      };
    }

    onCanvasClick({ c, r }) {
      if (!this.game || !this.game.canBuild) return;
      if (this.placing) {
        if (this.game.buildTower(this.placing, c, r) && this.game.gold < this.game.towerCost(this.placing)) this.placing = null;
        return;
      }
      this.selected = this.game.towerAt(c, r);
      this.renderSelection();
    }

    onKey(ev) {
      if (!this.game || !this.game.canBuild) return;
      if (ev.code === 'Space') { ev.preventDefault(); this.nextWave(); return; }
      if (ev.key === 'Escape') { this.clearSelection(); return; }
      if (ev.key === 'u') { this.upgradeSelected(); return; }
      const type = Object.keys(TD.TOWER_DEFS).find(k => TD.TOWER_DEFS[k].key === ev.key);
      if (type) this.togglePlacing(type);
    }

    togglePlacing(type) {
      if (!this.game || !this.game.canBuild || !this.meta.isUnlocked(type)) return;
      this.placing = this.placing === type ? null : type;
      this.selected = null;
      this.renderSelection();
    }

    clearSelection() {
      this.placing = null;
      this.selected = null;
      this.renderSelection();
    }

    upgradeSelected() {
      if (this.selected && this.game.upgradeTower(this.selected)) this.renderSelection();
    }

    sellSelected() {
      if (this.selected && this.game.sellTower(this.selected)) {
        this.selected = null;
        this.renderSelection();
      }
    }

    // ---------- Overlays ----------
    showPerkChoice({ wave, bonus, interest, choices }) {
      if (!choices.length) return;
      this.$('perk-title').textContent = `ผ่าน Wave ${wave}!`;
      this.$('perk-sub').textContent = `ได้รับ ${bonus} gold${interest ? ` + ดอกเบี้ย ${interest}` : ''} · เลือกพลังพิเศษ 1 อย่าง`;
      const box = this.$('perk-cards');
      box.innerHTML = '';
      choices.forEach((p, i) => {
        const b = this.doc.createElement('button');
        b.className = 'perk-card';
        b.innerHTML = `<div class="p-name">${p.name}</div><div class="p-desc">${p.desc(this.game)}</div>`;
        b.onclick = () => this.choosePerk(i);
        box.appendChild(b);
      });
      this.show('ov-perk', true);
    }

    showGameOver({ wavesCleared, coins, newBest, totalCoins, kills }) {
      this.placing = null;
      this.$('over-summary').innerHTML = `
        <div>ผ่านไปได้ <b>${wavesCleared}</b> wave ${newBest ? '<b style="color:#4cd964">(สถิติใหม่!)</b>' : ''}</div>
        <div>กำจัดศัตรู <b>${kills}</b> ตัว</div>
        <div class="muted small">Coin = ${wavesCleared} × 5 + ${wavesCleared}² ÷ 3</div>
        <div class="coins">+${coins} Coin 🪙 (รวม ${totalCoins})</div>`;
      this.show('ov-over', true);
    }

    // ---------- Panels ----------
    buildTowerButtons() {
      const box = this.$('tower-buttons');
      box.innerHTML = '';
      for (const [type, d] of Object.entries(TD.TOWER_DEFS)) {
        const b = this.doc.createElement('button');
        b.className = 'tower-btn';
        b.dataset.type = type;
        b.innerHTML = `
          <div class="t-name"><span class="dot" style="background:${d.color}"></span>${d.key}. ${d.name}</div>
          <div class="t-cost"></div>
          <div class="t-desc">${this.meta.isUnlocked(type) ? d.desc : '🔒 ปลดล็อกที่หน้าอัพเกรด'}</div>`;
        b.onclick = () => this.togglePlacing(type);
        box.appendChild(b);
      }
    }

    renderSelection() {
      const t = this.selected;
      if (!t || !this.game) { this.show('sel-panel', false); return; }
      this.show('sel-panel', true);
      const s = this.game.towerStats(t);
      this.$('sel-name').textContent = `${t.def.name} (Lv.${t.level})`;
      const lines = [`ดาเมจ: ${s.dmg.toFixed(1)}`, `ยิง/วินาที: ${s.rate.toFixed(2)}`, `ระยะ: ${Math.round(s.range)}`];
      if (s.splash) lines.push(`รัศมีระเบิด: ${Math.round(s.splash)}`);
      if (s.slow) lines.push(`ชะลอ: ${Math.round(s.slow * 100)}% / ${s.slowDur}s`);
      if (s.crit) lines.push(`คริติคอล: ${Math.round(s.crit * 100)}%`);
      this.$('sel-stats').innerHTML = lines.join('<br>');
      this.$('btn-sell').textContent = `ขาย (+${t.sellValue})`;
    }

    renderPerkList() {
      const taken = this.game ? this.game.perksTaken : [];
      this.$('perk-list').innerHTML = taken.length
        ? taken.map(p => `<li>${p}</li>`).join('')
        : '<li class="muted">ยังไม่มี</li>';
    }

    renderLegend() {
      this.$('enemy-legend').innerHTML = Object.values(TD.ENEMY_DEFS).map(e =>
        `<div class="legend-item"><b><span class="dot" style="background:${e.color}"></span>${e.name}</b><span>ฐาน -${e.dmg} HP</span></div>`
      ).join('');
    }

    setText(id, value) {
      if (this.hudCache[id] === value) return;
      this.hudCache[id] = value;
      this.$(id).textContent = value;
    }

    updateHUD() {
      const g = this.game;
      if (!g) return;
      this.setText('hud-hp', `${g.hp} / ${TD.MAX_HP}`);
      this.setText('hud-gold', String(Math.floor(g.gold)));
      this.setText('hud-wave', String(g.wave));
      this.setText('hud-left', String(g.enemiesRemaining));

      for (const b of this.$('tower-buttons').children) {
        const type = b.dataset.type;
        const cost = g.towerCost(type);
        const unlocked = this.meta.isUnlocked(type);
        b.disabled = !unlocked || !g.canBuild;
        b.classList.toggle('active', this.placing === type);
        b.querySelector('.t-cost').textContent = unlocked ? `${cost} gold${g.gold < cost ? ' (ไม่พอ)' : ''}` : '';
      }

      const waveBtn = this.$('btn-wave');
      const canSkip = g.phase === 'wave' && g.countdown !== null;
      waveBtn.disabled = g.phase !== 'build' && !canSkip;
      if (g.phase === 'build') waveBtn.textContent = `เริ่ม Wave ${g.wave + 1} (Space)`;
      else if (canSkip) waveBtn.textContent = `ข้ามไป Wave ${g.wave + 1} (+${g.skipBonus} gold) · ${Math.ceil(g.countdown)}s`;
      else waveBtn.textContent = `Wave ${g.wave} กำลังดำเนิน...`;

      if (this.selected) {
        const up = this.$('btn-upgrade');
        if (this.selected.isMaxLevel) {
          up.textContent = 'เลเวลสูงสุด';
          up.disabled = true;
        } else {
          const cost = g.upgradeCost(this.selected);
          up.textContent = `อัพเกรด (${cost})`;
          up.disabled = g.gold < cost || !g.canBuild;
        }
      }
    }

    renderHub() {
      const m = this.meta;
      this.$('hub-coins').textContent = m.coins;
      this.$('hub-best').textContent = m.best;
      this.$('hub-runs').textContent = m.runs;

      const up = this.$('shop-upgrades');
      up.innerHTML = '';
      for (const [key, u] of Object.entries(TD.META_UPGRADES)) {
        const lvl = m.upgrades[key];
        const cost = m.upgradeCost(key);
        up.appendChild(this.shopItem(
          `<div class="s-name">${u.name}</div><div class="s-desc">${u.desc}</div>
           <div class="s-level">Lv ${lvl}/${u.max} · ตอนนี้ ${u.show(lvl)}</div>`,
          m.isMaxed(key) ? 'สูงสุดแล้ว' : `อัพเกรด 🪙 ${cost}`,
          m.isMaxed(key) || m.coins < cost,
          () => m.buyUpgrade(key)));
      }

      const un = this.$('shop-unlocks');
      un.innerHTML = '';
      for (const [type, d] of Object.entries(TD.TOWER_DEFS)) {
        if (!d.unlock) continue;
        const owned = m.isUnlocked(type);
        const item = this.shopItem(
          `<div class="s-name"><span class="dot" style="background:${d.color}"></span> ${d.name}</div>
           <div class="s-desc">${d.desc} · สร้าง ${d.cost} gold</div>`,
          owned ? 'ปลดล็อกแล้ว ✓' : `ปลดล็อก 🪙 ${d.unlock}`,
          owned || m.coins < d.unlock,
          () => m.unlockTower(type));
        if (owned) item.classList.add('owned');
        un.appendChild(item);
      }
    }

    shopItem(html, label, disabled, onBuy) {
      const div = this.doc.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = html;
      const b = this.doc.createElement('button');
      b.className = 'btn';
      b.textContent = label;
      b.disabled = disabled;
      b.onclick = () => { if (onBuy()) this.renderHub(); };
      div.appendChild(b);
      return div;
    }
  }

  TD.App = App;
})(self);
