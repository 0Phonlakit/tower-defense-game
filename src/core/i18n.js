// Looks up game text in the chosen language. The text itself is in the language packs under
// src/data/lang/ (th, en, ko, ja, fr). UI strings are looked up by key with t(); game data
// (towers, enemies, maps, ...) keeps its Thai names in its own data file and gets the other
// languages' names from each pack's data table with loc().
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(Object.assign({}, require('../data/lang/th.js'), require('../data/lang/en.js'),
      require('../data/lang/ko.js'), require('../data/lang/ja.js'), require('../data/lang/fr.js')));
  } else {
    root.TD = Object.assign(root.TD || {}, factory(root.TD));
  }
})(typeof self !== 'undefined' ? self : this, function (packs) {
  'use strict';

  // Language code -> name shown in Settings, UI strings, and game-data names (not for Thai).
  const LANGUAGES = {};
  const STRINGS = {};
  const DATA = {};
  for (const pack of [packs.LANG_TH, packs.LANG_EN, packs.LANG_KO, packs.LANG_JA, packs.LANG_FR]) {
    if (!pack) continue;
    LANGUAGES[pack.code] = pack.name;
    STRINGS[pack.code] = pack.strings;
    if (pack.data) DATA[pack.code] = pack.data;
  }
  const DATA_EN = DATA.en;

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
