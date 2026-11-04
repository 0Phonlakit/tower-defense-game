// Turns pixel-art data (src/data/art/) into canvases: each sprite is drawn once into a small canvas
// and then drawn scaled up with sharp pixels.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const art = Object.assign({}, require('../data/art/pixel-grid.js'), require('../data/art/enemies.js'), require('../data/art/towers.js'), require('../data/art/bases.js'), require('../data/art/scenery.js'));
    module.exports = Object.assign(art, factory(art));
  } else {
    root.TD = Object.assign(root.TD || {}, factory(root.TD));
  }
})(typeof self !== 'undefined' ? self : this, function (TD) {
  'use strict';

  // Built grids per tower art and level, made on first use.
  const towerGrids = new Map();
  function towerGrid(art, lv) {
    const k = `${art}:${lv}`;
    if (!towerGrids.has(k)) towerGrids.set(k, TD.pixelGrid(16, 16, P => TD.TOWER_ART[art].draw(P, lv)));
    return towerGrids.get(k);
  }

  // ---------- Rendering ----------
  function shade(hex, t) {
    const c = i => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return '#' + [0, 1, 2].map(i => Math.round(c(i) * (1 - t)).toString(16).padStart(2, '0')).join('');
  }

  // Every sprite as { grid, pal } by key: enemy:<type>, tower:<type>[:<level 1-4>], base:<mapId>, deco:<shape>.
  function sprite(key) {
    const [kind, id] = key.split(':');
    if (kind === 'enemy') { const L = TD.ENEMY_LOOKS[id]; return L && { grid: TD.BODIES[L.body], pal: L }; }
    if (kind === 'tower') {
      const L = TD.TOWER_LOOKS[id];
      const lv = Math.min(4, Math.max(1, Number(key.split(':')[2]) || 1));
      return L && { grid: towerGrid(L.art, lv), pal: Object.assign({}, TD.TOWER_ART[L.art].pal, L.pal) };
    }
    if (kind === 'base') { const L = TD.BASE_LOOKS[id]; return L && { grid: TD.BASE_ART[L.art], pal: L.pal }; }
    if (kind === 'deco') return TD.DECO_ART[id] && { grid: TD.DECO_ART[id], pal: {} };
    return null;
  }

  // Draws a sprite grid into a canvas once (1 px per cell) and keeps it; `extra` adds palette colors.
  const cache = new Map();
  function canvasFor(key, extra = {}) {
    const k = key + JSON.stringify(extra);
    if (cache.has(k)) return cache.get(k);
    const s = sprite(key);
    if (!s || typeof document === 'undefined') return null;
    const pal = Object.assign({}, TD.BASE_PALETTE, s.pal, extra);
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

  return { sprite, drawSprite, shade };
});
