// Tower pixel art: a drawing per tower art for levels 1-4, and which art/colors each tower type uses.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Towers (16x16), drawn per level 1-4: each level keeps the shape and adds parts (trim, banners,
  // turrets, bigger crystals, crowns) so an upgraded tower looks stronger.
  // a/b stone or wood, c the tower's color piece, d dark detail, w highlight, g gold, m steel, f fire.
  const TOWER_ART = {
    archer: { pal: { a: '#9aa0a8', b: '#6f757e', c: '#a8331f', d: '#2b2b2b' }, draw(P, lv) {
      if (lv >= 3) { P.rect(1, 7, 3, 6, 'a'); P.rect(12, 7, 3, 6, 'a'); P.px(1, 6, 'a'); P.px(3, 6, 'a'); P.px(12, 6, 'a'); P.px(14, 6, 'a'); }
      P.tri(7.5, 1, 5, 10, 'c');
      P.rect(4, 6, 8, 7, 'a');
      P.rect(4, 6, 8, 1, 'b');
      P.rect(7, 8, 2, 3, 'd');
      P.rect(3, 13, 10, 2, 'b');
      if (lv >= 2) { P.px(5, 9, 'd'); P.px(10, 9, 'd'); P.rect(7, 1, 2, 1, 'g'); }
      if (lv >= 3) { P.rect(4, 12, 8, 1, 'g'); P.px(2, 9, 'd'); P.px(13, 9, 'd'); }
      if (lv >= 4) { P.rect(2, 9, 1, 3, 'c'); P.rect(13, 9, 1, 3, 'c'); P.px(6, 0, 'g'); P.px(9, 0, 'g'); P.rect(7, 0, 2, 1, 'w'); P.rect(3, 14, 10, 1, 'g'); }
    } },
    catapult: { pal: { a: '#9aa0a8', b: '#8a8478', c: '#8b5a2b', d: '#3a2a1a' }, draw(P, lv) {
      P.rect(10, 1, 4, 3, lv >= 4 ? 'f' : 'b');
      if (lv >= 4) P.px(11, 1, 'e');
      P.line(11, 4, 5, 10, 'c');
      P.rect(7, 8, 2, 3, 'c');
      P.rect(2, 11, 12, 2, 'c');
      P.rect(2, 13, 3, 2, 'd');
      P.rect(11, 13, 3, 2, 'd');
      if (lv >= 2) { P.px(9, 6, 'm'); P.px(7, 8, 'm'); P.px(3, 13, 'm'); P.px(12, 13, 'm'); }
      if (lv >= 3) { P.rect(3, 8, 3, 3, 'm'); P.rect(2, 11, 12, 1, 'g'); P.rect(6, 13, 4, 2, 'd'); }
      if (lv >= 4) { P.rect(0, 9, 1, 4, 'c'); P.rect(15, 9, 1, 4, 'c'); P.px(0, 8, 'g'); P.px(15, 8, 'g'); }
    } },
    mage: { draw(P, lv) {
      if (lv >= 2) P.rect(5, 1, 6, 4, 'c'); else P.rect(6, 1, 4, 4, 'c');
      P.px(7, 2, 'w');
      P.rect(6, 6, 4, 2, 'a');
      P.rect(5, 8, 6, 5, 'a');
      P.rect(7, 9, 2, 2, 'd');
      P.rect(4, 13, 8, 2, 'b');
      if (lv >= 2) P.px(6, 2, 'w');
      if (lv >= 3) { P.rect(2, 3, 2, 2, 'c'); P.rect(12, 3, 2, 2, 'c'); P.rect(5, 8, 6, 1, 'g'); P.rect(4, 12, 1, 1, 'g'); P.rect(11, 12, 1, 1, 'g'); }
      if (lv >= 4) { P.px(4, 0, 'w'); P.px(11, 0, 'w'); P.rect(7, 0, 2, 1, 'w'); P.px(1, 7, 'c'); P.px(14, 7, 'c'); P.rect(4, 14, 8, 1, 'g'); }
    } },
    ballista: { pal: { a: '#9aa0a8', b: '#6f757e', c: '#8b5a2b', w: '#e8e8e8' }, draw(P, lv) {
      P.line(2, 3, 7, 6, 'c');
      P.line(13, 3, 8, 6, 'c');
      P.rect(1, 6, 14, 1, 'w');
      P.rect(7, 7, 2, 4, 'c');
      P.rect(4, 11, 8, 2, 'a');
      P.rect(3, 13, 10, 2, 'b');
      if (lv >= 2) { P.px(2, 3, 'm'); P.px(13, 3, 'm'); P.px(15, 6, 'm'); }
      if (lv >= 3) { P.rect(4, 11, 8, 1, 'm'); P.rect(3, 14, 10, 1, 'g'); P.rect(1, 4, 1, 1, 'w'); P.rect(14, 4, 1, 1, 'w'); }
      if (lv >= 4) { P.rect(1, 9, 2, 4, 'm'); P.rect(13, 9, 2, 4, 'm'); P.px(1, 8, 'g'); P.px(14, 8, 'g'); P.rect(6, 1, 4, 1, 'g'); P.px(7, 0, 'g'); P.px(8, 0, 'g'); }
    } },
    crystal: { pal: { a: '#9aa0a8', b: '#6f757e', c: '#e8f55b', w: '#fffde0' }, draw(P, lv) {
      const top = lv >= 3 ? 0 : 1;
      P.tri(7.5, top, 6, lv >= 3 ? 8 : 6, 'c');
      P.vtri(7.5, 7, 10, lv >= 3 ? 8 : 6, 'c');
      P.px(7, 3, 'w');
      P.px(6, 5, 'w');
      P.rect(5, 11, 6, 2, 'a');
      P.rect(4, 13, 8, 2, 'b');
      if (lv >= 2) { P.tri(2.5, 7, 10, 2, 'c'); P.tri(12.5, 7, 10, 2, 'c'); }
      if (lv >= 3) { P.rect(5, 11, 6, 1, 'g'); P.px(1, 2, 'w'); P.px(14, 4, 'w'); }
      if (lv >= 4) { P.px(0, 5, 'w'); P.px(15, 1, 'w'); P.px(2, 0, 'w'); P.px(13, 8, 'w'); P.rect(4, 14, 8, 1, 'g'); P.px(3, 6, 'g'); P.px(12, 6, 'g'); }
    } },
    shrine: { pal: { a: '#cfd6dc', b: '#1f8a7e', c: '#3fa7ff', w: '#dff3ff' }, draw(P, lv) {
      if (lv >= 2) P.tri(7.5, 0, 2, 10, 'b');
      P.rect(3, 3, 10, 2, 'b');
      P.rect(4, 5, 2, 7, 'a');
      P.rect(10, 5, 2, 7, 'a');
      if (lv >= 4) P.rect(6, 6, 4, 5, 'c'); else P.rect(6, 8, 4, 3, 'c');
      P.px(7, 8, 'w');
      P.rect(3, 12, 10, 3, 'a');
      if (lv >= 3) { P.rect(3, 5, 10, 1, 'g'); P.rect(5, 6, 1, 6, 'c'); P.rect(10, 6, 1, 6, 'c'); }
      if (lv >= 4) { P.px(7, 6, 'w'); P.px(1, 9, 'c'); P.px(14, 9, 'c'); P.px(1, 11, 'c'); P.px(14, 11, 'c'); P.rect(3, 14, 10, 1, 'g'); P.px(7, 0, 'g'); P.px(8, 0, 'g'); }
    } },
    alchemist: { pal: { a: '#8b6a4a', b: '#5a2d6e', c: '#7bc043', d: '#3a2a1a', w: '#e8e8e8' }, draw(P, lv) {
      if (lv >= 2) { P.rect(11, 2, 2, 4, 'd'); P.px(11, 0, 'w'); P.px(12, 1, 'w'); }
      P.tri(7.5, 2, 7, 12, 'b');
      P.rect(4, 8, 8, 5, 'a');
      P.rect(7, 8, 2, 1, 'w');
      P.rect(6, 9, 4, 3, 'c');
      P.rect(3, 13, 10, 2, 'd');
      if (lv >= 3) { P.rect(4, 8, 1, 5, 'g'); P.rect(11, 8, 1, 5, 'g'); P.px(2, 12, 'c'); P.px(13, 12, 'e'); P.px(2, 11, 'w'); P.px(13, 11, 'w'); }
      if (lv >= 4) { P.px(7, 1, 'g'); P.px(8, 1, 'g'); P.px(7, 9, 'e'); P.px(8, 10, 'e'); P.rect(3, 14, 10, 1, 'g'); P.px(0, 10, 'c'); P.px(15, 10, 'c'); }
    } },
  };

  // Which tower art each tower type uses, with palette overrides (frost and fire share the mage).
  const TOWER_LOOKS = {
    gun:    { art: 'archer' },
    cannon: { art: 'catapult' },
    frost:  { art: 'mage', pal: { a: '#cfd6dc', b: '#7d8d9b', c: '#5bc8e8', d: '#2a5d8a', w: '#ffffff' } },
    sniper: { art: 'ballista' },
    flame:  { art: 'mage', pal: { a: '#6f4a3a', b: '#3d2a22', c: '#ff6b35', d: '#ffcf4a', w: '#fff3b0' } },
    tesla:  { art: 'crystal' },
    tide:   { art: 'shrine' },
    poison: { art: 'alchemist' },
  };

  return { TOWER_ART, TOWER_LOOKS };
});
