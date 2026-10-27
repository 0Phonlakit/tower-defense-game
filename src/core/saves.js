// Three save slots, each its own MetaProgress (coins, upgrades, unlocked towers, best wave, runs).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(Object.assign({}, require('./config.js'), require('./meta.js')));
  } else {
    root.TD = Object.assign(root.TD || {}, factory(root.TD));
  }
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  const SLOT_COUNT = 3;
  const LAST_SLOT_KEY = 'rogue-td-last-slot';
  const MIGRATED_KEY = 'rogue-td-slots-migrated';
  const slotKey = n => `rogue-td-save-slot-${n}`;

  class SaveSlots {
    // storage: any object with getItem/setItem (localStorage, or a fake in tests). null = no saving.
    constructor(storage = null) {
      this.storage = storage;
      this.migrate();
    }

    get(key) {
      try { return this.storage ? this.storage.getItem(key) : null; } catch (e) { return null; }
    }

    set(key, value) {
      try { if (this.storage) this.storage.setItem(key, value); } catch (e) { /* ignore */ }
    }

    // Progress saved before slots existed moves into slot 1, once. The old key is kept as a backup.
    migrate() {
      if (this.get(MIGRATED_KEY)) return;
      const legacy = this.get(TD.SAVE_KEY);
      if (legacy && !this.get(slotKey(1))) this.set(slotKey(1), legacy);
      this.set(MIGRATED_KEY, '1');
    }

    // What the slot screen shows: { slot, empty, coins, best, runs }. Unreadable data counts as empty.
    summary(n) {
      let saved = null;
      try { saved = JSON.parse(this.get(slotKey(n)) || 'null'); } catch (e) { saved = null; }
      if (!saved || typeof saved !== 'object') return { slot: n, empty: true, coins: 0, best: 0, runs: 0 };
      return { slot: n, empty: false, coins: Number(saved.coins) || 0, best: Number(saved.best) || 0, runs: Number(saved.runs) || 0 };
    }

    summaries() {
      return Array.from({ length: SLOT_COUNT }, (_, i) => this.summary(i + 1));
    }

    // Loads a slot and remembers it as the last one played. An empty slot starts fresh and stays
    // empty until something is saved to it.
    open(n) {
      if (!(n >= 1 && n <= SLOT_COUNT)) throw new Error(`No save slot ${n}`);
      this.set(LAST_SLOT_KEY, String(n));
      return new TD.MetaProgress(this.storage, slotKey(n));
    }

    remove(n) {
      if (!this.storage) return;
      try {
        if (typeof this.storage.removeItem === 'function') this.storage.removeItem(slotKey(n));
        else this.storage.setItem(slotKey(n), '');
      } catch (e) { /* ignore */ }
    }

    lastSlot() {
      const n = Number(this.get(LAST_SLOT_KEY));
      return n >= 1 && n <= SLOT_COUNT ? n : 1;
    }
  }

  return { SaveSlots, SLOT_COUNT, slotKey };
});
