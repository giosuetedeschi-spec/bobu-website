import { DIRS } from '../grid.js';

/**
 * Randomised depth-first search ("recursive backtracker").
 *
 * Invariant: a cell is marked visited exactly when it is carved into, and it is
 * only ever carved into from an already-visited cell. That makes the set of
 * carved passages a tree that grows one edge per newly visited cell, so the
 * finished maze has cells-1 edges and is fully connected — a perfect maze.
 */
export class RecursiveBacktracker {
  static label = 'Recursive Backtracker';
  static blurb =
    'Walks randomly, carving as it goes. When it hits a dead end it backtracks along its own stack until a new direction opens up. Produces long, winding corridors and few junctions.';

  constructor(grid, rng) {
    this.grid = grid;
    this.rng = rng;
    this.visited = new Uint8Array(grid.size);
    this.heat = new Float32Array(grid.size).fill(-1);
    this.stack = [];
    this.done = false;
    this.steps = 0;
    this.carved = 0;

    const start = grid.idx(0, 0);
    this.visited[start] = 1;
    this.heat[start] = 0;
    this.carved = 1;
    this.stack.push(start);
    this.maxOrder = grid.size - 1 || 1;
  }

  get active() {
    return this.stack.length ? [this.stack[this.stack.length - 1]] : [];
  }

  get frontier() {
    // The rest of the stack is the "retreat path" — show it as a soft trail.
    return this.stack.length > 1 ? this.stack.slice(0, -1) : [];
  }

  get info() {
    return { stack: this.stack.length };
  }

  step() {
    if (this.done) return true;
    this.steps++;

    const cur = this.stack[this.stack.length - 1];
    const x = this.grid.xOf(cur);
    const y = this.grid.yOf(cur);

    const options = [];
    for (const d of DIRS) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (!this.grid.inside(nx, ny)) continue;
      const ni = this.grid.idx(nx, ny);
      if (!this.visited[ni]) options.push({ d, ni });
    }

    if (options.length) {
      const choice = options[this.rng.int(options.length)];
      this.grid.carve(x, y, choice.d);
      this.visited[choice.ni] = 1;
      this.heat[choice.ni] = this.carved / this.maxOrder;
      this.carved++;
      this.stack.push(choice.ni);
    } else {
      this.stack.pop();
    }

    if (!this.stack.length) this.done = true;
    return this.done;
  }
}
