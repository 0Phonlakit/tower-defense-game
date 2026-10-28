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
      this.saves = new TD.SaveSlots(safeStorage());
      this.slot = this.saves.lastSlot();
      this.meta = this.saves.open(this.slot);
      this.map = null;
      this.canvas = this.$('game');
      this.renderer = new TD.Renderer(this.canvas);
      this.settings = new TD.Settings(safeStorage());
      this.sound = new TD.SoundSystem(this.settings);
      this.game = null;
      this.paused = false;
      this.quitting = false;
      this.upgradeTab = 'attack';
      this.settingsReturn = 'ov-menu';
      this.guideTab = 'towers';
      this.guideReturn = 'ov-menu';
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

    // Shows exactly one overlay (or none) and hides the rest.
    showOverlay(id) {
      for (const el of this.doc.querySelectorAll('.overlay')) el.hidden = el.id !== id;
    }

    start() {
      this.bindInput();
      this.applyResolution();
      this.openSlots();
      this.lastFrame = performance.now();
      requestAnimationFrame(t => this.frame(t));
      return this;
    }

    // ---------- Flow ----------
    // Start goes straight into a run on a freshly rolled random map.
    startRun() {
      this.rollMap();
      const g = this.game = new TD.Game({ meta: this.meta, map: this.map });
      g.on('wavecleared', e => { this.sound.play('waveclear'); this.showPerkChoice(e); });
      g.on('gameover', r => { this.sound.play('gameover'); this.showGameOver(r); });
      g.on('fire', e => this.sound.play(e.type));
      for (const name of ['kill', 'reaction', 'basehit', 'wavestart', 'routeopen', 'skip']) g.on(name, () => this.sound.play(name));
      this.placing = null;
      this.selected = null;
      this.paused = false;
      this.quitting = false;
      this.showOverlay(null);
      this.buildTowerButtons();
      this.renderSelection();
      this.renderPerkList();
    }

    rollMap() {
      this.map = TD.GameMap.random();
      this.renderer.setMap(this.map);
    }

    // The main menu draws a random map behind it as a backdrop.
    openMenu() {
      this.game = null;
      this.paused = false;
      this.rollMap();
      this.$('menu-slot').textContent = this.slot;
      this.$('menu-coins').textContent = this.meta.coins;
      this.$('menu-best').textContent = this.meta.best;
      this.$('menu-runs').textContent = this.meta.runs;
      this.showOverlay('ov-menu');
    }

    // ---------- Save slots ----------
    // First screen: pick one of the 3 save slots. Each card shows coins, best wave and runs, or empty.
    openSlots() {
      this.game = null;
      this.rollMap();
      this.renderSlots();
      this.showOverlay('ov-slots');
    }

    renderSlots() {
      const list = this.$('slot-list');
      list.innerHTML = '';
      for (const s of this.saves.summaries()) {
        const card = this.doc.createElement('div');
        card.className = 'slot-card' + (s.slot === this.slot ? ' current' : '') + (s.empty ? ' empty' : '');
        card.innerHTML = `<div class="slot-info"><b>ช่อง ${s.slot}</b>${s.slot === this.slot ? ' <span class="muted small">(ล่าสุด)</span>' : ''}<div class="muted small">`
          + (s.empty ? 'ว่าง — เริ่มใหม่' : `🪙 ${s.coins} · Wave สูงสุด ${s.best} · เล่นไปแล้ว ${s.runs} รอบ`) + '</div></div>';
        const actions = this.doc.createElement('div');
        actions.className = 'row';
        const play = this.doc.createElement('button');
        play.className = 'btn primary small-btn';
        play.textContent = s.empty ? 'เริ่มใหม่' : 'เล่น';
        play.onclick = () => this.selectSlot(s.slot);
        actions.appendChild(play);
        if (!s.empty) {
          const del = this.doc.createElement('button');
          del.className = 'btn danger small-btn';
          del.textContent = 'ลบ';
          del.onclick = () => this.deleteSlot(s.slot);
          actions.appendChild(del);
        }
        card.appendChild(actions);
        list.appendChild(card);
      }
    }

    selectSlot(n) {
      this.slot = n;
      this.meta = this.saves.open(n);
      this.openMenu();
    }

    deleteSlot(n) {
      if (!confirm(`ลบช่องเซฟ ${n}? (Coin, อัพเกรด และป้อมที่ปลดล็อกในช่องนี้จะหายทั้งหมด)`)) return;
      this.saves.remove(n);
      if (n === this.slot) this.meta = this.saves.open(n);
      this.renderSlots();
    }

    openUpgrades() {
      this.renderUpgrades();
      this.showOverlay('ov-upgrade');
    }

    // from: the overlay to return to (main menu or pause menu).
    openSettings(from) {
      this.settingsReturn = from;
      this.renderSettings();
      this.showOverlay('ov-settings');
    }

    // from: the overlay to return to (main menu or pause menu). In a run it shows this map's units.
    openGuide(from) {
      this.guideReturn = from;
      this.renderGuide();
      this.showOverlay('ov-guide');
    }

    pause() {
      if (!this.game || this.game.isOver || this.game.phase === 'perk' || this.paused) return;
      this.paused = true;
      this.renderPerkList();
      this.showOverlay('ov-pause');
    }

    resume() {
      this.paused = false;
      this.showOverlay(null);
    }

    // Quitting ends the run like a Game Over, so the coins for cleared waves are still paid.
    quitRun() {
      this.paused = false;
      this.quitting = true;
      this.game.forfeit();
    }

    // Browsers only let a page close a tab that a script opened; otherwise show a goodbye screen.
    exitGame() {
      if (!confirm('ออกจากเกม?')) return;
      root.close();
      setTimeout(() => { if (!root.closed) this.showOverlay('ov-exit'); }, 300);
    }

    // Starts wave 1, or skips the countdown to the next wave for bonus gold.
    nextWave() {
      if (!this.game) return;
      if (this.game.phase === 'build') this.game.startWave();
      else this.game.skipCountdown();
    }

    choosePerk(index) {
      if (!this.game.choosePerk(index)) return;
      this.sound.play('perk');
      this.show('ov-perk', false);
      this.renderPerkList();
      this.renderSelection();
    }

    // ---------- Main loop ----------
    frame(now) {
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      if (this.game && !this.paused) {
        for (let i = 0; i < this.speed && this.game.canBuild; i++) this.game.update(dt);
      }
      this.renderer.draw(this.game, { placing: this.placing, selected: this.selected, hover: this.hover });
      this.updateHUD();
      requestAnimationFrame(t => this.frame(t));
    }

    // ---------- Input ----------
    tileFromEvent(ev) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (TD.BOARD_W / rect.width);
      const y = (ev.clientY - rect.top) * (TD.BOARD_H / rect.height);
      return { c: Math.floor(x / this.map.tile), r: Math.floor(y / this.map.tile) };
    }

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
      root.addEventListener('resize', () => { if (this.settings.resolution === 'auto') this.applyResolution(); });

      this.$('btn-wave').onclick = () => this.nextWave();
      this.$('btn-upgrade').onclick = () => this.upgradeSelected();
      this.$('btn-sell').onclick = () => this.sellSelected();
      this.$('btn-speed').onclick = () => {
        this.speed = this.speed === 3 ? 1 : this.speed + 1;
        this.$('btn-speed').textContent = `ความเร็ว x${this.speed}`;
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
        if (!confirm(`ล้างเซฟช่อง ${this.slot} (Coin, อัพเกรด, ป้อมที่ปลดล็อก)?`)) return;
        this.meta.reset();
        this.renderUpgrades();
      };
      this.bindSettings();
    }

    onCanvasClick({ c, r }) {
      if (!this.game || !this.game.canBuild || this.paused) return;
      if (this.placing) {
        if (this.game.buildTower(this.placing, c, r) && this.game.gold < this.game.towerCost(this.placing)) this.placing = null;
        return;
      }
      this.selected = this.game.towerAt(c, r);
      this.renderSelection();
    }

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
        const have = this.game.perkStacks[p.id] || 0;
        b.innerHTML = `<div class="p-name">${p.name}</div><div class="p-desc">${p.desc(this.game)}</div>`
          + (have ? `<div class="p-stack">มีแล้ว x${have}/${TD.MAX_PERK_STACKS}</div>` : '');
        b.onclick = () => this.choosePerk(i);
        box.appendChild(b);
      });
      this.show('ov-perk', true);
    }

    showGameOver({ wavesCleared, coins, newBest, totalCoins, kills }) {
      this.placing = null;
      this.$('over-title').textContent = this.quitting ? 'จบรอบ' : 'GAME OVER';
      this.$('over-summary').innerHTML = `
        <div>ผ่านไปได้ <b>${wavesCleared}</b> wave ${newBest ? '<b style="color:#4cd964">(สถิติใหม่!)</b>' : ''}</div>
        <div>กำจัดศัตรู <b>${kills}</b> ตัว</div>
        <div class="muted small">Coin = ${wavesCleared} × 5 + ${wavesCleared}² ÷ 3</div>
        <div class="coins">+${coins} Coin 🪙 (รวม ${totalCoins})</div>`;
      this.showOverlay('ov-over');
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

    // Upgrade/sell popup for the tower the player clicked; positioned every frame in placeTowerPop().
    renderSelection() {
      const t = this.selected;
      if (!t || !this.game) { this.show('tower-pop', false); return; }
      this.$('pop-name').textContent = `${t.def.name} Lv.${t.level}`;
      this.$('btn-sell').textContent = `ขาย (+${t.sellValue})`;
      this.show('tower-pop', true);
    }

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
    }

    // Stat lines for one tower's stats object (Guide tab).
    towerStatLines(s) {
      const lines = [`ดาเมจ: ${s.dmg.toFixed(1)}`, `ยิง/วินาที: ${s.rate.toFixed(2)}`, `ระยะ: ${Math.round(s.range)}`];
      if (s.splash) lines.push(`รัศมีระเบิด: ${Math.round(s.splash)}`);
      if (s.slow) lines.push(`ชะลอ: ${Math.round(s.slow * 100)}% / ${s.slowDur}s`);
      if (s.crit) lines.push(`คริติคอล: ${Math.round(s.crit * 100)}%`);
      if (s.element) lines.push(`ธาตุ: ${TD.ELEMENTS[s.element].name}`);
      if (s.burn) lines.push(`ติดไฟ: ${s.burn.toFixed(1)}/วิ นาน ${TD.BURN_DURATION} วิ`);
      if (s.poison) lines.push(`พิษ: ${s.poison.toFixed(1)}/วิ ต่อชั้น (สูงสุด ${TD.POISON_MAX_STACKS} ชั้น)`);
      if (s.chain) lines.push(`กระโดด: ${s.chain} ตัว`);
      lines.push(`ชนิดดาเมจ: ${TD.DAMAGE_TYPES[s.dmgType]}`);
      lines.push(s.air ? `ยิงอากาศได้ (อากาศ x${TD.AIR_BONUS} · พื้น x${TD.AA_GROUND_MULT})` : 'ยิงได้เฉพาะพื้นดิน');
      return lines;
    }

    // One line per perk taken, with how many times (a perk stops being offered at the limit).
    renderPerkList() {
      const g = this.game;
      const stacks = g ? Object.entries(g.perkStacks) : [];
      this.$('perk-list').innerHTML = stacks.length
        ? stacks.map(([id, n]) => {
          const p = TD.PERKS.find(x => x.id === id);
          const full = n >= TD.MAX_PERK_STACKS ? ' <b class="perk-full">(เต็ม)</b>' : '';
          return `<li>${p.name} x${n}${full} — ${p.desc(g)}</li>`;
        }).join('')
        : '<li class="muted">ยังไม่มี</li>';
    }

    // One enemy row for the legend, with flying and resistances for map-unique units.
    unitLine(type) {
      const d = TD.ENEMY_DEFS[type];
      const resist = Object.entries(d.resist || {}).map(([k, v]) =>
        v === 0 ? `ไม่รับ${TD.DAMAGE_TYPES[k]}` : `${TD.DAMAGE_TYPES[k]}เข้าแค่ ${Math.round(v * 100)}%`);
      const twin = d.groundTwin ? `ถ้ายังไม่มีป้อมยิงอากาศ จะมาเป็น${TD.ENEMY_DEFS[d.groundTwin].name}เดินดินแทน` : '';
      const note = [d.flying ? '✈ บินได้ (ป้อมยิงอากาศเท่านั้น)' : '', twin, ...resist].filter(Boolean).join(' · ');
      return `<div class="legend-item"><b><span class="dot" style="background:${d.color}"></span>${d.flying ? '✈ ' : ''}${d.name}</b><span>ฐาน -${d.dmg} HP</span></div>`
        + (note ? `<div class="legend-note">${note}</div>` : '');
    }

    // ---------- Guide ----------
    renderGuide() {
      const tabs = this.$('guide-tabs');
      tabs.innerHTML = '';
      for (const [id, label] of [['towers', 'ป้อม'], ['enemies', 'ศัตรู'], ['reactions', 'ปฏิกิริยาธาตุ']]) {
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
    }

    // Level-1 base stats of every tower, before permanent upgrades and perks.
    guideTowers() {
      return '<p class="muted small">ค่าพื้นฐานที่ Lv.1 ก่อนอัพเกรดถาวรและ Perk · กดที่ป้อมบนแผนที่เพื่ออัพเกรดหรือขาย</p><div class="shop-grid">'
        + Object.entries(TD.TOWER_DEFS).map(([type, d]) => {
          const lines = this.towerStatLines(new TD.Tower(type, 0, 0).stats());
          const unlock = d.unlock ? `ปลดล็อก 🪙 ${d.unlock}` : 'มีตั้งแต่เริ่ม';
          return `<div class="shop-item"><div class="s-name"><span class="dot" style="background:${d.color}"></span> ${d.key}. ${d.name}</div>`
            + `<div class="s-desc">${d.desc}</div><div class="s-level">สร้าง ${d.cost} gold · ${unlock}</div>`
            + `<div class="sel-stats">${lines.join('<br>')}</div></div>`;
        }).join('') + '</div>';
    }

    // Common enemies, then map units: this map's during a run, every map's from the main menu.
    guideEnemies() {
      const common = Object.keys(TD.ENEMY_DEFS).filter(t => !TD.ENEMY_DEFS[t].unique);
      let html = `<div class="legend">${common.map(t => this.unitLine(t)).join('')}</div>`;
      const maps = this.game ? [this.game.map] : TD.MAP_DEFS;
      html += '<h3>ศัตรูเฉพาะแผนที่ <small>(ตั้งแต่ wave 5)</small></h3>';
      for (const m of maps) {
        html += `<div class="legend guide-map"><div class="guide-map-name">${m.name}</div>${m.uniques.map(t => this.unitLine(t)).join('')}</div>`;
      }
      return html;
    }

    guideReactions() {
      const el = k => `<span class="dot" style="background:${TD.ELEMENTS[k].color}"></span>${TD.ELEMENTS[k].name}`;
      return '<p class="muted small">โจมตีด้วยธาตุหนึ่งจะติดสถานะธาตุนั้น 3 วินาที ถ้าโดนธาตุอื่นซ้ำจะเกิดปฏิกิริยา</p><div class="legend">'
        + Object.entries(TD.REACTIONS).map(([pair, r]) => {
          const [a, b] = pair.split('+');
          return `<div class="legend-item"><b>${el(a)} + ${el(b)}</b><span>${r.name}</span></div>`
            + `<div class="legend-note">${r.desc}</div>`;
        }).join('') + '</div>';
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
      this.setText('hud-map', `แผนที่: ${g.map.name} · เส้นทาง ${g.map.routesOpen(Math.max(1, g.wave))}/${g.map.routes.length}`);

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

      this.placeTowerPop();
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

    // ---------- Upgrade screen ----------
    renderUpgrades() {
      const m = this.meta;
      this.$('up-coins').textContent = m.coins;
      const tabs = this.$('up-tabs');
      tabs.innerHTML = '';
      for (const [id, label] of Object.entries(TD.UPGRADE_TABS)) {
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
          `<div class="s-name">${u.name}</div><div class="s-desc">${u.desc}</div>
           <div class="s-level">Lv ${lvl}/${u.max} · ตอนนี้ ${u.show(lvl)}</div>`,
          m.isMaxed(key) ? 'สูงสุดแล้ว' : `อัพเกรด 🪙 ${cost}`,
          m.isMaxed(key) || m.coins < cost,
          () => m.buyUpgrade(key)));
      }
    }

    renderUnlocks(list) {
      const m = this.meta;
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
        list.appendChild(item);
      }
    }

    // ---------- Settings ----------
    bindSettings() {
      const sel = this.$('set-resolution');
      sel.innerHTML = Object.entries(TD.RESOLUTIONS).map(([id, r]) => `<option value="${id}">${r.label}</option>`).join('');
      sel.onchange = () => { this.settings.setResolution(sel.value); this.applyResolution(); };
      const preview = { sfx: 'cannon', ui: 'perk' };
      for (const ch of ['sfx', 'music', 'ui']) {
        const input = this.$(`set-${ch}`);
        input.oninput = () => {
          this.settings.setVolume(ch, Number(input.value) / 100);
          this.sound.applyVolumes();
          this.$(`set-${ch}-val`).textContent = `${input.value}%`;
        };
        input.onchange = () => { if (preview[ch]) this.sound.play(preview[ch]); };
      }
    }

    renderSettings() {
      this.$('set-resolution').value = this.settings.resolution;
      for (const ch of ['sfx', 'music', 'ui']) {
        const pct = Math.round(this.settings[ch] * 100);
        this.$(`set-${ch}`).value = pct;
        this.$(`set-${ch}-val`).textContent = `${pct}%`;
      }
    }

    // Sizes the board for the chosen resolution and draws it at the screen's pixel density.
    applyResolution() {
      const narrow = root.innerWidth < 760;
      const availW = root.innerWidth - (narrow ? 32 : 300 + 48);
      const availH = root.innerHeight - 32;
      const { width, height } = this.settings.displaySize(availW, availH);
      const dpr = root.devicePixelRatio || 1;
      this.canvas.style.width = `${width}px`;
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.renderer.setScale(this.canvas.width / TD.BOARD_W);
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
