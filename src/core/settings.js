// Player settings: board resolution and the three volume channels. Saved separately from game progress.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./config.js'));
  else root.TD = Object.assign(root.TD || {}, factory(root.TD));
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  const SETTINGS_KEY = 'rogue-td-settings-v1';
  const BOARD_W = TD.COLS * TD.TILE;
  const BOARD_H = TD.ROWS * TD.TILE;

  // 'auto' fits the window; the others are fixed board sizes in CSS pixels.
  const RESOLUTIONS = {
    auto:      { label: 'อัตโนมัติ (พอดีหน้าจอ)' },
    '800x520':  { label: '800 × 520', width: 800 },
    '1200x780': { label: '1200 × 780', width: 1200 },
    '1600x1040': { label: '1600 × 1040', width: 1600 },
  };

  const VOLUME_KEYS = ['sfx', 'music', 'ui'];

  class Settings {
    static defaults() {
      return { resolution: 'auto', sfx: 0.7, music: 0.4, ui: 0.7 };
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
        for (const k of VOLUME_KEYS) if (typeof saved[k] === 'number') this.setVolume(k, saved[k], false);
      } catch (e) { /* corrupt or blocked storage: keep defaults */ }
    }

    save() {
      if (!this.storage) return;
      const { resolution, sfx, music, ui } = this;
      try { this.storage.setItem(this.key, JSON.stringify({ resolution, sfx, music, ui })); } catch (e) { /* ignore */ }
    }

    setResolution(id) {
      if (!(id in RESOLUTIONS)) return false;
      this.resolution = id;
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

    // Board size in CSS pixels. Keeps the 20:13 board ratio; 'auto' fits inside the space given.
    displaySize(availWidth = BOARD_W, availHeight = BOARD_H) {
      const fixed = RESOLUTIONS[this.resolution].width;
      const width = fixed || Math.max(320, Math.min(availWidth, availHeight * BOARD_W / BOARD_H));
      return { width: Math.round(width), height: Math.round(width * BOARD_H / BOARD_W) };
    }
  }

  return { Settings, RESOLUTIONS, SETTINGS_KEY, BOARD_W, BOARD_H };
});
