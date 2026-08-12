import { DIRS } from '../grid.js';

/**
 * Randomised Prim's algorithm on the *frontier set*.
 *
 * "In-tree" cells form a growing tree. The frontier is every cell not in the
 * tree that touches it. Each step pulls a uniformly random frontier cell and
 * links it to one random in-tree neighbour — exactly one new edge per newly
 * added cell, so the result is again a spanning tree (perfect maze), but with
 * a much bushier, more branch-heavy texture than DFS.
 */
export class PrimsAlgorithm {
  static label = "Prim's Algorithm";
  static blurb =
    'Grows a tree outward from one cell. Every cell touching the tree sits in a "frontier" set; each step picks one at random and links it in. Lots of short branches and dead ends.';

  constructor(grid, rng) {
    this.grid = grid;
    this.rng = rng;
    this.inTree = new Uint8Array(grid.size);
    this.inFrontier = new Uint8Array(grid.size);
    this.heat = new Float32Array(grid.size).fill(-1);
    this.frontierList = [];
    this.lastAdded = -1;
    this.done = false;
    this.steps = 0;
    this.carved = 0;
    this.maxOrder = grid.size - 1 || 1;

    const start = grid.idx(rng.int(grid.cols), rng.int(grid.rows));
    this.inTree[start] = 1;
    this.heat[start] = 0;
    this.carved = 1;
    this.lastAdded = start;
    this._pushFrontier(start);
  }

  get active() {
    return this.lastAdded >= 0 ? [this.lastAdded] : [];
  }

  get frontier() {
    return this.frontierList.slice();
  }

  get info() {
    return { frontier: this.frontierList.length };
  }

  _pushFrontier(i) {
    const x = this.grid.xOf(i);
    const y = this.grid.yOf(i);
    for (const d of DIRS) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (!this.grid.inside(nx, ny)) continue;
      const ni = this.grid.idx(nx, ny);
      if (this.inTree[ni] || this.inFrontier[ni]) continue;
      this.inFrontier[ni] = 1;
      this.frontierList.push(ni);
    }
  }

  step() {
    if (this.done) return true;
    this.steps++;

    if (!this.frontierList.length) {
      this.done = true;
      this.lastAdded = -1;
      return true;
    }

    // Uniform pick, O(1) removal via swap-with-last.
    const k = this.rng.int(this.frontierList.length);
    const cell = this.frontierList[k];
    this.frontierList[k] = this.frontierList[this.frontierList.length - 1];
    this.frontierList.pop();
    this.inFrontier[cell] = 0;

    const x = this.grid.xOf(cell);
    const y = this.grid.yOf(cell);

    // Link to a random neighbour that is already in the tree.
    const links = [];
    for (const d of DIRS) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (!this.grid.inside(nx, ny)) continue;
      if (this.inTree[this.grid.idx(nx, ny)]) links.push(d);
    }
    if (links.length) {
      this.grid.carve(x, y, links[this.rng.int(links.length)]);
      this.inTree[cell] = 1;
      this.heat[cell] = this.carved / this.maxOrder;
      this.carved++;
      this.lastAdded = cell;
      this._pushFrontier(cell);
    }

    if (!this.frontierList.length) this.done = true;
    return this.done;
  }
}
