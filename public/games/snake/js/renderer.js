/**
 * Snake — canvas renderer.
 *
 * Purely presentational: it reads engine state and never writes to it, so the
 * simulation stays deterministic whether or not anything is on screen.
 * Handles devicePixelRatio, container resizing and sub-tick interpolation.
 */

import * as C from './constants.js';

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mixColor = (a, b, t) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
};

function roundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.cell = 24;
    this.ox = 0;
    this.oy = 0;
    this.cssW = 0;
    this.cssH = 0;
    this.particles = [];
    this.shake = 0;
    this.resize();
  }

  /* -------------------------------------------------------------- layout */

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(160, Math.round(rect.width || this.canvas.clientWidth || 640));
    const cssH = Math.max(120, Math.round(rect.height || this.canvas.clientHeight || 420));
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dpr = dpr;
    this.cssW = cssW;
    this.cssH = cssH;
    const pad = Math.max(6, Math.round(Math.min(cssW, cssH) * 0.022));
    this.cell = Math.max(6, Math.floor(Math.min((cssW - pad * 2) / C.GRID_W, (cssH - pad * 2) / C.GRID_H)));
    this.boardW = this.cell * C.GRID_W;
    this.boardH = this.cell * C.GRID_H;
    this.ox = Math.round((cssW - this.boardW) / 2);
    this.oy = Math.round((cssH - this.boardH) / 2);
  }

  px(x) {
    return this.ox + x * this.cell;
  }

  py(y) {
    return this.oy + y * this.cell;
  }

  /* ----------------------------------------------------------------- fx */

  burst(cell, color, count = 14) {
    const cx = this.px(cell.x + 0.5);
    const cy = this.py(cell.y + 0.5);
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = (0.35 + Math.random() * 0.9) * this.cell;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 1,
        decay: 1.4 + Math.random(),
        size: this.cell * (0.08 + Math.random() * 0.1),
        color,
      });
    }
    if (this.particles.length > 400) this.particles.splice(0, this.particles.length - 400);
  }

  kick(amount = 1) {
    this.shake = Math.max(this.shake, amount);
  }

  _stepFx(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += this.cell * 2.2 * dt;
      p.vx *= 0.96;
      p.life -= p.decay * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.shake = Math.max(0, this.shake - dt * 3.2);
  }

  /* --------------------------------------------------------------- draw */

  draw(engine, alpha, time, dt) {
    const ctx = this.ctx;
    this._stepFx(Math.min(dt, 0.05));

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Backdrop (fully opaque: the canvas owns every pixel it is given).
    const bg = ctx.createLinearGradient(0, 0, 0, this.cssH);
    bg.addColorStop(0, '#0b1020');
    bg.addColorStop(1, '#070a13');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.cssW, this.cssH);

    if (this.shake > 0) {
      const s = this.shake * this.cell * 0.28;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    this._drawBoard(ctx, engine, time);

    ctx.save();
    roundRect(ctx, this.ox, this.oy, this.boardW, this.boardH, Math.min(14, this.cell * 0.6));
    ctx.clip();
    this._drawObstacles(ctx, engine);
    this._drawFood(ctx, engine, time);
    this._drawBonus(ctx, engine, time);
    this._drawSnake(ctx, engine, alpha, time);
    this._drawParticles(ctx);
    ctx.restore();

    this._drawFrame(ctx, engine, time);
    ctx.restore();
  }

  _drawBoard(ctx, engine, time) {
    const { ox, oy, boardW, boardH, cell } = this;
    const radius = Math.min(14, cell * 0.6);

    roundRect(ctx, ox, oy, boardW, boardH, radius);
    const g = ctx.createLinearGradient(ox, oy, ox, oy + boardH);
    g.addColorStop(0, C.PALETTE.boardTop);
    g.addColorStop(1, C.PALETTE.boardBottom);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    roundRect(ctx, ox, oy, boardW, boardH, radius);
    ctx.clip();

    // Very soft checkerboard for depth.
    ctx.fillStyle = C.PALETTE.checker;
    for (let y = 0; y < C.GRID_H; y++) {
      for (let x = (y % 2); x < C.GRID_W; x += 2) {
        ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
    }

    // Grid lines.
    ctx.strokeStyle = C.PALETTE.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < C.GRID_W; x++) {
      const px = Math.round(ox + x * cell) + 0.5;
      ctx.moveTo(px, oy);
      ctx.lineTo(px, oy + boardH);
    }
    for (let y = 1; y < C.GRID_H; y++) {
      const py = Math.round(oy + y * cell) + 0.5;
      ctx.moveTo(ox, py);
      ctx.lineTo(ox + boardW, py);
    }
    ctx.stroke();

    // Corner vignette.
    const v = ctx.createRadialGradient(
      ox + boardW / 2, oy + boardH / 2, Math.min(boardW, boardH) * 0.25,
      ox + boardW / 2, oy + boardH / 2, Math.max(boardW, boardH) * 0.72
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = v;
    ctx.fillRect(ox, oy, boardW, boardH);
    ctx.restore();
  }

  _drawFrame(ctx, engine, time) {
    const { ox, oy, boardW, boardH, cell } = this;
    const radius = Math.min(14, cell * 0.6);
    const lost = engine.status === 'lost';
    ctx.save();
    ctx.lineWidth = 2;
    ctx.shadowBlur = 22;
    ctx.shadowColor = lost ? 'rgba(239,68,68,0.55)' : 'rgba(168,85,247,0.45)';
    ctx.strokeStyle = lost ? 'rgba(239,68,68,0.75)' : C.PALETTE.border;
    roundRect(ctx, ox + 1, oy + 1, boardW - 2, boardH - 2, radius);
    ctx.stroke();
    ctx.restore();

    if (engine.mode.wrap) {
      // Dashed edges hint that the borders are portals, not walls.
      ctx.save();
      ctx.setLineDash([cell * 0.35, cell * 0.35]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
      roundRect(ctx, ox + 3, oy + 3, boardW - 6, boardH - 6, radius);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawObstacles(ctx, engine) {
    if (!engine.obstacles.length) return;
    const cell = this.cell;
    const inset = cell * 0.08;
    for (const o of engine.obstacles) {
      const x = this.px(o.x) + inset;
      const y = this.py(o.y) + inset;
      const s = cell - inset * 2;
      const g = ctx.createLinearGradient(x, y, x, y + s);
      g.addColorStop(0, C.PALETTE.obstacleLight);
      g.addColorStop(1, C.PALETTE.obstacle);
      ctx.fillStyle = g;
      roundRect(ctx, x, y, s, s, cell * 0.18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15,23,42,0.9)';
      ctx.lineWidth = Math.max(1, cell * 0.06);
      ctx.stroke();
    }
  }

  _drawFood(ctx, engine, time) {
    const f = engine.food;
    if (!f) return;
    const cell = this.cell;
    const cx = this.px(f.x + 0.5);
    const cy = this.py(f.y + 0.5);
    const pulse = 1 + Math.sin(time * 0.005) * 0.07;
    const r = cell * 0.32 * pulse;

    ctx.save();
    ctx.shadowColor = C.PALETTE.foodGlow;
    ctx.shadowBlur = cell * 0.9;
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r);
    g.addColorStop(0, C.PALETTE.foodLight);
    g.addColorStop(0.55, C.PALETTE.food);
    g.addColorStop(1, '#9f1239');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Leaf + specular highlight.
    ctx.save();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.5, cy - r * 0.85, r * 0.42, r * 0.2, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.32, cy - r * 0.34, r * 0.2, r * 0.13, -0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawBonus(ctx, engine, time) {
    const b = engine.bonus;
    if (!b) return;
    const cell = this.cell;
    const cx = this.px(b.x + 0.5);
    const cy = this.py(b.y + 0.5);
    const frac = Math.max(0, Math.min(1, b.ttl / C.BONUS_TTL_TICKS));
    const urgent = frac < 0.3;
    const blink = urgent ? 0.55 + 0.45 * Math.abs(Math.sin(time * 0.012)) : 1;
    const r = cell * 0.34;

    ctx.save();
    ctx.globalAlpha = blink;
    ctx.shadowColor = C.PALETTE.bonusGlow;
    ctx.shadowBlur = cell * 1.1;
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.0018);
    const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    g.addColorStop(0, C.PALETTE.bonusLight);
    g.addColorStop(1, C.PALETTE.bonus);
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8;
      const rad = i % 2 === 0 ? r : r * 0.46;
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Countdown ring.
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.strokeStyle = urgent ? C.PALETTE.danger : C.PALETTE.bonus;
    ctx.lineWidth = Math.max(1.5, cell * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
    ctx.restore();
  }

  /** Interpolated pixel centre of body segment `i`. */
  _segPoint(engine, i, alpha) {
    const cur = engine.snake.body[i];
    const prevBody = engine.prevBody;
    let src = prevBody[i] || prevBody[prevBody.length - 1] || cur;
    // A wrap teleport must not be lerped across the whole board.
    if (Math.abs(src.x - cur.x) > 1 || Math.abs(src.y - cur.y) > 1) src = cur;
    return {
      x: this.px(src.x + (cur.x - src.x) * alpha + 0.5),
      y: this.py(src.y + (cur.y - src.y) * alpha + 0.5),
    };
  }

  _drawSnake(ctx, engine, alpha, time) {
    const cell = this.cell;
    const body = engine.snake.body;
    const n = body.length;
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(this._segPoint(engine, i, alpha));

    const lost = engine.status === 'lost';
    const headColor = lost ? '#f87171' : C.PALETTE.snakeHead;
    const tailColor = lost ? '#7f1d1d' : '#0f766e';
    const baseW = cell * 0.78;
    const maxGap = cell * 1.6;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = lost ? 'rgba(239,68,68,0.5)' : C.PALETTE.snakeGlow;
    ctx.shadowBlur = cell * 0.7;

    // Tail first so the head sits on top; per-segment colour gives a gradient.
    for (let i = n - 1; i >= 0; i--) {
      const t = n === 1 ? 1 : 1 - i / (n - 1);
      const w = baseW * (0.62 + 0.38 * t);
      ctx.strokeStyle = mixColor(tailColor, headColor, t);
      ctx.lineWidth = w;
      const a = pts[i];
      const b = pts[i + 1];
      ctx.beginPath();
      if (b && Math.abs(a.x - b.x) < maxGap && Math.abs(a.y - b.y) < maxGap) {
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(a.x, a.y);
      } else {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x, a.y);
      }
      ctx.stroke();
    }

    // Spine highlight.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    for (let i = n - 1; i >= 1; i--) {
      const t = 1 - i / Math.max(1, n - 1);
      ctx.lineWidth = baseW * (0.62 + 0.38 * t) * 0.34;
      const a = pts[i];
      const b = pts[i - 1];
      if (Math.abs(a.x - b.x) > maxGap || Math.abs(a.y - b.y) > maxGap) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();

    this._drawHead(ctx, engine, pts[0], pts[1], time, lost);
  }

  _drawHead(ctx, engine, head, neck, time, lost) {
    const cell = this.cell;
    const dirMap = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const d = dirMap[C.dirName(engine.snake.dir)] || [1, 0];
    const r = cell * 0.44;

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(Math.atan2(d[1], d[0]));

    // Skull.
    ctx.shadowColor = lost ? 'rgba(239,68,68,0.6)' : C.PALETTE.snakeGlow;
    ctx.shadowBlur = cell * 0.8;
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.2, 0, 0, r * 1.1);
    g.addColorStop(0, lost ? '#fca5a5' : C.PALETTE.snakeBodyLight);
    g.addColorStop(1, lost ? '#dc2626' : C.PALETTE.snakeBody);
    ctx.fillStyle = g;
    roundRect(ctx, -r, -r * 0.92, r * 2.05, r * 1.84, r * 0.72);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Tongue flick (paused when the game is not running).
    if (!lost && !engine.paused && engine.status === 'playing') {
      const flick = Math.sin(time * 0.006);
      if (flick > 0.6) {
        const len = r * (0.6 + flick * 0.5);
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = Math.max(1, cell * 0.07);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r * 0.9, 0);
        ctx.lineTo(r * 0.9 + len * 0.6, 0);
        ctx.moveTo(r * 0.9 + len * 0.6, 0);
        ctx.lineTo(r * 0.9 + len, -len * 0.35);
        ctx.moveTo(r * 0.9 + len * 0.6, 0);
        ctx.lineTo(r * 0.9 + len, len * 0.35);
        ctx.stroke();
      }
    }

    // Eyes.
    const ex = r * 0.34;
    const ey = r * 0.44;
    const eyeR = r * 0.3;
    for (const sign of [-1, 1]) {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(ex, ey * sign, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lost ? '#7f1d1d' : '#0f172a';
      if (lost) {
        // X eyes.
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = Math.max(1.2, eyeR * 0.42);
        ctx.beginPath();
        ctx.moveTo(ex - eyeR * 0.55, ey * sign - eyeR * 0.55);
        ctx.lineTo(ex + eyeR * 0.55, ey * sign + eyeR * 0.55);
        ctx.moveTo(ex + eyeR * 0.55, ey * sign - eyeR * 0.55);
        ctx.lineTo(ex - eyeR * 0.55, ey * sign + eyeR * 0.55);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(ex + eyeR * 0.28, ey * sign, eyeR * 0.52, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(ex + eyeR * 0.05, ey * sign - eyeR * 0.35, eyeR * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _drawParticles(ctx) {
    if (!this.particles.length) return;
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
