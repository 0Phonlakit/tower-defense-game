'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../src/core/i18n.js');
const { TOWER_DEFS, ENEMY_DEFS, META_UPGRADES, ELEMENTS, REACTIONS, DAMAGE_TYPES, UPGRADE_TABS } = require('../src/core/config.js');
const { MAP_DEFS } = require('../src/core/maps.js');
const { PERKS } = require('../src/core/perks.js');
const { Settings, SETTINGS_KEY } = require('../src/core/settings.js');
const { MemoryStorage, makeGame } = require('./helpers.js');

test.afterEach(() => I.setLang('th'));

test('i18n: Thai and English have exactly the same UI keys and the same placeholders', () => {
  const th = Object.keys(I.STRINGS.th).sort(), en = Object.keys(I.STRINGS.en).sort();
  assert.deepEqual(en, th);
  const holes = s => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const k of th) assert.equal(holes(I.STRINGS.en[k]), holes(I.STRINGS.th[k]), k);
});

test('i18n: English names exist for every tower, enemy, map, upgrade, perk, element, reaction, damage type and tab', () => {
  const need = {
    tower: Object.keys(TOWER_DEFS), enemy: Object.keys(ENEMY_DEFS), map: MAP_DEFS.map(m => m.id),
    upgrade: Object.keys(META_UPGRADES), perk: PERKS.map(p => p.id), element: Object.keys(ELEMENTS),
    reaction: Object.values(REACTIONS).map(r => r.id), dmgType: Object.keys(DAMAGE_TYPES), tab: Object.keys(UPGRADE_TABS),
  };
  for (const [kind, ids] of Object.entries(need)) {
    for (const id of ids) assert.ok(I.DATA_EN[kind] && I.DATA_EN[kind][id], `${kind}.${id}`);
  }
  for (const id of Object.keys(TOWER_DEFS)) assert.ok(I.DATA_EN.tower[id].desc, `tower.${id}.desc`);
  for (const p of PERKS) assert.ok(I.DATA_EN.perk[p.id].desc, `perk.${p.id}.desc`);
});

test('i18n: t() fills placeholders and falls back to Thai, then to the key', () => {
  I.setLang('en');
  assert.equal(I.t('wave.start', { n: 3 }), 'Start wave 3 (Space)');
  assert.equal(I.t('no.such.key'), 'no.such.key');
  I.setLang('th');
  assert.equal(I.t('wave.start', { n: 3 }), 'เริ่ม Wave 3 (Space)');
  assert.equal(I.setLang('fr'), 'th', 'unknown language is ignored');
});

test('i18n: loc() returns the Thai data text in Thai and the English entry in English', () => {
  assert.equal(I.loc('tower', 'gun', 'name', TOWER_DEFS.gun.name), 'หอธนู');
  I.setLang('en');
  assert.equal(I.loc('tower', 'gun', 'name', TOWER_DEFS.gun.name), 'Archer tower');
  assert.equal(I.loc('perk', 'cash', 'desc', 'ไทย', 90), 'Get 90 gold now');
  assert.equal(I.loc('tower', 'nope', 'name', 'fallback'), 'fallback');
});

test('Settings: language defaults to Thai, can be set to English and is saved; unknown languages are rejected', () => {
  const storage = new MemoryStorage();
  const s = new Settings(storage);
  assert.equal(s.language, 'th');
  assert.ok(s.setLanguage('en'));
  assert.equal(s.setLanguage('fr'), false);
  assert.equal(new Settings(storage).language, 'en');
  const bad = new Settings(new MemoryStorage({ [SETTINGS_KEY]: JSON.stringify({ language: 'xx' }) }));
  assert.equal(bad.language, 'th');
});

test('Game floating text follows the language', () => {
  I.setLang('en');
  const game = makeGame();
  game.startWave();
  game.spawnQueue = [];
  game.update(0.02);
  assert.ok(game.effects.some(fx => fx.text === 'Wave 1 cleared! +25 gold'));
});
