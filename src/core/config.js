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
    gun:    { key: '1', name: 'ปืนกล',    cost: 50,  dmg: 8,  rate: 2.2,  range: 110, proj: 420, air: true, color: '#4a90d9', unlock: 0,   desc: 'ยิงเร็ว เป้าเดี่ยว · ยิงอากาศได้' },
    cannon: { key: '2', name: 'ปืนใหญ่',  cost: 90,  dmg: 22, rate: 0.7,  range: 100, proj: 260, splash: 55, color: '#e08a2e', unlock: 60, desc: 'กระสุนระเบิดวงกว้าง' },
    frost:  { key: '3', name: 'น้ำแข็ง',  cost: 70,  dmg: 4,  rate: 1.2,  range: 95,  proj: 300, splash: 40, slow: 0.4, slowDur: 1.6, element: 'ice', color: '#5bc8e8', unlock: 50, desc: 'ทำให้ศัตรูช้าลง · ธาตุน้ำแข็ง' },
    sniper: { key: '4', name: 'สไนเปอร์', cost: 120, dmg: 70, rate: 0.45, range: 230, instant: true, air: true, color: '#a66bd6', unlock: 100, desc: 'ระยะไกล ดาเมจสูง · ยิงอากาศได้' },
    flame:  { key: '5', name: 'เปลวไฟ',   cost: 80,  dmg: 6,  rate: 1.6,  range: 85,  proj: 300, burn: 8, element: 'fire', color: '#ff6b35', unlock: 80, desc: 'ติดไฟ ดาเมจต่อเนื่อง 3 วิ · ธาตุไฟ' },
    tesla:  { key: '6', name: 'เทสลา',    cost: 100, dmg: 18, rate: 0.9,  range: 110, instant: true, chain: 2, air: true, element: 'lightning', color: '#e8f55b', unlock: 120, desc: 'สายฟ้ากระโดดไปอีก 2 ตัว · ธาตุไฟฟ้า · ยิงอากาศได้' },
    tide:   { key: '7', name: 'สายน้ำ',   cost: 60,  dmg: 5,  rate: 1.0,  range: 100, proj: 280, splash: 45, element: 'water', color: '#1fb5a5', unlock: 70, desc: 'สาดน้ำเป็นวง เปิดทางให้ปฏิกิริยา · ธาตุน้ำ' },
    poison: { key: '8', name: 'พิษ',      cost: 90,  dmg: 4,  rate: 1.0,  range: 105, proj: 300, poison: 6, dmgType: 'poison', color: '#7bc043', unlock: 90, desc: 'พิษซ้อนได้ 5 ชั้น แรงกับตัวถึก' },
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

    // Map-only units (see uniques in MAP_DEFS). resist: damage type -> share of damage taken (0 = immune).
    bee:          { unique: true, flying: true, name: 'ผึ้งยักษ์',         hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#f2b705', resist: { poison: 0 } },
    beetle:       { unique: true,               name: 'ด้วงเขาเหล็ก',      hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#4f6d3a', resist: { poison: 0.35 } },
    firehawk:     { unique: true, flying: true, name: 'เหยี่ยวเพลิง',       hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#ff7a1a', resist: { fire: 0 } },
    sandworm:     { unique: true,               name: 'หนอนทรายยักษ์',     hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#b0894f', resist: { fire: 0.35 } },
    snowowl:      { unique: true, flying: true, name: 'นกฮูกหิมะ',         hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#f4f8fb', resist: { ice: 0 } },
    frostgiant:   { unique: true,               name: 'ยักษ์น้ำแข็ง',       hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#7fb8e0', resist: { ice: 0.35 } },
    lavaspirit:   { unique: true,               name: 'ภูตลาวา',           hp: 60,  speed: 55, dmg: 3, reward: 9,  r: 10, color: '#ff4500', resist: { fire: 0 } },
    magmagolem:   { unique: true,               name: 'โกเลมแมกมา',        hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#8b2f1c', resist: { fire: 0.35 } },
    mosquito:     { unique: true, flying: true, name: 'ยุงยักษ์',           hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#9aa35a', resist: { water: 0 } },
    bogcroc:      { unique: true,               name: 'จระเข้บึง',          hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#4b6b3c', resist: { water: 0.35 } },
    stormgull:    { unique: true, flying: true, name: 'นกนางนวลพายุ',      hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#c9d6e3', resist: { lightning: 0 } },
    crab:         { unique: true,               name: 'ปูเกราะ',            hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#d1503a', resist: { lightning: 0.35 } },
    bat:          { unique: true, flying: true, name: 'ค้างคาวแวมไพร์',     hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#5a2d6e', resist: { poison: 0 } },
    hauntedarmor: { unique: true,               name: 'ชุดเกราะผีสิง',      hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#6d7a99', resist: { physical: 0.35 } },
    crow:         { unique: true, flying: true, name: 'อีกา',              hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#2a2a2a', resist: { lightning: 0 } },
    treant:       { unique: true,               name: 'ต้นไม้เดินได้',       hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#7a5a2e', resist: { water: 0.35 } },
    crystalgolem: { unique: true,               name: 'โกเลมคริสตัล',       hp: 60,  speed: 55, dmg: 3, reward: 9,  r: 10, color: '#9f7aea', resist: { lightning: 0 } },
    crystalmoth:  { unique: true, flying: true, name: 'ผีเสื้อคริสตัล',      hp: 220, speed: 35, dmg: 3, reward: 20, r: 12, color: '#d4b8ff', resist: { ice: 0.35 } },
    gargoyle:     { unique: true, flying: true, name: 'การ์กอยล์',          hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#8a8478', resist: { physical: 0.5 } },
    mummy:        { unique: true,               name: 'มัมมี่',              hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#d8ccaa', resist: { fire: 0.35 } },
  };

  // Damage types: physical (default), poison, and the four elements.
  const DAMAGE_TYPES = {
    physical: 'กายภาพ', poison: 'พิษ', fire: 'ไฟ', ice: 'น้ำแข็ง', water: 'น้ำ', lightning: 'ไฟฟ้า',
  };

  // Anti-air towers (air: true) hit flyers harder and ground units softer than other towers.
  const AIR_BONUS = 1.15;
  const AA_GROUND_MULT = 0.8;

  const META_UPGRADES = {
    dmg:       { tab: 'attack', name: 'ดาเมจ',        desc: 'ดาเมจทุกป้อม +10%',         max: 20, base: 20, step: 15, show: l => `+${l * 10}%` },
    rate:      { tab: 'attack', name: 'ความเร็วยิง',  desc: 'ความเร็วยิงทุกป้อม +6%',     max: 10, base: 25, step: 20, show: l => `+${l * 6}%` },
    range:     { tab: 'attack', name: 'ระยะยิง',      desc: 'ระยะยิงทุกป้อม +5%',         max: 10, base: 25, step: 20, show: l => `+${l * 5}%` },
    startGold: { tab: 'economy', name: 'ทุนเริ่มต้น',   desc: 'Gold เริ่มต้น +30',          max: 10, base: 15, step: 12, show: l => `+${l * 30}` },
    gold:      { tab: 'economy', name: 'ค่าหัวศัตรู',   desc: 'Gold จากศัตรู +8%',          max: 10, base: 20, step: 15, show: l => `+${l * 8}%` },
    crit:      { tab: 'attack', name: 'คริติคอล',     desc: 'โอกาสคริติคอล (x2) +3%',    max: 10, base: 30, step: 20, show: l => `${l * 3}%` },
  };

  // Tabs of the upgrade screen. 'towers' lists tower unlocks; the others list META_UPGRADES with that tab.
  const UPGRADE_TABS = {
    attack:  'โจมตี',
    economy: 'เศรษฐกิจ',
    towers:  'ปลดล็อกป้อม',
  };

  // Per-run modifiers changed by perks.
  function defaultModifiers() {
    return { dmg: 1, rate: 1, range: 1, gold: 1, crit: 0, splash: 1, slow: 0, cost: 1, interest: 0 };
  }

  return {
    TILE, COLS, ROWS, MAX_HP, MAX_TOWER_LEVEL, STARTING_GOLD, WAVE_COUNTDOWN, SAVE_KEY,
    WAYPOINTS, TOWER_DEFS, ENEMY_DEFS, META_UPGRADES, UPGRADE_TABS, defaultModifiers,
    AURA_DURATION, BURN_DURATION, POISON_DURATION, POISON_MAX_STACKS, CHAIN_RANGE, CHAIN_FALLOFF,
    ELEMENTS, REACTIONS, reactionFor, DAMAGE_TYPES, AIR_BONUS, AA_GROUND_MULT,
  };
});
