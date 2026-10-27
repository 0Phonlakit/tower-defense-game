// Static game data: map, towers, enemies, permanent upgrades.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TILE = 40;
  const COLS = 20;
  const ROWS = 13;
  const MAX_HP = 20;
  const MAX_TOWER_LEVEL = 4;
  const STARTING_GOLD = 120;
  const WAVE_COUNTDOWN = 30; // seconds after a wave's last spawn before the next wave starts
  const SAVE_KEY = 'rogue-td-save-v1';

  // Path waypoints (tile col,row). First point is off-screen spawn, last point is the base.
  const WAYPOINTS = [[-1, 2], [4, 2], [4, 9], [9, 9], [9, 3], [14, 3], [14, 10], [17, 10], [17, 6], [19, 6]];

  const TOWER_DEFS = {
    gun:    { key: '1', name: 'ปืนกล',    cost: 50,  dmg: 8,  rate: 2.2,  range: 110, proj: 420, color: '#4a90d9', unlock: 0,   desc: 'ยิงเร็ว เป้าเดี่ยว' },
    cannon: { key: '2', name: 'ปืนใหญ่',  cost: 90,  dmg: 22, rate: 0.7,  range: 100, proj: 260, splash: 55, color: '#e08a2e', unlock: 60, desc: 'กระสุนระเบิดวงกว้าง' },
    frost:  { key: '3', name: 'น้ำแข็ง',  cost: 70,  dmg: 4,  rate: 1.2,  range: 95,  proj: 300, splash: 40, slow: 0.4, slowDur: 1.6, element: 'ice', color: '#5bc8e8', unlock: 50, desc: 'ทำให้ศัตรูช้าลง · ธาตุน้ำแข็ง' },
    sniper: { key: '4', name: 'สไนเปอร์', cost: 120, dmg: 70, rate: 0.45, range: 230, instant: true, color: '#a66bd6', unlock: 100, desc: 'ระยะไกล ดาเมจสูง' },
    flame:  { key: '5', name: 'เปลวไฟ',   cost: 80,  dmg: 6,  rate: 1.6,  range: 85,  proj: 300, burn: 8, element: 'fire', color: '#ff6b35', unlock: 80, desc: 'ติดไฟ ดาเมจต่อเนื่อง 3 วิ · ธาตุไฟ' },
    tesla:  { key: '6', name: 'เทสลา',    cost: 100, dmg: 18, rate: 0.9,  range: 110, instant: true, chain: 2, element: 'lightning', color: '#e8f55b', unlock: 120, desc: 'สายฟ้ากระโดดไปอีก 2 ตัว · ธาตุไฟฟ้า' },
    tide:   { key: '7', name: 'สายน้ำ',   cost: 60,  dmg: 5,  rate: 1.0,  range: 100, proj: 280, splash: 45, element: 'water', color: '#1fb5a5', unlock: 70, desc: 'สาดน้ำเป็นวง เปิดทางให้ปฏิกิริยา · ธาตุน้ำ' },
    poison: { key: '8', name: 'พิษ',      cost: 90,  dmg: 4,  rate: 1.0,  range: 105, proj: 300, poison: 6, color: '#7bc043', unlock: 90, desc: 'พิษซ้อนได้ 5 ชั้น แรงกับตัวถึก' },
  };

  // An elemental hit leaves an aura; a different element hitting that aura triggers a reaction and clears it.
  const AURA_DURATION = 3;
  const BURN_DURATION = 3;
  const POISON_DURATION = 4;
  const POISON_MAX_STACKS = 5;
  const CHAIN_RANGE = 90;
  const CHAIN_FALLOFF = 0.7;

  const ELEMENTS = {
    fire:      { name: 'ไฟ',      color: '#ff6b35' },
    ice:       { name: 'น้ำแข็ง',  color: '#8be3ff' },
    water:     { name: 'น้ำ',      color: '#3fa7ff' },
    lightning: { name: 'ไฟฟ้า',   color: '#e8f55b' },
  };

  // Keyed by the two elements in alphabetical order, joined with '+'.
  const REACTIONS = {
    'fire+ice':        { id: 'melt',          name: 'Melt',           color: '#ff9f43', mult: 2,   desc: 'ดาเมจครั้งนั้น x2' },
    'fire+water':      { id: 'vaporize',      name: 'Vaporize',       color: '#cfe8ff', mult: 1.5, desc: 'ดาเมจครั้งนั้น x1.5' },
    'fire+lightning':  { id: 'overload',      name: 'Overload',       color: '#ff5d8f', radius: 60, blast: 1.5, desc: 'ระเบิดวงกว้าง 1.5 เท่าของดาเมจ' },
    'ice+water':       { id: 'freeze',        name: 'Freeze',         color: '#8be3ff', duration: 1.5, bossDuration: 0.5, desc: 'แช่แข็งหยุดเดิน 1.5 วิ (บอส 0.5 วิ)' },
    'ice+lightning':   { id: 'superconduct',  name: 'Superconduct',   color: '#b39dff', vuln: 0.25, duration: 4, desc: 'รับดาเมจ +25% นาน 4 วิ' },
    'lightning+water': { id: 'electrocharged', name: 'Electro-charged', color: '#9b8cff', targets: 3, radius: 80, ratio: 0.5, desc: 'ช็อตต่อไปอีก 3 ตัว 50% ดาเมจ' },
  };

  function reactionFor(a, b) {
    if (!a || !b || a === b) return null;
    return REACTIONS[[a, b].sort().join('+')] || null;
  }

  const ENEMY_DEFS = {
    normal: { name: 'ธรรมดา',     hp: 22,  speed: 55,  dmg: 1, reward: 5,  r: 9,  color: '#e5534b' },
    fast:   { name: 'วิ่งเร็ว',    hp: 13,  speed: 100, dmg: 1, reward: 5,  r: 7,  color: '#f2c94c' },
    tank:   { name: 'หุ้มเกราะ',   hp: 85,  speed: 33,  dmg: 2, reward: 12, r: 12, color: '#8a939e' },
    boss:   { name: 'บอส (ทุก 10 wave)', hp: 500, speed: 28, dmg: 5, reward: 80, r: 17, color: '#9b51e0' },
  };

  const META_UPGRADES = {
    dmg:       { name: 'ดาเมจ',        desc: 'ดาเมจทุกป้อม +10%',         max: 20, base: 20, step: 15, show: l => `+${l * 10}%` },
    rate:      { name: 'ความเร็วยิง',  desc: 'ความเร็วยิงทุกป้อม +6%',     max: 10, base: 25, step: 20, show: l => `+${l * 6}%` },
    range:     { name: 'ระยะยิง',      desc: 'ระยะยิงทุกป้อม +5%',         max: 10, base: 25, step: 20, show: l => `+${l * 5}%` },
    startGold: { name: 'ทุนเริ่มต้น',   desc: 'Gold เริ่มต้น +30',          max: 10, base: 15, step: 12, show: l => `+${l * 30}` },
    gold:      { name: 'ค่าหัวศัตรู',   desc: 'Gold จากศัตรู +8%',          max: 10, base: 20, step: 15, show: l => `+${l * 8}%` },
    crit:      { name: 'คริติคอล',     desc: 'โอกาสคริติคอล (x2) +3%',    max: 10, base: 30, step: 20, show: l => `${l * 3}%` },
  };

  // Per-run modifiers changed by perks.
  function defaultModifiers() {
    return { dmg: 1, rate: 1, range: 1, gold: 1, crit: 0, splash: 1, slow: 0, cost: 1, interest: 0 };
  }

  return {
    TILE, COLS, ROWS, MAX_HP, MAX_TOWER_LEVEL, STARTING_GOLD, WAVE_COUNTDOWN, SAVE_KEY,
    WAYPOINTS, TOWER_DEFS, ENEMY_DEFS, META_UPGRADES, defaultModifiers,
    AURA_DURATION, BURN_DURATION, POISON_DURATION, POISON_MAX_STACKS, CHAIN_RANGE, CHAIN_FALLOFF,
    ELEMENTS, REACTIONS, reactionFor,
  };
});
