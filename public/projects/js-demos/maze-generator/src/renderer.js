/**
 * Maze renderer.
 *
 * Draws the wall-bitmask `Grid` as passages rather than as a cell bitmap: each
 * cell is a rounded block, and a carved passage is painted as a bridge into the
 * neighbouring cell. `heat` (carve order, 0..1) tints the maze so you can read
 * the order the algorithm worked in, and the algorithm's own cursor/frontier is
 * overlaid on top.
 */

import { DIRS } from './grid.js';

const PALETTE = {
  bg: '#0b1020',
  wall: '#0e1426',
  cool: [56, 189, 248],   // early cells
  warm: [167, 139, 250],  // late cells
  unvisited: '#151d33',
  cursor: '#f472b6',
  frontier: 'rgba(56, 189, 248, 0.42)',
  rect: 'rgba(251, 191, 36, 0.5)',
};

const lerp = (a, b, t) => a + (b - a) * t;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.cell = 10;
    this.ox = 0;
    this.oy = 0;
  }

  /** Fits `cols x rows` cells into the canvas' CSS box at device resolution. */
  layout(cols, rows) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(120, Math.round(rect.width || 640));
    const cssH = Math.max(120, Math.round(rect.height || 480));
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dpr = dpr;
    this.cssW = cssW;
    this.cssH = cssH;
    const pad = 10;
    this.cell = Math.max(3, Math.floor(Math.min((cssW - pad * 2) / cols, (cssH - pad * 2) / rows)));
    this.ox = Math.round((cssW - this.cell * cols) / 2);
    this.oy = Math.round((cssH - this.cell * rows) / 2);
  }

  clear() {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, this.cssW, this.cssH);
  }

  _heatColor(t) {
    const r = Math.round(lerp(PALETTE.cool[0], PALETTE.warm[0], t));
    const g = Math.round(lerp(PALETTE.cool[1], PALETTE.warm[1], t));
    const b = Math.round(lerp(PALETTE.cool[2], PALETTE.warm[2], t));
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * @param grid  Grid
   * @param algo  the running algorithm (may expose heat / cursor / frontier)
   */
  draw(grid, algo) {
    this.layout(grid.cols, grid.rows);
    this.clear();

    const { ctx, cell } = this;
    const heat = algo?.heat;
    // Passage thickness: leave a visible wall gap between cells.
    const inset = Math.max(0.5, cell * 0.16);
    const w = cell - inset * 2;

    // Board backing so the maze reads as an object, not a stain on the page.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(this.ox - 6, this.oy - 6, cell * grid.cols + 12, cell * grid.rows + 12);

    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.cols; x++) {
        const i = grid.idx(x, y);
        const t = heat ? heat[i] : 0;
        const carved = grid.open[i] !== 0;
        if (!carved && (!heat || t < 0)) {
          ctx.fillStyle = PALETTE.unvisited;
        } else {
          ctx.fillStyle = this._heatColor(Math.max(0, Math.min(1, t < 0 ? 0 : t)));
        }
        const px = this.ox + x * cell + inset;
        const py = this.oy + y * cell + inset;
        ctx.fillRect(px, py, w, w);

        // Bridge into the E and S neighbours so passages join up visually.
        if (grid.open[i] & DIRS[1].bit) ctx.fillRect(px + w, py, inset * 2, w);
        if (grid.open[i] & DIRS[2].bit) ctx.fillRect(px, py + w, w, inset * 2);
      }
    }

    if (!algo || algo.done) return;

    // Prim's frontier.
    if (algo.frontierList?.length && algo.inFrontier) {
      ctx.fillStyle = PALETTE.frontier;
      for (const i of algo.frontierList) {
        if (!algo.inFrontier[i]) continue;
        ctx.fillRect(this.ox + grid.xOf(i) * cell + inset, this.oy + grid.yOf(i) * cell + inset, w, w);
      }
    }

    // Recursive division's active rectangle.
    if (algo.activeRect) {
      const r = algo.activeRect;
      ctx.strokeStyle = PALETTE.rect;
      ctx.lineWidth = Math.max(1, cell * 0.14);
      ctx.strokeRect(this.ox + r.x * cell, this.oy + r.y * cell, r.w * cell, r.h * cell);
    }

    // Backtracker cursor (top of the stack) or Prim's last addition.
    const cursor = algo.stack?.length ? algo.stack[algo.stack.length - 1] : algo.lastAdded;
    if (typeof cursor === 'number' && cursor >= 0) {
      const cx = this.ox + grid.xOf(cursor) * cell + cell / 2;
      const cy = this.oy + grid.yOf(cursor) * cell + cell / 2;
      ctx.fillStyle = PALETTE.cursor;
      ctx.shadowColor = PALETTE.cursor;
      ctx.shadowBlur = cell * 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1.5, cell * 0.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
