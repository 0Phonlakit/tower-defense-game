// Scenery pixel art (8x8) per map theme shape, colored with the theme's deco color at draw time.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(Object.assign({}, require('./pixel-grid.js')));
  else root.TD = Object.assign(root.TD || {}, factory(root.TD));
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  const build = TD.pixelGrid;

  // Scenery (8x8) by map theme shape, colored with the theme's deco color (a) and a darker shade (b).
  const DECO_ART = {
    bush:    build(8, 8, P => { P.rect(2, 2, 4, 4, 'a'); P.rect(1, 3, 6, 2, 'a'); P.px(3, 3, 'w'); P.rect(2, 5, 4, 1, 'b'); }),
    cactus:  build(8, 8, P => { P.rect(3, 1, 2, 6, 'a'); P.rect(1, 3, 1, 2, 'a'); P.rect(6, 2, 1, 2, 'a'); P.rect(1, 4, 2, 1, 'a'); P.rect(5, 3, 2, 1, 'a'); }),
    flake:   build(8, 8, P => { P.line(1, 4, 6, 4, 'a'); P.line(3, 1, 3, 6, 'a'); P.px(2, 2, 'a'); P.px(4, 2, 'a'); P.px(2, 5, 'a'); P.px(4, 5, 'a'); }),
    ember:   build(8, 8, P => { P.rect(3, 3, 2, 2, 'a'); P.px(3, 2, 'w'); }),
    reed:    build(8, 8, P => { P.line(2, 7, 2, 2, 'a'); P.line(4, 7, 4, 1, 'a'); P.line(6, 7, 6, 3, 'a'); P.px(4, 1, 'b'); }),
    shell:   build(8, 8, P => { P.rect(2, 3, 4, 2, 'a'); P.rect(3, 2, 2, 1, 'a'); P.px(3, 4, 'b'); }),
    star:    build(8, 8, P => { P.px(3, 2, 'a'); P.rect(2, 3, 3, 1, 'a'); P.px(3, 4, 'a'); }),
    leaf:    build(8, 8, P => { P.rect(2, 3, 4, 2, 'a'); P.px(1, 3, 'a'); P.px(6, 4, 'a'); P.line(2, 4, 5, 3, 'b'); }),
    crystal: build(8, 8, P => { P.tri(3.5, 1, 4, 4, 'a'); P.vtri(3.5, 5, 6, 4, 'a'); P.px(3, 2, 'w'); }),
    rubble:  build(8, 8, P => { P.rect(1, 4, 3, 2, 'a'); P.rect(4, 5, 2, 2, 'a'); P.px(2, 4, 'b'); }),
  };

  return { DECO_ART };
});
