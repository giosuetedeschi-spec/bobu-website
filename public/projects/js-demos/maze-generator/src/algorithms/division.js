import { DIRS } from '../grid.js';

const DIR_E = DIRS[1];
const DIR_S = DIRS[2];

/**
 * Recursive division.
 *
 * Starts from an empty room (every internal wall removed) and recursively
 * splits each chamber with a straight wall that has exactly ONE gap punched in
 * it. A chamber of C cells becomes two chambers of c1 + c2 = C cells joined by
 * a single passage, so by induction spanning-tree(C) = spanning-tree(c1) +
 * spanning-tree(c2) + 1 edge = C - 1 edges. Recursion stops only at 1x1
 * chambers, so the maze is always perfect.
 *
 * The original implementation picked the gap position anywhere in the chamber
 * *including* coordinates that a later split would wall off, which produced
 * loops and isolated pockets. Here the gap is a cell index inside the chamber
 * and the wall is a set of edges between two adjacent rows/columns, which
 * cannot interact with any other chamber.
 */
export class RecursiveDivision {
  static label = 'Recursive Division';
  static blurb =
    'Begins with one wide-open room and slices it in half over and over, leaving a single doorway in each new wall. Gives blocky, room-like mazes with long straight corridors.';

  constructor(grid, rng) {
    this.grid = grid;
    this.rng = rng;
    this.heat = new Float32Array(grid.size).fill(-1);
    this.done = false;
    this.steps = 0;
    this.wallsBuilt = 0;
    this.maxDepth = 1;

    grid.openEverything();
    this.stack = [{ x: 0, y: 0, w: grid.cols, h: grid.rows, depth: 0 }];
    this.pending = []; // queued wall segments, closed one per step
    this.activeRect = null;
    this._paint(this.stack[0]);
  }

  get active() {
    return this.pending.length ? [this.pending[0].cell] : [];
  }

  get frontier() {
    return [];
  }

  get info() {
    return { chambers: this.stack.length, walls: this.wallsBuilt };
  }

  _paint(ch) {
    this.maxDepth = Math.max(this.maxDepth, ch.depth + 1);
    const t = ch.depth / 12;
    for (let y = ch.y; y < ch.y + ch.h; y++) {
      for (let x = ch.x; x < ch.x + ch.w; x++) {
        this.heat[this.grid.idx(x, y)] = Math.min(1, t);
      }
    }
  }

  step() {
    if (this.done) return true;
    this.steps++;

    // Drain queued wall segments one at a time so the wall visibly grows.
    if (this.pending.length) {
      const seg = this.pending.shift();
      this.grid.block(seg.x, seg.y, seg.dir);
      this.wallsBuilt++;
      if (!this.pending.length) this.activeRect = null;
      return false;
    }

    while (this.stack.length) {
      const ch = this.stack.pop();
      const canH = ch.h >= 2;
      const canV = ch.w >= 2;
      if (!canH && !canV) continue;

      let horizontal;
      if (canH && canV) {
        if (ch.w > ch.h) horizontal = false;
        else if (ch.h > ch.w) horizontal = true;
        else horizontal = this.rng.float() < 0.5;
      } else {
        horizontal = canH;
      }

      this.activeRect = { x: ch.x, y: ch.y, w: ch.w, h: ch.h };

      if (horizontal) {
        // Wall lives between row `wy` and row `wy + 1`.
        const wy = ch.y + this.rng.int(ch.h - 1);
        const gap = ch.x + this.rng.int(ch.w);
        for (let x = ch.x; x < ch.x + ch.w; x++) {
          if (x === gap) continue;
          this.pending.push({ x, y: wy, dir: DIR_S, cell: this.grid.idx(x, wy) });
        }
        const top = { x: ch.x, y: ch.y, w: ch.w, h: wy - ch.y + 1, depth: ch.depth + 1 };
        const bottom = { x: ch.x, y: wy + 1, w: ch.w, h: ch.y + ch.h - wy - 1, depth: ch.depth + 1 };
        this._paint(top);
        this._paint(bottom);
        this.stack.push(top, bottom);
      } else {
        const wx = ch.x + this.rng.int(ch.w - 1);
        const gap = ch.y + this.rng.int(ch.h);
        for (let y = ch.y; y < ch.y + ch.h; y++) {
          if (y === gap) continue;
          this.pending.push({ x: wx, y, dir: DIR_E, cell: this.grid.idx(wx, y) });
        }
        const left = { x: ch.x, y: ch.y, w: wx - ch.x + 1, h: ch.h, depth: ch.depth + 1 };
        const right = { x: wx + 1, y: ch.y, w: ch.x + ch.w - wx - 1, h: ch.h, depth: ch.depth + 1 };
        this._paint(left);
        this._paint(right);
        this.stack.push(left, right);
      }

      if (this.pending.length) return false;
      // A 1-wide chamber split leaves zero segments to draw; keep looking.
    }

    this.done = true;
    this.activeRect = null;
    return true;
  }
}
