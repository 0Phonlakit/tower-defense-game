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
    frost:  { key: '3', name: 'น้ำแข็ง',  cost: 70,  dmg: 4,  rate: 1.2,  range: 95,  proj: 300, splash: 40, slow: 0.4, slowDur: 1.6, color: '#5bc8e8', unlock: 50, desc: 'ทำให้ศัตรูช้าลง' },
    sniper: { key: '4', name: 'สไนเปอร์', cost: 120, dmg: 70, rate: 0.45, range: 230, instant: true, color: '#a66bd6', unlock: 100, desc: 'ระยะไกล ดาเมจสูง' },
  };

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
  };
});
