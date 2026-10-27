// Permanent upgrades bought with Coins, and the tabs of the upgrade screen.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

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

  return { META_UPGRADES, UPGRADE_TABS };
});
