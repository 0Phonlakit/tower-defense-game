// Run-only power-ups offered after each cleared wave.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(Object.assign({}, require('./config.js'), require('./utils.js')));
  } else {
    root.TD = Object.assign(root.TD || {}, factory(root.TD));
  }
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  const cashAmount = game => 60 + game.wave * 10;

  // A perk can be taken this many times per run; after that it is no longer offered.
  const MAX_PERK_STACKS = 10;

  const PERKS = [
    { id: 'dmg',      name: 'กระสุนเจาะเกราะ', desc: () => 'ดาเมจทุกป้อม +15%',                   apply: g => { g.mods.dmg += 0.15; } },
    { id: 'rate',     name: 'ไกปืนลื่น',       desc: () => 'ความเร็วยิงทุกป้อม +12%',              apply: g => { g.mods.rate += 0.12; } },
    { id: 'range',    name: 'กล้องเล็ง',       desc: () => 'ระยะยิงทุกป้อม +10%',                  cond: g => g.mods.range < 1.5, apply: g => { g.mods.range += 0.10; } },
    { id: 'gold',     name: 'ล่าค่าหัว',       desc: () => 'Gold จากศัตรู +20%',                    apply: g => { g.mods.gold += 0.2; } },
    { id: 'cash',     name: 'ทุนฉุกเฉิน',      desc: g => `รับ ${cashAmount(g)} gold ทันที`,        apply: g => { g.gold += cashAmount(g); } },
    { id: 'heal',     name: 'ซ่อมฐาน',        desc: () => 'ฟื้นพลังชีวิตฐาน +4 (สูงสุด 20)',       cond: g => g.hp < TD.MAX_HP, apply: g => { g.hp = Math.min(TD.MAX_HP, g.hp + 4); } },
    { id: 'crit',     name: 'จุดตาย',         desc: () => 'โอกาสคริติคอล (x2) +8%',                cond: g => g.mods.crit < 0.4, apply: g => { g.mods.crit += 0.08; } },
    { id: 'splash',   name: 'ดินปืนพิเศษ',     desc: () => 'รัศมีระเบิด/น้ำแข็ง/น้ำ +25%',          cond: g => ['cannon', 'frost', 'tide'].some(t => g.meta.isUnlocked(t)) && g.mods.splash < 2, apply: g => { g.mods.splash += 0.25; } },
    { id: 'slow',     name: 'ความเย็นยะเยือก', desc: () => 'ป้อมน้ำแข็งชะลอศัตรูเพิ่ม +10%',        cond: g => g.meta.isUnlocked('frost') && g.mods.slow < 0.3, apply: g => { g.mods.slow += 0.1; } },
    { id: 'cost',     name: 'ช่างราคามิตร',    desc: () => 'ราคาสร้าง/อัพเกรดป้อม -10%',           cond: g => g.mods.cost > 0.6, apply: g => { g.mods.cost *= 0.9; } },
    { id: 'interest', name: 'ดอกเบี้ย',        desc: () => 'จบ wave ได้ดอกเบี้ย +5% ของ gold ที่มี', cond: g => g.mods.interest < 0.2, apply: g => { g.mods.interest += 0.05; } },
  ];

  class PerkPicker {
    constructor(rng = Math.random, perks = PERKS) {
      this.rng = rng;
      this.perks = perks;
    }

    available(game) {
      const stacks = game.perkStacks || {};
      return this.perks.filter(p => (stacks[p.id] || 0) < MAX_PERK_STACKS && (!p.cond || p.cond(game)));
    }

    choices(game, count = 3) {
      return TD.pickRandom(this.available(game), count, this.rng);
    }
  }

  return { PERKS, PerkPicker, cashAmount, MAX_PERK_STACKS };
});
