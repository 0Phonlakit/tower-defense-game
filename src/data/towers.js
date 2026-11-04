// Tower types: cost, stats, element and look. Anti-air multipliers for towers that hit flyers.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TOWER_DEFS = {
    gun:    { key: '1', name: 'หอธนู',    cost: 50,  dmg: 8,  rate: 2.2,  range: 110, proj: 420, air: true, color: '#4a90d9', unlock: 0,   desc: 'ยิงเร็ว เป้าเดี่ยว · ยิงอากาศได้' },
    cannon: { key: '2', name: 'เครื่องยิงหิน',  cost: 90,  dmg: 22, rate: 0.7,  range: 100, proj: 260, splash: 55, color: '#e08a2e', unlock: 60, desc: 'ก้อนหินระเบิดวงกว้าง' },
    frost:  { key: '3', name: 'จอมเวทน้ำแข็ง',  cost: 70,  dmg: 4,  rate: 1.2,  range: 95,  proj: 300, splash: 40, slow: 0.4, slowDur: 1.6, element: 'ice', color: '#5bc8e8', unlock: 50, desc: 'ทำให้ศัตรูช้าลง · ธาตุน้ำแข็ง' },
    sniper: { key: '4', name: 'หน้าไม้ยักษ์', cost: 120, dmg: 70, rate: 0.45, range: 230, instant: true, air: true, color: '#a66bd6', unlock: 100, desc: 'ระยะไกล ดาเมจสูง · ยิงอากาศได้' },
    flame:  { key: '5', name: 'จอมเวทไฟ',   cost: 80,  dmg: 6,  rate: 1.6,  range: 85,  proj: 300, burn: 8, element: 'fire', color: '#ff6b35', unlock: 80, desc: 'ติดไฟ ดาเมจต่อเนื่อง 3 วิ · ธาตุไฟ' },
    tesla:  { key: '6', name: 'คริสตัลพายุ',    cost: 100, dmg: 18, rate: 0.9,  range: 110, instant: true, chain: 2, air: true, element: 'lightning', color: '#e8f55b', unlock: 120, desc: 'สายฟ้ากระโดดไปอีก 2 ตัว · ธาตุไฟฟ้า · ยิงอากาศได้' },
    tide:   { key: '7', name: 'ศาลเจ้าน้ำ',   cost: 60,  dmg: 5,  rate: 1.0,  range: 100, proj: 280, splash: 45, element: 'water', color: '#1fb5a5', unlock: 70, desc: 'สาดน้ำเป็นวง เปิดทางให้ปฏิกิริยา · ธาตุน้ำ' },
    poison: { key: '8', name: 'นักเล่นแร่แปรธาตุ',      cost: 90,  dmg: 4,  rate: 1.0,  range: 105, proj: 300, poison: 6, dmgType: 'poison', color: '#7bc043', unlock: 90, desc: 'พิษซ้อนได้ 5 ชั้น แรงกับตัวถึก' },
  };

  // Anti-air towers (air: true) hit flyers harder and ground units softer than other towers.
  const AIR_BONUS = 1.15;
  const AA_GROUND_MULT = 0.8;

  return { TOWER_DEFS, AIR_BONUS, AA_GROUND_MULT };
});
