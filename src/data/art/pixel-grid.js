// Pixel-art basics shared by all sprites: the default palette letters, and pixelGrid(), which builds a
// sprite grid from rectangles, triangles and lines and then outlines it automatically.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TD = Object.assign(root.TD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // '.' is transparent. Letters are looked up in the sprite's palette, then in these defaults.
  const BASE_PALETTE = { o: '#1b1b1f', w: '#ffffff', e: '#ffe14d', g: '#f5c542', m: '#c9ced6', f: '#ff6b35' };

  // Sprites are composed from rectangles, triangles and lines on a pixel grid; outline() then adds the
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

  return { BASE_PALETTE, pixelGrid: build, outline };
});
