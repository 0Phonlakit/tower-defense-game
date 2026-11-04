// Renderer: shots in flight (one look per tower), hit effects, lightning, rings and floating text.
(function (root) {
  'use strict';
  const TD = root.TD;
  const Renderer = TD.Renderer;

  Object.assign(Renderer.prototype, {
    // Each tower's shot has its own look, pointed the way it flies.
    drawProjectile(p) {
      const { ctx } = this;
      const a = Math.atan2(p.ty - p.y, p.tx - p.x);
      const t = performance.now() / 1000;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.scale(1.4, 1.4);
      if (p.kind === 'gun') {                       // arrow: wooden shaft, steel head, white fletching
        ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-9, -1, 12, 2);
        ctx.fillStyle = '#c9ced6'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(2, -3); ctx.lineTo(2, 3); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-11, -3, 3, 2); ctx.fillRect(-11, 1, 3, 2);
      } else if (p.kind === 'cannon') {             // tumbling boulder
        ctx.rotate(t * 10);
        ctx.fillStyle = '#8a8478'; ctx.fillRect(-5, -5, 10, 10);
        ctx.fillStyle = '#6f6a60'; ctx.fillRect(-5, 1, 10, 4);
        ctx.fillStyle = '#b0aa9c'; ctx.fillRect(-3, -3, 3, 3);
        ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 1.5; ctx.strokeRect(-5, -5, 10, 10);
      } else if (p.kind === 'frost') {              // ice shard with a sparkle trail
        for (let i = 1; i <= 3; i++) { ctx.fillStyle = `rgba(200, 240, 255, ${0.5 - i * 0.12})`; ctx.fillRect(-4 - i * 5, -1, 2, 2); }
        ctx.fillStyle = '#8be3ff'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(0, -4); ctx.lineTo(-6, 0); ctx.lineTo(0, 4); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-1, -1, 4, 2);
      } else if (p.kind === 'flame') {              // fireball with fading embers behind it
        for (let i = 3; i >= 1; i--) { ctx.fillStyle = `rgba(255, ${120 + i * 20}, 40, ${0.6 - i * 0.15})`; this.circle(-i * 5, Math.sin(t * 30 + i) * 1.5, 5 - i); ctx.fill(); }
        ctx.fillStyle = '#ff6b35'; this.circle(0, 0, 5); ctx.fill();
        ctx.fillStyle = '#ffd84a'; this.circle(1, 0, 2.5); ctx.fill();
      } else if (p.kind === 'tide') {               // water orb with droplets
        ctx.fillStyle = 'rgba(63, 167, 255, 0.45)'; this.circle(-7, 2, 2); ctx.fill(); this.circle(-11, -2, 1.5); ctx.fill();
        ctx.fillStyle = '#3fa7ff'; this.circle(0, 0, 5); ctx.fill();
        ctx.fillStyle = '#dff3ff'; this.circle(-1.5, -1.5, 1.8); ctx.fill();
      } else if (p.kind === 'poison') {             // spinning flask with a green trail
        ctx.fillStyle = 'rgba(123, 192, 67, 0.4)'; this.circle(-8, 0, 3); ctx.fill();
        ctx.rotate(t * 12);
        ctx.fillStyle = '#e8e8e8'; ctx.fillRect(-1, -6, 2, 3);
        ctx.fillStyle = '#7bc043'; this.circle(0, 1, 4); ctx.fill();
        ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 1; this.circle(0, 1, 4); ctx.stroke();
      } else {
        ctx.fillStyle = p.color; this.circle(0, 0, p.splash ? 5 : 3.5); ctx.fill();
      }
      ctx.restore();
    },

    // Hit effects per tower: sparks, dust and debris, frost shards, fire burst, splash, poison cloud.
    drawImpact(fx, k) {
      const { ctx } = this;
      const grow = 1 - k;
      const seed = Math.floor(fx.x * 7 + fx.y * 13);
      const dir = i => (i * 2.399 + seed) % (Math.PI * 2);
      const r = fx.r || 12;
      const bits = (n, dist, size, color) => {
        ctx.fillStyle = color;
        for (let i = 0; i < n; i++) {
          const d = dist * grow;
          ctx.fillRect(fx.x + Math.cos(dir(i)) * d - size / 2, fx.y + Math.sin(dir(i)) * d - size / 2, size, size);
        }
      };
      if (fx.style === 'gun') bits(4, 8, 2, '#ffe9a8');
      else if (fx.style === 'sniper') { bits(6, 12, 2, '#ffffff'); ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 2; this.circle(fx.x, fx.y, 4 + 8 * grow); ctx.stroke(); }
      else if (fx.style === 'cannon') { ctx.fillStyle = 'rgba(160, 140, 110, 0.5)'; this.circle(fx.x, fx.y, r * (0.4 + 0.6 * grow)); ctx.fill(); bits(8, r * 0.9, 4, '#6f6a60'); }
      else if (fx.style === 'frost') { bits(8, r, 3, '#dff7ff'); ctx.strokeStyle = '#8be3ff'; ctx.lineWidth = 2; this.circle(fx.x, fx.y, r * grow); ctx.stroke(); }
      else if (fx.style === 'flame') { ctx.fillStyle = 'rgba(255, 107, 53, 0.55)'; this.circle(fx.x, fx.y, 6 + 8 * grow); ctx.fill(); bits(6, 14, 3, '#ffd84a'); }
      else if (fx.style === 'tide') { bits(10, r, 3, '#8fd0ff'); ctx.strokeStyle = '#3fa7ff'; ctx.lineWidth = 2; this.circle(fx.x, fx.y, r * grow); ctx.stroke(); }
      else if (fx.style === 'poison') { ctx.fillStyle = 'rgba(123, 192, 67, 0.45)'; for (let i = 0; i < 4; i++) { this.circle(fx.x + Math.cos(dir(i)) * 6 * grow, fx.y + Math.sin(dir(i)) * 6 * grow - 4 * grow, 4 + 3 * grow); ctx.fill(); } }
      else if (fx.style === 'tesla') { ctx.fillStyle = 'rgba(232, 245, 91, 0.6)'; this.circle(fx.x, fx.y, 3 + 9 * grow); ctx.fill(); }
    },

    // Lightning: a jagged line that changes shape every frame.
    drawBolt(x1, y1, x2, y2, color) {
      const { ctx } = this;
      const steps = 6, nx = -(y2 - y1), ny = x2 - x1, len = Math.hypot(nx, ny) || 1;
      ctx.beginPath(); ctx.moveTo(x1, y1);
      for (let i = 1; i < steps; i++) {
        const j = (Math.random() - 0.5) * 10;
        ctx.lineTo(x1 + (x2 - x1) * i / steps + nx / len * j, y1 + (y2 - y1) * i / steps + ny / len * j);
      }
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
    },

    drawEffect(fx) {
      const { ctx } = this;
      const k = Math.max(0, fx.life / fx.max);
      ctx.globalAlpha = k;
      if (fx.kind === 'ring') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 3;
        this.circle(fx.x, fx.y, fx.r1 + (fx.r0 - fx.r1) * k); ctx.stroke();
      } else if (fx.kind === 'tracer' && fx.style === 'tesla') {
        this.drawBolt(fx.x, fx.y, fx.x2, fx.y2, fx.color);
      } else if (fx.kind === 'tracer' && fx.style === 'sniper') {   // ballista bolt streak
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
        ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2; ctx.stroke();
      } else if (fx.kind === 'tracer') {
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
      } else if (fx.kind === 'impact') {
        this.drawImpact(fx, k);
      } else if (fx.kind === 'text') {
        ctx.fillStyle = fx.color;
        ctx.font = 'bold 13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(fx.text, fx.x, fx.y);
      }
      ctx.globalAlpha = 1;
    },
  });
})(self);
