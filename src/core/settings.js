// Player settings: language, board resolution and the three volume channels. Saved separately from game progress.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(Object.assign({}, require('./config.js'), require('./i18n.js')));
  else root.TD = Object.assign(root.TD || {}, factory(root.TD));
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  const SETTINGS_KEY = 'rogue-td-settings-v1';
  const BOARD_W = TD.COLS * TD.TILE;
  const BOARD_H = TD.ROWS * TD.TILE;

  // 'auto' fits the window; the others are fixed board sizes in CSS pixels (1x, 1.25x, 1.5x the board).
  const RESOLUTIONS = { auto: { labelKey: 'set.resAuto' } };
  for (const width of [BOARD_W, Math.round(BOARD_W * 1.25), Math.round(BOARD_W * 1.5)]) {
    const height = Math.round(width * BOARD_H / BOARD_W);
    RESOLUTIONS[`${width}x${height}`] = { label: `${width} × ${height}`, width };
  }

  const VOLUME_KEYS = ['sfx', 'music', 'ui'];

  class Settings {
    static defaults() {
      return { resolution: 'auto', sfx: 0.7, music: 0.4, ui: 0.7, language: 'th' };
    }

    // storage: any object with getItem/setItem (localStorage, or a fake in tests). null = no saving.
    constructor(storage = null, key = SETTINGS_KEY) {
      this.storage = storage;
      this.key = key;
      Object.assign(this, Settings.defaults());
      this.load();
    }

    load() {
      if (!this.storage) return;
      try {
        const saved = JSON.parse(this.storage.getItem(this.key) || 'null');
        if (!saved) return;
        if (saved.resolution in RESOLUTIONS) this.resolution = saved.resolution;
        if (saved.language in TD.LANGUAGES) this.language = saved.language;
        for (const k of VOLUME_KEYS) if (typeof saved[k] === 'number') this.setVolume(k, saved[k], false);
      } catch (e) { /* corrupt or blocked storage: keep defaults */ }
    }

    save() {
      if (!this.storage) return;
      const { resolution, sfx, music, ui, language } = this;
      try { this.storage.setItem(this.key, JSON.stringify({ resolution, sfx, music, ui, language })); } catch (e) { /* ignore */ }
    }

    setResolution(id) {
      if (!(id in RESOLUTIONS)) return false;
      this.resolution = id;
      this.save();
      return true;
    }

    // 'th' or 'en' (see TD.LANGUAGES).
    setLanguage(lang) {
      if (!(lang in TD.LANGUAGES)) return false;
      this.language = lang;
      this.save();
      return true;
    }

    // Volume is 0..1; out-of-range values are clamped.
    setVolume(channel, value, save = true) {
      if (!VOLUME_KEYS.includes(channel) || !Number.isFinite(value)) return false;
      this[channel] = Math.min(1, Math.max(0, value));
      if (save) this.save();
      return true;
    }

    // Board size in CSS pixels. Keeps the board's aspect ratio; 'auto' fits inside the space given.
    displaySize(availWidth = BOARD_W, availHeight = BOARD_H) {
      const fixed = RESOLUTIONS[this.resolution].width;
      const width = fixed || Math.max(320, Math.min(availWidth, availHeight * BOARD_W / BOARD_H));
      return { width: Math.round(width), height: Math.round(width * BOARD_H / BOARD_W) };
    }
  }

  return { Settings, RESOLUTIONS, SETTINGS_KEY, BOARD_W, BOARD_H };
});
