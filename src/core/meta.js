// Permanent progress across runs: coins, upgrades, tower unlocks.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./config.js'));
  else root.TD = Object.assign(root.TD || {}, factory(root.TD));
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  class MetaProgress {
    static defaults() {
      return {
        coins: 0,
        best: 0,
        runs: 0,
        upgrades: Object.fromEntries(Object.keys(TD.META_UPGRADES).map(k => [k, 0])),
        unlocked: Object.fromEntries(Object.entries(TD.TOWER_DEFS).map(([k, d]) => [k, !d.unlock])),
      };
    }

    static coinsForWaves(cleared) {
      return cleared * 5 + Math.floor(cleared * cleared / 2);
    }

    // storage: any object with getItem/setItem (localStorage, or a fake in tests). null = no saving.
    constructor(storage = null, key = TD.SAVE_KEY) {
      this.storage = storage;
      this.key = key;
      Object.assign(this, MetaProgress.defaults());
      this.load();
    }

    load() {
      if (!this.storage) return;
      try {
        const raw = this.storage.getItem(this.key);
        if (!raw) return;
        const saved = JSON.parse(raw);
        const d = MetaProgress.defaults();
        this.coins = Number(saved.coins) || 0;
        this.best = Number(saved.best) || 0;
        this.runs = Number(saved.runs) || 0;
        this.upgrades = { ...d.upgrades, ...(saved.upgrades || {}) };
        this.unlocked = { ...d.unlocked, ...(saved.unlocked || {}) };
      } catch (e) { /* corrupt or blocked storage: keep defaults */ }
    }

    save() {
      if (!this.storage) return;
      const { coins, best, runs, upgrades, unlocked } = this;
      try { this.storage.setItem(this.key, JSON.stringify({ coins, best, runs, upgrades, unlocked })); } catch (e) { /* ignore */ }
    }

    reset() {
      Object.assign(this, MetaProgress.defaults());
      this.save();
    }

    upgradeCost(key) {
      const u = TD.META_UPGRADES[key];
      return u.base + u.step * this.upgrades[key];
    }

    isMaxed(key) {
      return this.upgrades[key] >= TD.META_UPGRADES[key].max;
    }

    buyUpgrade(key) {
      if (!TD.META_UPGRADES[key] || this.isMaxed(key)) return false;
      const cost = this.upgradeCost(key);
      if (this.coins < cost) return false;
      this.coins -= cost;
      this.upgrades[key]++;
      this.save();
      return true;
    }

    isUnlocked(type) {
      return !!this.unlocked[type];
    }

    unlockTower(type) {
      const def = TD.TOWER_DEFS[type];
      if (!def || this.isUnlocked(type) || this.coins < def.unlock) return false;
      this.coins -= def.unlock;
      this.unlocked[type] = true;
      this.save();
      return true;
    }

    // Pays out coins for a finished run.
    recordRun(wavesCleared) {
      const coins = MetaProgress.coinsForWaves(wavesCleared);
      const newBest = wavesCleared > this.best;
      this.coins += coins;
      this.best = Math.max(this.best, wavesCleared);
      this.runs++;
      this.save();
      return { wavesCleared, coins, newBest, totalCoins: this.coins };
    }
  }

  return { MetaProgress };
});
