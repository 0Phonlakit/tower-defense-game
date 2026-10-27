// App: the settings screen (language, resolution, volumes) and applying them: text language and
// board size.
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;
  const { t } = TD.UIText;

  Object.assign(App.prototype, {
    // from: the overlay to return to (main menu or pause menu).
    openSettings(from) {
      this.settingsReturn = from;
      this.renderSettings();
      this.showOverlay('ov-settings');
    },

    // ---------- Settings ----------
    bindSettings() {
      const sel = this.$('set-resolution');
      sel.onchange = () => { this.settings.setResolution(sel.value); this.applyResolution(); };
      const lang = this.$('set-language');
      lang.innerHTML = Object.entries(TD.LANGUAGES).map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
      lang.onchange = () => { this.settings.setLanguage(lang.value); this.applyLanguage(); };
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
    },

    renderSettings() {
      const sel = this.$('set-resolution');
      sel.innerHTML = Object.entries(TD.RESOLUTIONS).map(([id, r]) => `<option value="${id}">${r.label || t(r.labelKey)}</option>`).join('');
      sel.value = this.settings.resolution;
      this.$('set-language').value = this.settings.language;
      for (const ch of ['sfx', 'music', 'ui']) {
        const pct = Math.round(this.settings[ch] * 100);
        this.$(`set-${ch}`).value = pct;
        this.$(`set-${ch}-val`).textContent = `${pct}%`;
      }
    },

    // Switches all text to the saved language: tagged page text, then whatever screen is open.
    applyLanguage() {
      TD.setLang(this.settings.language);
      this.doc.documentElement.lang = TD.getLang();
      for (const el of this.doc.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
      this.$('btn-speed').textContent = t('hud.speed', { n: this.speed });
      this.hudCache = {};
      const open = id => !this.$(id).hidden;
      if (open('ov-slots')) this.renderSlots();
      // The menu sits under the settings screen, so its stats line is refreshed even when hidden.
      this.$('menu-stats').innerHTML = t('menu.stats', { coins: this.meta.coins, best: this.meta.best, runs: this.meta.runs });
      if (open('ov-upgrade')) this.renderUpgrades();
      if (open('ov-settings')) this.renderSettings();
      if (open('ov-guide')) this.renderGuide();
      if (this.game) {
        this.buildTowerButtons();
        this.renderPerkList();
        this.renderSelection();
      }
    },

    // Sizes the board for the chosen resolution and draws it at the screen's pixel density.
    // The board and the info bar under it must fit the window together, so the bar's height is
    // taken off the space the board can use.
    applyResolution() {
      const narrow = root.innerWidth < 760;
      const bar = this.$('info-bar');
      const barHeight = bar.offsetHeight + parseFloat(getComputedStyle(bar).marginTop || 0);
      const app = this.$('app');
      const pad = parseFloat(getComputedStyle(app).paddingTop) || 16;
      const gap = parseFloat(getComputedStyle(app).columnGap) || 16;
      const border = 2; // the canvas has a 1px border on each side
      const availW = root.innerWidth - pad * 2 - (narrow ? 0 : 300 + gap) - border - 1;
      const availH = root.innerHeight - pad * 2 - barHeight - border - 1;
      const { width, height } = this.settings.displaySize(availW, availH);
      const dpr = root.devicePixelRatio || 1;
      this.canvas.style.width = `${width}px`;
      this.$('info-bar').style.width = `${width}px`;
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.renderer.setScale(this.canvas.width / TD.BOARD_W);
    },
  });
})(self);
