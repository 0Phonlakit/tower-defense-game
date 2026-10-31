// Game text in Thai, English, Korean, Japanese and French. Thai and English live here; Korean,
// Japanese and French come as packs from lang-ko.js / lang-ja.js / lang-fr.js. UI strings are
// looked up by key; game data (towers, enemies, maps, ...) keeps its Thai names in its own file and
// gets the other languages' names from each language's data table.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(Object.assign({}, require('./lang-ko.js'), require('./lang-ja.js'), require('./lang-fr.js')));
  } else {
    root.TD = Object.assign(root.TD || {}, factory(root.TD));
  }
})(typeof self !== 'undefined' ? self : this, function (packs) {
  'use strict';

  const LANGUAGES = { th: 'ไทย', en: 'English' };

  // {name} placeholders are filled by t(key, params).
  const STRINGS = {
    th: {
      'common.back': 'กลับ',
      'hud.hp': 'พลังชีวิตฐาน',
      'hud.gold': 'Gold',
      'hud.wave': 'Wave',
      'hud.left': 'ศัตรูที่เหลือ',
      'hud.build': 'สร้างป้อม',
      'hud.buildKeys': '(กด 1-8)',
      'hud.speed': 'ความเร็ว x{n}',
      'hud.pause': '⏸ พัก (Esc)',
      'hud.map': 'แผนที่: {map} · เส้นทาง {open}/{total}',
      'hud.info': '❤ {hp}/{max} · Wave {wave}',
      'hud.infoNext': ' · Wave {next} ถัดไป: {n} ตัว',
      'wave.start': 'เริ่ม Wave {n} (Space)',
      'wave.skip': 'ข้ามไป Wave {n} (+{gold} gold) · {s}s',
      'wave.running': 'Wave {n} กำลังดำเนิน...',
      'tower.cost': '{cost} gold',
      'tower.notEnough': ' (ไม่พอ)',
      'tower.locked': '🔒 ปลดล็อกที่หน้าอัพเกรด',
      'pop.upgrade': 'อัพเกรด ({cost})',
      'pop.max': 'เลเวลสูงสุด',
      'pop.sell': 'ขาย (+{v})',
      'slots.intro': 'เลือกช่องเซฟ · แต่ละช่องเก็บ Coin อัพเกรด และป้อมที่ปลดล็อกแยกกัน',
      'slots.slot': 'ช่อง {n}',
      'slots.last': '(ล่าสุด)',
      'slots.empty': 'ว่าง — เริ่มใหม่',
      'slots.summary': '🪙 {coins} · Wave สูงสุด {best} · เล่นไปแล้ว {runs} รอบ',
      'slots.new': 'เริ่มใหม่',
      'slots.play': 'เล่น',
      'slots.delete': 'ลบ',
      'slots.confirmDelete': 'ลบช่องเซฟ {n}? (Coin, อัพเกรด และป้อมที่ปลดล็อกในช่องนี้จะหายทั้งหมด)',
      'menu.intro': 'ป้องกันฐานจากศัตรูบนแผนที่สุ่ม · จบแต่ละรอบได้ Coin เอาไปอัพเกรดถาวร',
      'menu.slot': 'ช่องเซฟ',
      'menu.changeSlot': 'เปลี่ยนช่องเซฟ',
      'menu.stats': '🪙 <b>{coins}</b> Coin · Wave สูงสุด <b>{best}</b> · เล่นไปแล้ว <b>{runs}</b> รอบ',
      'menu.start': 'เริ่มเกม',
      'menu.upgrade': 'อัพเกรด',
      'menu.settings': 'ตั้งค่า',
      'menu.guide': 'คู่มือ',
      'menu.exit': 'ออกจากเกม',
      'menu.confirmExit': 'ออกจากเกม?',
      'up.title': 'อัพเกรด',
      'up.formula': 'Coin ที่ได้ต่อรอบ = wave ที่ผ่าน × 5 + (wave ที่ผ่าน)² ÷ 3 — ยิ่งไปได้ไกล ยิ่งได้เยอะ',
      'up.reset': 'ล้างเซฟ',
      'up.confirmReset': 'ล้างเซฟช่อง {n} (Coin, อัพเกรด, ป้อมที่ปลดล็อก)?',
      'up.level': 'Lv {lvl}/{max} · ตอนนี้ {now}',
      'up.maxed': 'สูงสุดแล้ว',
      'up.buy': 'อัพเกรด 🪙 {cost}',
      'up.build': 'สร้าง {cost} gold',
      'up.unlocked': 'ปลดล็อกแล้ว ✓',
      'up.unlock': 'ปลดล็อก 🪙 {cost}',
      'set.title': 'ตั้งค่า',
      'set.language': 'ภาษา / Language',
      'set.resolution': 'ความละเอียด',
      'set.resAuto': 'อัตโนมัติ (พอดีหน้าจอ)',
      'set.sfx': 'เสียงเอฟเฟกต์',
      'set.music': 'เพลงพื้นหลัง',
      'set.ui': 'เสียงอื่น ๆ (ปุ่ม, แจ้งเตือน)',
      'pause.title': 'พักเกม',
      'pause.perks': 'Perk ที่ได้รอบนี้',
      'pause.none': 'ยังไม่มี',
      'pause.resume': 'เล่นต่อ',
      'pause.quit': 'ออกไปเมนู (จบรอบนี้)',
      'perk.full': '(เต็ม)',
      'perk.title': 'ผ่าน Wave {wave}!',
      'perk.sub': 'ได้รับ {bonus} gold{interest} · เลือกพลังพิเศษ 1 อย่าง',
      'perk.interest': ' + ดอกเบี้ย {n}',
      'perk.have': 'มีแล้ว x{n}/{max}',
      'guide.title': 'คู่มือ',
      'guide.tabTowers': 'ป้อม',
      'guide.tabEnemies': 'ศัตรู',
      'guide.tabReactions': 'ปฏิกิริยาธาตุ',
      'guide.towersNote': 'ค่าพื้นฐานที่ Lv.1 ก่อนอัพเกรดถาวรและ Perk · กดที่ป้อมบนแผนที่เพื่ออัพเกรดหรือขาย',
      'guide.startTower': 'มีตั้งแต่เริ่ม',
      'guide.mapUnits': 'ศัตรูเฉพาะแผนที่',
      'guide.fromWave': '(ตั้งแต่ wave 5)',
      'guide.reactionsNote': 'โจมตีด้วยธาตุหนึ่งจะติดสถานะธาตุนั้น 3 วินาที ถ้าโดนธาตุอื่นซ้ำจะเกิดปฏิกิริยา',
      'stat.dmg': 'ดาเมจ: {v}',
      'stat.rate': 'ยิง/วินาที: {v}',
      'stat.range': 'ระยะ: {v}',
      'stat.splash': 'รัศมีระเบิด: {v}',
      'stat.slow': 'ชะลอ: {v}% / {s}s',
      'stat.crit': 'คริติคอล: {v}%',
      'stat.element': 'ธาตุ: {v}',
      'stat.burn': 'ติดไฟ: {v}/วิ นาน {s} วิ',
      'stat.poison': 'พิษ: {v}/วิ ต่อชั้น (สูงสุด {max} ชั้น)',
      'stat.chain': 'กระโดด: {v} ตัว',
      'stat.dmgType': 'ชนิดดาเมจ: {v}',
      'stat.air': 'ยิงอากาศได้ (อากาศ x{a} · พื้น x{g})',
      'stat.groundOnly': 'ยิงได้เฉพาะพื้นดิน',
      'unit.base': 'ฐาน -{dmg} HP',
      'unit.immune': 'ไม่รับ{type}',
      'unit.resist': '{type}เข้าแค่ {pct}%',
      'unit.flying': '✈ บินได้ (ป้อมยิงอากาศเท่านั้น)',
      'unit.twin': 'ถ้ายังไม่มีป้อมยิงอากาศ จะมาเป็น{name}เดินดินแทน',
      'exit.title': 'ขอบคุณที่เล่น!',
      'exit.msg': 'เบราว์เซอร์ไม่อนุญาตให้หน้าเว็บปิดแท็บเอง ปิดแท็บนี้ได้เลย',
      'exit.back': 'กลับเมนู',
      'over.title': 'GAME OVER',
      'over.quitTitle': 'จบรอบ',
      'over.waves': 'ผ่านไปได้ <b>{n}</b> wave',
      'over.best': '(สถิติใหม่!)',
      'over.kills': 'กำจัดศัตรู <b>{n}</b> ตัว',
      'over.formula': 'Coin = {n} × 5 + {n}² ÷ 3',
      'over.coins': '+{coins} Coin 🪙 (รวม {total})',
      'over.menu': 'กลับเมนู',
      'over.retry': 'เล่นอีกครั้ง',
      'fx.skip': 'ข้าม! +{bonus} gold',
      'fx.routeOpen': 'เส้นทางใหม่เปิดแล้ว!',
      'fx.waveCleared': 'ผ่าน Wave {wave}! +{gold} gold',
    },
    en: {
      'common.back': 'Back',
      'hud.hp': 'Base HP',
      'hud.gold': 'Gold',
      'hud.wave': 'Wave',
      'hud.left': 'Enemies left',
      'hud.build': 'Build towers',
      'hud.buildKeys': '(keys 1-8)',
      'hud.speed': 'Speed x{n}',
      'hud.pause': '⏸ Pause (Esc)',
      'hud.map': 'Map: {map} · Routes {open}/{total}',
      'hud.info': '❤ {hp}/{max} · Wave {wave}',
      'hud.infoNext': ' · Next wave {next}: {n} enemies',
      'wave.start': 'Start wave {n} (Space)',
      'wave.skip': 'Skip to wave {n} (+{gold} gold) · {s}s',
      'wave.running': 'Wave {n} in progress...',
      'tower.cost': '{cost} gold',
      'tower.notEnough': ' (not enough)',
      'tower.locked': '🔒 Unlock in Upgrades',
      'pop.upgrade': 'Upgrade ({cost})',
      'pop.max': 'Max level',
      'pop.sell': 'Sell (+{v})',
      'slots.intro': 'Choose a save slot · each slot keeps its own Coins, upgrades and unlocked towers',
      'slots.slot': 'Slot {n}',
      'slots.last': '(last played)',
      'slots.empty': 'Empty — new game',
      'slots.summary': '🪙 {coins} · Best wave {best} · {runs} runs',
      'slots.new': 'New game',
      'slots.play': 'Play',
      'slots.delete': 'Delete',
      'slots.confirmDelete': 'Delete save slot {n}? Its Coins, upgrades and unlocked towers will be lost.',
      'menu.intro': 'Defend your base from enemies on a random map · every run earns Coins for permanent upgrades',
      'menu.slot': 'Save slot',
      'menu.changeSlot': 'Change slot',
      'menu.stats': '🪙 <b>{coins}</b> Coins · Best wave <b>{best}</b> · <b>{runs}</b> runs',
      'menu.start': 'Start',
      'menu.upgrade': 'Upgrades',
      'menu.settings': 'Settings',
      'menu.guide': 'Guide',
      'menu.exit': 'Exit',
      'menu.confirmExit': 'Exit the game?',
      'up.title': 'Upgrades',
      'up.formula': 'Coins per run = waves cleared × 5 + (waves cleared)² ÷ 3 — the further you get, the more you earn',
      'up.reset': 'Reset save',
      'up.confirmReset': 'Reset save slot {n} (Coins, upgrades, unlocked towers)?',
      'up.level': 'Lv {lvl}/{max} · now {now}',
      'up.maxed': 'Maxed',
      'up.buy': 'Upgrade 🪙 {cost}',
      'up.build': 'Build {cost} gold',
      'up.unlocked': 'Unlocked ✓',
      'up.unlock': 'Unlock 🪙 {cost}',
      'set.title': 'Settings',
      'set.language': 'ภาษา / Language',
      'set.resolution': 'Resolution',
      'set.resAuto': 'Auto (fit window)',
      'set.sfx': 'Sound effects',
      'set.music': 'Music',
      'set.ui': 'Other sounds (buttons, alerts)',
      'pause.title': 'Paused',
      'pause.perks': 'Perks this run',
      'pause.none': 'None yet',
      'pause.resume': 'Resume',
      'pause.quit': 'Quit to menu (ends this run)',
      'perk.full': '(max)',
      'perk.title': 'Wave {wave} cleared!',
      'perk.sub': '+{bonus} gold{interest} · pick 1 perk',
      'perk.interest': ' + {n} interest',
      'perk.have': 'Have x{n}/{max}',
      'guide.title': 'Guide',
      'guide.tabTowers': 'Towers',
      'guide.tabEnemies': 'Enemies',
      'guide.tabReactions': 'Reactions',
      'guide.towersNote': 'Level 1 base stats, before permanent upgrades and perks · click a tower on the map to upgrade or sell it',
      'guide.startTower': 'Available from the start',
      'guide.mapUnits': 'Map units',
      'guide.fromWave': '(from wave 5)',
      'guide.reactionsNote': 'An elemental hit marks the enemy for 3 seconds; hitting it with a different element triggers a reaction',
      'stat.dmg': 'Damage: {v}',
      'stat.rate': 'Shots/sec: {v}',
      'stat.range': 'Range: {v}',
      'stat.splash': 'Splash radius: {v}',
      'stat.slow': 'Slow: {v}% / {s}s',
      'stat.crit': 'Crit: {v}%',
      'stat.element': 'Element: {v}',
      'stat.burn': 'Burn: {v}/s for {s}s',
      'stat.poison': 'Poison: {v}/s per stack (max {max} stacks)',
      'stat.chain': 'Chains to: {v} enemies',
      'stat.dmgType': 'Damage type: {v}',
      'stat.air': 'Hits air (air x{a} · ground x{g})',
      'stat.groundOnly': 'Ground only',
      'unit.base': 'Base -{dmg} HP',
      'unit.immune': 'Immune to {type}',
      'unit.resist': 'Takes {pct}% {type}',
      'unit.flying': '✈ Flies (anti-air towers only)',
      'unit.twin': 'Without anti-air it comes as a {name} on foot',
      'exit.title': 'Thanks for playing!',
      'exit.msg': "Your browser doesn't let a page close its own tab, so you can close this tab now",
      'exit.back': 'Back to menu',
      'over.title': 'GAME OVER',
      'over.quitTitle': 'Run ended',
      'over.waves': 'Cleared <b>{n}</b> waves',
      'over.best': '(new best!)',
      'over.kills': 'Defeated <b>{n}</b> enemies',
      'over.formula': 'Coins = {n} × 5 + {n}² ÷ 3',
      'over.coins': '+{coins} Coins 🪙 (total {total})',
      'over.menu': 'Back to menu',
      'over.retry': 'Play again',
      'fx.skip': 'Skipped! +{bonus} gold',
      'fx.routeOpen': 'A new route opened!',
      'fx.waveCleared': 'Wave {wave} cleared! +{gold} gold',
    },
  };

  // English names for game data, by kind and id. Thai comes from the data itself.
  const DATA_EN = {
    tower: {
      gun:    { name: 'Archer tower',  desc: 'Fast single-target shots · hits air' },
      cannon: { name: 'Catapult',      desc: 'Boulders that hit an area' },
      frost:  { name: 'Frost mage',    desc: 'Slows enemies · Ice' },
      sniper: { name: 'Ballista',      desc: 'Long range, high damage · hits air' },
      flame:  { name: 'Fire mage',     desc: 'Sets enemies on fire for 3s · Fire' },
      tesla:  { name: 'Storm crystal', desc: 'Lightning jumps to 2 more enemies · Lightning · hits air' },
      tide:   { name: 'Water shrine',  desc: 'Splashes water to set up reactions · Water' },
      poison: { name: 'Alchemist',     desc: 'Poison stacks up to 5 times, strong against tough enemies' },
    },
    enemy: {
      normal: { name: 'Goblin' }, fast: { name: 'Wolf' }, tank: { name: 'Orc knight' }, boss: { name: 'Dragon (boss every 10 waves)' },
      bee: { name: 'Giant bee' }, beetle: { name: 'Iron beetle' }, firehawk: { name: 'Fire hawk' }, sandworm: { name: 'Giant sand worm' },
      snowowl: { name: 'Snow owl' }, frostgiant: { name: 'Frost giant' }, lavaspirit: { name: 'Lava spirit' }, magmagolem: { name: 'Magma golem' },
      mosquito: { name: 'Giant mosquito' }, bogcroc: { name: 'Bog croc' }, stormgull: { name: 'Storm gull' }, crab: { name: 'Armored crab' },
      bat: { name: 'Vampire bat' }, hauntedarmor: { name: 'Haunted armor' }, crow: { name: 'Crow' }, treant: { name: 'Treant' },
      crystalgolem: { name: 'Crystal golem' }, crystalmoth: { name: 'Crystal moth' }, gargoyle: { name: 'Gargoyle' }, mummy: { name: 'Mummy' },
      ant: { name: 'Giant ant' }, firelizard: { name: 'Fire lizard' }, snowhare: { name: 'Snow hare' }, leech: { name: 'Giant leech' },
      stormturtle: { name: 'Storm turtle' }, ghoulrat: { name: 'Ghoul rat' }, scarecrow: { name: 'Scarecrow' }, crystalgrub: { name: 'Crystal grub' },
      statue: { name: 'Walking statue' },
    },
    map: {
      meadow: { name: 'Meadow' }, desert: { name: 'Desert' }, snow: { name: 'Snowfield' }, lava: { name: 'Volcano' },
      swamp: { name: 'Misty swamp' }, beach: { name: 'Beach' }, night: { name: 'Night field' }, autumn: { name: 'Autumn forest' },
      crystal: { name: 'Crystal cave' }, ruins: { name: 'Ancient ruins' },
    },
    upgrade: {
      dmg:       { name: 'Damage',        desc: 'All towers +10% damage' },
      rate:      { name: 'Fire rate',     desc: 'All towers fire 6% faster' },
      range:     { name: 'Range',         desc: 'All towers +5% range' },
      startGold: { name: 'Starting gold', desc: '+30 starting gold' },
      gold:      { name: 'Bounty',        desc: '+8% gold from enemies' },
      crit:      { name: 'Critical hits', desc: '+3% chance of a critical (x2) hit' },
    },
    perk: {
      dmg:      { name: 'Piercing shots',    desc: 'All towers +15% damage' },
      rate:     { name: 'Quick hands',       desc: 'All towers fire 12% faster' },
      range:    { name: 'Eagle eye',         desc: 'All towers +10% range' },
      gold:     { name: 'Bounty hunter',     desc: '+20% gold from enemies' },
      cash:     { name: 'Emergency funds',   desc: n => `Get ${n} gold now` },
      heal:     { name: 'Repair base',       desc: 'Restore 4 base HP (max 20)' },
      crit:     { name: 'Weak spot',         desc: '+8% critical (x2) chance' },
      splash:   { name: 'Blast powder',      desc: 'Catapult/frost/water splash radius +25%' },
      slow:     { name: 'Bitter cold',       desc: 'Frost mage slows 10% more' },
      cost:     { name: 'Friendly builder',  desc: 'Tower build/upgrade cost -10%' },
      interest: { name: 'Interest',          desc: '+5% of your gold as interest on each cleared wave' },
    },
    element: { fire: { name: 'Fire' }, ice: { name: 'Ice' }, water: { name: 'Water' }, lightning: { name: 'Lightning' } },
    reaction: {
      melt:           { desc: 'That hit deals x2' },
      vaporize:       { desc: 'That hit deals x1.5' },
      overload:       { desc: 'Blast hits nearby enemies for 1.5x damage' },
      freeze:         { desc: 'Frozen in place 1.5s (boss 0.5s)' },
      superconduct:   { desc: 'Takes +25% damage for 4s' },
      electrocharged: { desc: 'Shocks 3 more enemies for 50% damage' },
    },
    dmgType: {
      physical: { name: 'physical' }, poison: { name: 'poison' }, fire: { name: 'fire' },
      ice: { name: 'ice' }, water: { name: 'water' }, lightning: { name: 'lightning' },
    },
    tab: { attack: { name: 'Attack' }, economy: { name: 'Economy' }, towers: { name: 'Tower unlocks' } },
  };

  // Names of game data per language (not Thai). Missing entries fall back to English, then Thai.
  const DATA = { en: DATA_EN };
  for (const pack of [packs.LANG_KO, packs.LANG_JA, packs.LANG_FR]) {
    if (!pack) continue;
    LANGUAGES[pack.code] = pack.name;
    STRINGS[pack.code] = pack.strings;
    DATA[pack.code] = pack.data;
  }

  let lang = 'th';

  function setLang(l) {
    if (l in STRINGS) lang = l;
    return lang;
  }

  function getLang() {
    return lang;
  }

  // UI text for the current language, falling back to Thai and then to the key itself.
  function t(key, params = {}) {
    const s = STRINGS[lang][key] ?? STRINGS.th[key] ?? key;
    return s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? params[k] : ''));
  }

  // Game data text: `thai` as given in Thai; otherwise this language's entry, then English
  // (a function entry gets `arg`).
  function loc(kind, id, field, thai, arg) {
    if (lang === 'th') return thai;
    const pick = table => table && table[kind] && table[kind][id] && table[kind][id][field];
    const v = pick(DATA[lang]) ?? pick(DATA_EN);
    if (typeof v === 'function') return v(arg);
    return v ?? thai;
  }

  return { LANGUAGES, STRINGS, DATA, DATA_EN, setLang, getLang, t, loc };
});
