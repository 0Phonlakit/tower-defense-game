// Pixel-art sprites drawn in code: text grids (one letter per pixel) plus a palette per sprite.
// Each sprite is rendered once into a small canvas and then drawn scaled up with sharp pixels.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // '.' is transparent. Letters are looked up in the sprite's palette, then in these defaults.
  const BASE_PALETTE = { o: '#1b1b1f', w: '#ffffff', e: '#ffe14d' };

  // ---------- Enemy body shapes (12x12, facing right) ----------
  const BODIES = {
    goblin: [
      '............',
      '....oooo....',
      'o..oaaaao..o',
      'oaoaaaeaeoao',
      '.ooaaaaaaoo.',
      '...oaaaao...',
      '..obbbbbbo..',
      '.oabbbbbbao.',
      '.o.obbbbo.o.',
      '...obbbbo...',
      '...oa..ao...',
      '...oo..oo...',
    ],
    knight: [
      '....oooo....',
      '...obbbbo...',
      '...obeebo...',
      '...obbbbo...',
      '..oobbbboo..',
      '.occbbbbbao.',
      '.occbbbbbao.',
      '.occbbbbbo..',
      '..oobbbbo...',
      '...obbbbo...',
      '...oa..ao...',
      '...oo..oo...',
    ],
    beast: [
      '............',
      '........oo..',
      '.......oaao.',
      'o.....oaaeao',
      'ao...oaaaaoo',
      '.aooooaaaao.',
      '.oaaaaaaaao.',
      '.oabbbbbbao.',
      '..oaaaaaao..',
      '..oao..oao..',
      '..oao..oao..',
      '..oo....oo..',
    ],
    dragon: [
      '..o......o..',
      '.oao....oao.',
      'oaaao..oaaao',
      'oaaaaooaaaao',
      '.oaaaaaaaao.',
      '..oaaaaeao..',
      '..oabbbbaoo.',
      '.oaabbbbaaco',
      'oaoabbbbao..',
      'o..oaaaao...',
      '...oao.oao..',
      '...oo...oo..',
    ],
    bird: [
      '............',
      'o..........o',
      'oao......oao',
      '.oaao..oaao.',
      '..oaaooaao..',
      '...oabbao...',
      '...obbbbo...',
      '...obeebo...',
      '....occo....',
      '....obbo....',
      '.....oo.....',
      '............',
    ],
    insect: [
      '............',
      '..ww....ww..',
      '.wwww..wwww.',
      '.wwwwoowwww.',
      '..wwoaaoww..',
      '....oeaeo...',
      '...obabao...',
      '...oabaao...',
      '...obabao...',
      '....oaao....',
      '.....oo.....',
      '............',
    ],
    bat: [
      '............',
      '............',
      'o...o..o...o',
      'oo.oaooao.oo',
      'oaoaaaaaaoao',
      'oaaaaeaeaaao',
      'oaaaaaaaaaao',
      '.oaaoaaoaao.',
      '..oo.oao.oo.',
      '.....o.o....',
      '............',
      '............',
    ],
    golem: [
      '...oooooo...',
      '..oaaaaaao..',
      '..oaeaaeao..',
      '..oaaaaaao..',
      'oooobbbboooo',
      'oaaobbbboaao',
      'oaaobbbboaao',
      'oaaobbbboaao',
      'oooobbbboooo',
      '...oaooaao..',
      '...oaooaao..',
      '..ooo..ooo..',
    ],
    spirit: [
      '....oooo....',
      '...oaaaao...',
      '..oaaaaaao..',
      '..oaeaaeao..',
      '.oaaaaaaaao.',
      '.oaabbbbaao.',
      '.oabbbbbbao.',
      '.oabbbbbbao.',
      '.oaabbbbaao.',
      '.oaoaoaoaao.',
      '.o.o.o.o.o..',
      '............',
    ],
    crab: [
      '............',
      '.oo......oo.',
      'occo....occo',
      '.oco....oco.',
      '..oooooooo..',
      '.oaaaaaaaao.',
      'oabaabbaabao',
      'oaaeaaaaeaao',
      '.oaaaaaaaao.',
      'o.oo.oo.oo.o',
      'o..........o',
      '............',
    ],
    serpent: [
      '............',
      '............',
      '........ooo.',
      '.......oaaao',
      '..oooo.oaeao',
      '.oaaaaooaaao',
      'oaabbaaaaaao',
      'oabooobbaao.',
      '.oo...oooo..',
      '............',
      '............',
      '............',
    ],
    plant: [
      '...oooooo...',
      '..occccccoo.',
      '.occccccccco',
      '.occccccccco',
      '..oocaacoo..',
      '....oeaeo...',
      '.oo.oaaao.oo',
      '..ooaaaaoo..',
      '....oaaao...',
      '....oaaao...',
      '...oaoaoao..',
      '...oo.o.oo..',
    ],
  };

  // Enemy type -> body shape and colors (a main, b second, c accent, e eyes).
  const ENEMY_LOOKS = {
    normal:       { body: 'goblin',  a: '#6fae4a', b: '#7a5232' },
    fast:         { body: 'beast',   a: '#8d8f96', b: '#c9cbd0' },
    tank:         { body: 'knight',  a: '#6fae4a', b: '#8f99a6', c: '#7a5232', e: '#ff5d5d' },
    boss:         { body: 'dragon',  a: '#9b51e0', b: '#e0c06a', c: '#ff7a1a', e: '#ffe14d' },
    bee:          { body: 'insect',  a: '#f2b705', b: '#2a2a2a', w: '#dff3ff' },
    beetle:       { body: 'crab',    a: '#3f5a2c', b: '#6f8f45', c: '#2c3d1f' },
    firehawk:     { body: 'bird',    a: '#ff7a1a', b: '#ffcf4a', c: '#ffe14d' },
    sandworm:     { body: 'serpent', a: '#b0894f', b: '#d9bf86' },
    snowowl:      { body: 'bird',    a: '#f4f8fb', b: '#c9d6e3', c: '#e8a33a', e: '#2b2b2b' },
    frostgiant:   { body: 'golem',   a: '#7fb8e0', b: '#cfe8ff', e: '#2a5d8a' },
    lavaspirit:   { body: 'spirit',  a: '#ff4500', b: '#ffcf4a', e: '#fff3b0' },
    magmagolem:   { body: 'golem',   a: '#5a2a1a', b: '#ff7a1a', e: '#ffcf4a' },
    mosquito:     { body: 'insect',  a: '#9aa35a', b: '#5d6b3a', w: '#e8f0d0' },
    bogcroc:      { body: 'beast',   a: '#4b6b3c', b: '#9fb57a' },
    stormgull:    { body: 'bird',    a: '#c9d6e3', b: '#ffffff', c: '#e8a33a', e: '#2b2b2b' },
    crab:         { body: 'crab',    a: '#d1503a', b: '#ef8a6a', c: '#a8331f' },
    bat:          { body: 'bat',     a: '#5a2d6e', e: '#ff5d5d' },
    hauntedarmor: { body: 'knight',  a: '#6d7a99', b: '#9aa6c2', c: '#3d4660', e: '#7df9ff' },
    crow:         { body: 'bird',    a: '#2a2a2a', b: '#4a4a52', c: '#e8a33a', e: '#ff5d5d' },
    treant:       { body: 'plant',   a: '#7a5a2e', c: '#4f8a3a', e: '#ffe14d' },
    crystalgolem: { body: 'golem',   a: '#9f7aea', b: '#d4b8ff', e: '#ffffff' },
    crystalmoth:  { body: 'insect',  a: '#d4b8ff', b: '#9f7aea', w: '#f1e6ff' },
    gargoyle:     { body: 'bat',     a: '#8a8478', e: '#ff5d5d' },
    mummy:        { body: 'goblin',  a: '#d8ccaa', b: '#b8ab86', e: '#7df9ff' },
    ant:          { body: 'crab',    a: '#8a5a2b', b: '#a8743d', c: '#5a3a1a' },
    firelizard:   { body: 'serpent', a: '#e0602a', b: '#ffcf4a' },
    snowhare:     { body: 'beast',   a: '#e8eef3', b: '#ffffff', e: '#2b2b2b' },
    leech:        { body: 'serpent', a: '#5d6b3a', b: '#9aa35a' },
    stormturtle:  { body: 'crab',    a: '#7f96ad', b: '#a9bccd', c: '#4f6378' },
    ghoulrat:     { body: 'beast',   a: '#4a3b55', b: '#7a6a85', e: '#ff5d5d' },
    scarecrow:    { body: 'plant',   a: '#b8893f', c: '#7a5232', e: '#2b2b2b' },
    crystalgrub:  { body: 'serpent', a: '#c3a6f2', b: '#f1e6ff' },
    statue:       { body: 'golem',   a: '#9a958a', b: '#c4bfb2', e: '#7df9ff' },
  };

  // ---------- Built sprites: towers, bases, scenery ----------
  // These are composed from rectangles, triangles and lines on a pixel grid; outline() then adds the
  // dark 'o' border around every shape, so no grid has to be counted by hand.
  function build(w, h, draw) {
    const g = Array.from({ length: h }, () => Array(w).fill('.'));
    const set = (x, y, ch) => { if (x >= 0 && x < w && y >= 0 && y < h) g[y][x] = ch; };
    const P = {
      rect(x, y, rw, rh, ch) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) set(x + i, y + j, ch); },
      px(x, y, ch) { set(x, y, ch); },
      // Triangle pointing up: apex row `top`, widest (width `base`) at row `bottom`, centred on cx (may be .5).
      tri(cx, top, bottom, base, ch) {
        for (let y = top; y <= bottom; y++) {
          const half = ((y - top + 1) / (bottom - top + 1)) * base / 2;
          for (let x = Math.ceil(cx - half); x <= Math.floor(cx + half - 0.01); x++) set(x, y, ch);
        }
      },
      // Triangle pointing down (for the lower half of a diamond).
      vtri(cx, top, bottom, base, ch) {
        for (let y = top; y <= bottom; y++) {
          const half = ((bottom - y + 1) / (bottom - top + 1)) * base / 2;
          for (let x = Math.ceil(cx - half); x <= Math.floor(cx + half - 0.01); x++) set(x, y, ch);
        }
      },
      line(x0, y0, x1, y1, ch) {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let k = 0; k <= n; k++) set(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), ch);
      },
    };
    draw(P);
    outline(g);
    return g.map(r => r.join(''));
  }

  function outline(g) {
    const h = g.length, w = g[0].length;
    const filled = (x, y) => x >= 0 && x < w && y >= 0 && y < h && g[y][x] !== '.' && g[y][x] !== 'o';
    const marks = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (g[y][x] === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) marks.push([x, y]);
      }
    }
    for (const [x, y] of marks) g[y][x] = 'o';
  }

  // Towers (16x16): a/b stone or wood, c the tower's color piece, d dark detail, w highlight.
  const TOWER_ART = {
    archer: { pal: { a: '#9aa0a8', b: '#6f757e', c: '#a8331f', d: '#2b2b2b' }, grid: build(16, 16, P => {
      P.tri(7.5, 1, 5, 10, 'c');
      P.rect(4, 6, 8, 7, 'a');
      P.rect(4, 6, 8, 1, 'b');
      P.rect(7, 8, 2, 3, 'd');
      P.rect(3, 13, 10, 2, 'b');
    }) },
    catapult: { pal: { a: '#9aa0a8', b: '#8a8478', c: '#8b5a2b', d: '#3a2a1a' }, grid: build(16, 16, P => {
      P.rect(10, 1, 4, 3, 'b');
      P.line(11, 4, 5, 10, 'c');
      P.rect(7, 8, 2, 3, 'c');
      P.rect(2, 11, 12, 2, 'c');
      P.rect(2, 13, 3, 2, 'd');
      P.rect(11, 13, 3, 2, 'd');
    }) },
    mage: { grid: build(16, 16, P => {
      P.rect(6, 1, 4, 4, 'c');
      P.px(7, 2, 'w');
      P.rect(6, 6, 4, 2, 'a');
      P.rect(5, 8, 6, 5, 'a');
      P.rect(7, 9, 2, 2, 'd');
      P.rect(4, 13, 8, 2, 'b');
    }) },
    ballista: { pal: { a: '#9aa0a8', b: '#6f757e', c: '#8b5a2b', w: '#e8e8e8' }, grid: build(16, 16, P => {
      P.line(2, 3, 7, 6, 'c');
      P.line(13, 3, 8, 6, 'c');
      P.rect(1, 6, 14, 1, 'w');
      P.rect(7, 7, 2, 4, 'c');
      P.rect(4, 11, 8, 2, 'a');
      P.rect(3, 13, 10, 2, 'b');
    }) },
    crystal: { pal: { a: '#9aa0a8', b: '#6f757e', c: '#e8f55b', w: '#fffde0' }, grid: build(16, 16, P => {
      P.tri(7.5, 1, 6, 6, 'c');
      P.vtri(7.5, 7, 10, 6, 'c');
      P.px(7, 3, 'w');
      P.px(6, 5, 'w');
      P.rect(5, 11, 6, 2, 'a');
      P.rect(4, 13, 8, 2, 'b');
    }) },
    shrine: { pal: { a: '#cfd6dc', b: '#1f8a7e', c: '#3fa7ff', w: '#dff3ff' }, grid: build(16, 16, P => {
      P.rect(3, 3, 10, 2, 'b');
      P.rect(4, 5, 2, 7, 'a');
      P.rect(10, 5, 2, 7, 'a');
      P.rect(6, 8, 4, 3, 'c');
      P.px(7, 8, 'w');
      P.rect(3, 12, 10, 3, 'a');
    }) },
    alchemist: { pal: { a: '#8b6a4a', b: '#5a2d6e', c: '#7bc043', d: '#3a2a1a', w: '#e8e8e8' }, grid: build(16, 16, P => {
      P.tri(7.5, 2, 7, 12, 'b');
      P.rect(4, 8, 8, 5, 'a');
      P.rect(7, 8, 2, 1, 'w');
      P.rect(6, 9, 4, 3, 'c');
      P.rect(3, 13, 10, 2, 'd');
    }) },
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

  // Bases (16x16), one per map: a walls, b trim/steps, c roof/flag/light, d door.
  const BASE_ART = {
    castle: build(16, 16, P => {
      P.rect(1, 4, 4, 10, 'a');
      P.rect(11, 4, 4, 10, 'a');
      for (const x of [1, 3, 11, 13]) P.px(x, 3, 'a');
      P.rect(2, 7, 12, 7, 'a');
      P.rect(6, 10, 4, 4, 'd');
      P.line(8, 1, 8, 6, 'w');
      P.rect(9, 1, 3, 2, 'c');
      P.rect(1, 13, 14, 1, 'b');
    }),
    palace: build(16, 16, P => {
      P.tri(2.5, 0, 4, 4, 'c');
      P.tri(12.5, 0, 4, 4, 'c');
      P.tri(7.5, 2, 6, 4, 'c');
      P.rect(1, 5, 4, 9, 'a');
      P.rect(11, 5, 4, 9, 'a');
      P.rect(5, 7, 6, 7, 'a');
      P.rect(6, 10, 4, 4, 'd');
      P.rect(1, 13, 14, 1, 'b');
    }),
    hut: build(16, 16, P => {
      P.tri(7.5, 1, 7, 13, 'b');
      P.rect(4, 8, 8, 5, 'a');
      P.rect(7, 10, 2, 3, 'd');
      P.px(5, 9, 'c');
      P.rect(4, 13, 1, 2, 'a');
      P.rect(11, 13, 1, 2, 'a');
    }),
    treehouse: build(16, 16, P => {
      P.rect(2, 1, 12, 5, 'c');
      P.rect(4, 5, 8, 4, 'b');
      P.rect(7, 6, 2, 3, 'd');
      P.rect(7, 9, 2, 6, 'a');
    }),
    spire: build(16, 16, P => {
      P.rect(7, 0, 2, 1, 'b');
      P.rect(6, 1, 4, 3, 'c');
      P.rect(6, 4, 4, 9, 'a');
      P.rect(6, 7, 4, 1, 'b');
      P.rect(6, 10, 4, 1, 'b');
      P.rect(7, 11, 2, 2, 'd');
      P.rect(4, 13, 8, 2, 'b');
    }),
    citadel: build(16, 16, P => {
      P.tri(3.5, 4, 10, 4, 'c');
      P.tri(7.5, 0, 10, 6, 'c');
      P.tri(11.5, 3, 10, 4, 'c');
      P.px(7, 3, 'w');
      P.rect(2, 11, 12, 2, 'a');
      P.rect(1, 13, 14, 2, 'b');
    }),
    temple: build(16, 16, P => {
      P.tri(7.5, 1, 4, 14, 'c');
      P.rect(1, 5, 14, 1, 'b');
      for (const x of [2, 5, 10, 13]) P.rect(x, 6, 1, 5, 'a');
      P.rect(7, 8, 2, 3, 'd');
      P.rect(2, 11, 12, 1, 'b');
      P.rect(1, 12, 14, 2, 'b');
    }),
  };

  // Map id -> base art and colors.
  const BASE_LOOKS = {
    meadow:  { art: 'castle',    pal: { a: '#9aa0a8', b: '#6f757e', c: '#2b6cd9', d: '#4a3423' } },
    desert:  { art: 'castle',    pal: { a: '#d9bf86', b: '#a8874f', c: '#c0392b', d: '#5a3a1a' } },
    snow:    { art: 'palace',    pal: { a: '#cfe8ff', b: '#8fb5d6', c: '#7fb8e0', d: '#2a5d8a' } },
    lava:    { art: 'castle',    pal: { a: '#3a2a2a', b: '#1f1515', c: '#ff5a1f', d: '#ff8a3a' } },
    swamp:   { art: 'hut',       pal: { a: '#6b5a3a', b: '#3b4a2f', c: '#c6ff6b', d: '#1f2a17' } },
    beach:   { art: 'spire',     pal: { a: '#f4f8fb', b: '#c0392b', c: '#ffe14d', d: '#5a3a1a' } },
    night:   { art: 'spire',     pal: { a: '#3c4566', b: '#56608a', c: '#f5e6a8', d: '#1d2740' } },
    autumn:  { art: 'treehouse', pal: { a: '#6e4a26', b: '#a37a48', c: '#e0662c', d: '#3a2a1a' } },
    crystal: { art: 'citadel',   pal: { a: '#4a3d6a', b: '#30264a', c: '#b58cff', w: '#f1e6ff' } },
    ruins:   { art: 'temple',    pal: { a: '#c4bfb2', b: '#8c8778', c: '#a39e8f', d: '#3f3c34' } },
  };

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

  // ---------- Rendering ----------
  function shade(hex, t) {
    const c = i => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return '#' + [0, 1, 2].map(i => Math.round(c(i) * (1 - t)).toString(16).padStart(2, '0')).join('');
  }

  // Every sprite as { grid, pal } by key: enemy:<type>, tower:<type>, base:<mapId>, deco:<shape>.
  function sprite(key) {
    const [kind, id] = key.split(':');
    if (kind === 'enemy') { const L = ENEMY_LOOKS[id]; return L && { grid: BODIES[L.body], pal: L }; }
    if (kind === 'tower') { const L = TOWER_LOOKS[id]; return L && { grid: TOWER_ART[L.art].grid, pal: Object.assign({}, TOWER_ART[L.art].pal, L.pal) }; }
    if (kind === 'base') { const L = BASE_LOOKS[id]; return L && { grid: BASE_ART[L.art], pal: L.pal }; }
    if (kind === 'deco') return DECO_ART[id] && { grid: DECO_ART[id], pal: {} };
    return null;
  }

  // Draws a sprite grid into a canvas once (1 px per cell) and keeps it; `extra` adds palette colors.
  const cache = new Map();
  function canvasFor(key, extra = {}) {
    const k = key + JSON.stringify(extra);
    if (cache.has(k)) return cache.get(k);
    const s = sprite(key);
    if (!s || typeof document === 'undefined') return null;
    const pal = Object.assign({}, BASE_PALETTE, s.pal, extra);
    const c = document.createElement('canvas');
    c.width = s.grid[0].length;
    c.height = s.grid.length;
    const ctx = c.getContext('2d');
    s.grid.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.' || !pal[ch]) return;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(x, y, 1, 1);
    }));
    cache.set(k, c);
    return c;
  }

  // Draws a sprite centred on (x, y), `size` px wide, mirrored when flip is true. Pixels stay sharp.
  function drawSprite(ctx, key, x, y, size, { flip = false, extra } = {}) {
    const c = canvasFor(key, extra);
    if (!c) return false;
    const h = size * c.height / c.width;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(c, -size / 2, -h / 2, size, h);
    ctx.restore();
    return true;
  }

  return {
    BASE_PALETTE, BODIES, ENEMY_LOOKS, TOWER_ART, TOWER_LOOKS, BASE_ART, BASE_LOOKS, DECO_ART,
    sprite, drawSprite, shade,
  };
});
