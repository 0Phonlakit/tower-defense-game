// Elements, elemental reactions and damage types.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

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

  // Damage types: physical (default), poison, and the four elements.
  const DAMAGE_TYPES = {
    physical: 'กายภาพ', poison: 'พิษ', fire: 'ไฟ', ice: 'น้ำแข็ง', water: 'น้ำ', lightning: 'ไฟฟ้า',
  };

  return { AURA_DURATION, BURN_DURATION, POISON_DURATION, POISON_MAX_STACKS, CHAIN_RANGE, CHAIN_FALLOFF,
    ELEMENTS, REACTIONS, reactionFor, DAMAGE_TYPES };
});
