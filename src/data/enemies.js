// Enemy types: common enemies, map-only units and their ground twins.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ENEMY_DEFS = {
    normal: { name: 'ก็อบลิน',     hp: 22,  speed: 55,  dmg: 1, reward: 5,  r: 9,  color: '#e5534b' },
    fast:   { name: 'หมาป่า',    hp: 13,  speed: 100, dmg: 1, reward: 5,  r: 7,  color: '#f2c94c' },
    tank:   { name: 'อัศวินออร์ค',   hp: 85,  speed: 33,  dmg: 2, reward: 12, r: 12, color: '#8a939e' },
    boss:   { name: 'มังกร (บอส ทุก 10 wave)', hp: 500, speed: 28, dmg: 5, reward: 80, r: 17, color: '#9b51e0' },

    // Map-only units (see uniques in MAP_DEFS). resist: damage type -> share of damage taken (0 = immune).
    bee:          { unique: true, flying: true, groundTwin: 'ant', name: 'ผึ้งยักษ์',         hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#f2b705', resist: { poison: 0 } },
    beetle:       { unique: true,               name: 'ด้วงเขาเหล็ก',      hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#4f6d3a', resist: { poison: 0.35 } },
    firehawk:     { unique: true, flying: true, groundTwin: 'firelizard', name: 'เหยี่ยวเพลิง',       hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#ff7a1a', resist: { fire: 0 } },
    sandworm:     { unique: true,               name: 'หนอนทรายยักษ์',     hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#b0894f', resist: { fire: 0.35 } },
    snowowl:      { unique: true, flying: true, groundTwin: 'snowhare', name: 'นกฮูกหิมะ',         hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#f4f8fb', resist: { ice: 0 } },
    frostgiant:   { unique: true,               name: 'ยักษ์น้ำแข็ง',       hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#7fb8e0', resist: { ice: 0.35 } },
    lavaspirit:   { unique: true,               name: 'ภูตลาวา',           hp: 60,  speed: 55, dmg: 3, reward: 9,  r: 10, color: '#ff4500', resist: { fire: 0 } },
    magmagolem:   { unique: true,               name: 'โกเลมแมกมา',        hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#8b2f1c', resist: { fire: 0.35 } },
    mosquito:     { unique: true, flying: true, groundTwin: 'leech', name: 'ยุงยักษ์',           hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#9aa35a', resist: { water: 0 } },
    bogcroc:      { unique: true,               name: 'จระเข้บึง',          hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#4b6b3c', resist: { water: 0.35 } },
    stormgull:    { unique: true, flying: true, groundTwin: 'stormturtle', name: 'นกนางนวลพายุ',      hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#c9d6e3', resist: { lightning: 0 } },
    crab:         { unique: true,               name: 'ปูเกราะ',            hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#d1503a', resist: { lightning: 0.35 } },
    bat:          { unique: true, flying: true, groundTwin: 'ghoulrat', name: 'ค้างคาวแวมไพร์',     hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#5a2d6e', resist: { poison: 0 } },
    hauntedarmor: { unique: true,               name: 'ชุดเกราะผีสิง',      hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#6d7a99', resist: { physical: 0.35 } },
    crow:         { unique: true, flying: true, groundTwin: 'scarecrow', name: 'อีกา',              hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#2a2a2a', resist: { lightning: 0 } },
    treant:       { unique: true,               name: 'ต้นไม้เดินได้',       hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#7a5a2e', resist: { water: 0.35 } },
    crystalgolem: { unique: true,               name: 'โกเลมคริสตัล',       hp: 60,  speed: 55, dmg: 3, reward: 9,  r: 10, color: '#9f7aea', resist: { lightning: 0 } },
    crystalmoth:  { unique: true, flying: true, groundTwin: 'crystalgrub', name: 'ผีเสื้อคริสตัล',      hp: 220, speed: 35, dmg: 3, reward: 20, r: 12, color: '#d4b8ff', resist: { ice: 0.35 } },
    gargoyle:     { unique: true, flying: true, groundTwin: 'statue', name: 'การ์กอยล์',          hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#8a8478', resist: { physical: 0.5 } },
    mummy:        { unique: true,               name: 'มัมมี่',              hp: 220, speed: 30, dmg: 3, reward: 20, r: 13, color: '#d8ccaa', resist: { fire: 0.35 } },

    // Ground twins: walk in place of a flyer while no anti-air tower is built (same HP, speed and resistance).
    ant:          { unique: true, twinOf: 'bee', name: 'มดยักษ์', hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#8a5a2b', resist: { poison: 0 } },
    firelizard:   { unique: true, twinOf: 'firehawk', name: 'กิ้งก่าเพลิง', hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#e0602a', resist: { fire: 0 } },
    snowhare:     { unique: true, twinOf: 'snowowl', name: 'กระต่ายหิมะ', hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#e8eef3', resist: { ice: 0 } },
    leech:        { unique: true, twinOf: 'mosquito', name: 'ปลิงยักษ์', hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#5d6b3a', resist: { water: 0 } },
    stormturtle:  { unique: true, twinOf: 'stormgull', name: 'เต่าพายุ', hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#7f96ad', resist: { lightning: 0 } },
    ghoulrat:     { unique: true, twinOf: 'bat', name: 'หนูผี', hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#4a3b55', resist: { poison: 0 } },
    scarecrow:    { unique: true, twinOf: 'crow', name: 'หุ่นไล่กา', hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#b8893f', resist: { lightning: 0 } },
    crystalgrub:  { unique: true, twinOf: 'crystalmoth', name: 'หนอนคริสตัล', hp: 220, speed: 35, dmg: 3, reward: 20, r: 12, color: '#c3a6f2', resist: { ice: 0.35 } },
    statue:       { unique: true, twinOf: 'gargoyle', name: 'รูปปั้นหินเดินได้', hp: 40,  speed: 70, dmg: 3, reward: 9,  r: 9,  color: '#9a958a', resist: { physical: 0.5 } },
  };

  return { ENEMY_DEFS };
});
