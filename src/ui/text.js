// Text helpers for the UI: t(key, params) for UI strings and L.* for game-data names, both in the
// current language (see src/core/i18n.js).
(function (root) {
  'use strict';
  const TD = root.TD;

  const t = (key, params) => TD.t(key, params);

  // Names and descriptions of game data in the current language (Thai comes from the data itself).
  const L = {
    tower: (type, field = 'name') => TD.loc('tower', type, field, TD.TOWER_DEFS[type][field]),
    enemy: type => TD.loc('enemy', type, 'name', TD.ENEMY_DEFS[type].name),
    map: m => TD.loc('map', m.id, 'name', m.name),
    upgrade: (key, field) => TD.loc('upgrade', key, field, TD.META_UPGRADES[key][field]),
    perk: (p, field, game) => field === 'desc'
      ? TD.loc('perk', p.id, 'desc', p.desc(game), TD.cashAmount(game))
      : TD.loc('perk', p.id, 'name', p.name),
    element: k => TD.loc('element', k, 'name', TD.ELEMENTS[k].name),
    reaction: r => TD.loc('reaction', r.id, 'desc', r.desc),
    dmgType: k => TD.loc('dmgType', k, 'name', TD.DAMAGE_TYPES[k]),
    tab: id => TD.loc('tab', id, 'name', TD.UPGRADE_TABS[id]),
  };

  TD.UIText = { t, L };
})(self);
