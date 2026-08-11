/**
 * Shared maze model: a cell graph on a cols x rows lattice.
 *
 * Each cell stores a 4-bit mask of the directions in which its wall has been
 * removed. Openings are always symmetric (carving N from (x,y) also carves S
 * from (x,y-1)), so the maze is an undirected graph and "perfect maze" is
 * exactly "spanning tree": every cell reachable AND edges === cells - 1.
 */

export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export const DIRS = [
  { bit: N, dx: 0, dy: -1, opp: S, name: 'N' },
  { bit: E, dx: 1, dy: 0, opp: W, name: 'E' },
  { bit: S, dx: 0, dy: 1, opp: N, name: 'S' },
  { bit: W, dx: -1, dy: 0, opp: E, name: 'W' },
];

/** Deterministic 32-bit PRNG (mulberry32). Never uses Math.random. */
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  constructor(seed) {
    this.seed = seed >>> 0;
    this._next = mulberry32(this.seed);
  }
  float() {
    return this._next();
  }
  int(n) {
    return Math.floor(this._next() * n);
  }
  range(lo, hi) {
    // inclusive on both ends
    return lo + Math.floor(this._next() * (hi - lo + 1));
  }
  pick(arr) {
    return arr[this.int(arr.length)];
  }
}

export class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.size = cols * rows;
    this.open = new Uint8Array(this.size);
  }

  idx(x, y) {
    return y * this.cols + x;
  }
  xOf(i) {
    return i % this.cols;
  }
  yOf(i) {
    return (i / this.cols) | 0;
  }
  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  isOpen(x, y, dir) {
    return (this.open[this.idx(x, y)] & dir.bit) !== 0;
  }

  carve(x, y, dir) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (!this.inside(nx, ny)) return false;
    this.open[this.idx(x, y)] |= dir.bit;
    this.open[this.idx(nx, ny)] |= dir.opp;
    return true;
  }

  block(x, y, dir) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (!this.inside(nx, ny)) return false;
    this.open[this.idx(x, y)] &= ~dir.bit;
    this.open[this.idx(nx, ny)] &= ~dir.opp;
    return true;
  }

  /** Remove every internal wall — the starting point for recursive division. */
  openEverything() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        let m = 0;
        if (y > 0) m |= N;
        if (x < this.cols - 1) m |= E;
        if (y < this.rows - 1) m |= S;
        if (x > 0) m |= W;
        this.open[this.idx(x, y)] = m;
      }
    }
  }

  /** Number of undirected passages (each counted once). */
  edgeCount() {
    let n = 0;
    for (let i = 0; i < this.size; i++) {
      // Count only E and S so each passage is counted from one side.
      if (this.open[i] & E) n++;
      if (this.open[i] & S) n++;
    }
    return n;
  }

  neighbours(i) {
    const x = this.xOf(i);
    const y = this.yOf(i);
    const out = [];
    for (const d of DIRS) {
      if ((this.open[i] & d.bit) === 0) continue;
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (this.inside(nx, ny)) out.push(this.idx(nx, ny));
    }
    return out;
  }

  /** Flood fill from cell 0; returns how many cells are reachable. */
  reachableCount(from = 0) {
    const seen = new Uint8Array(this.size);
    const stack = [from];
    seen[from] = 1;
    let n = 1;
    while (stack.length) {
      const cur = stack.pop();
      for (const nb of this.neighbours(cur)) {
        if (!seen[nb]) {
          seen[nb] = 1;
          n++;
          stack.push(nb);
        }
      }
    }
    return n;
  }

  clone() {
    const g = new Grid(this.cols, this.rows);
    g.open.set(this.open);
    return g;
  }
}

/**
 * A maze is *perfect* when it is a spanning tree of the cell lattice:
 * connected (every cell reachable) and acyclic (edges === cells - 1).
 */
export function analyse(grid) {
  const cells = grid.size;
  const edges = grid.edgeCount();
  const reachable = grid.reachableCount(0);
  return {
    cells,
    edges,
    reachable,
    connected: reachable === cells,
    acyclic: edges === cells - 1,
    perfect: reachable === cells && edges === cells - 1,
  };
}
