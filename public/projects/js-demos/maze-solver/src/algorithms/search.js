/**
 * Pathfinding over a wall-bitmask Grid.
 *
 * All three searches share one stepwise shape so the visualiser can drive them
 * identically: construct, then call `step()` until it returns true, then read
 * `path`, `visited` and `frontier`.
 *
 * The grid is 4-connected and every passage costs 1, which is what makes BFS
 * optimal and makes the Manhattan heuristic admissible for A*.
 */

import { DIRS } from '../grid.js';

class Search {
  constructor(grid, start, goal) {
    this.grid = grid;
    this.start = start;
    this.goal = goal;
    this.cameFrom = new Int32Array(grid.size).fill(-1);
    this.seen = new Uint8Array(grid.size);
    this.expanded = new Uint8Array(grid.size);
    this.path = [];
    this.done = false;
    this.found = false;
    this.visitedCount = 0;
    this.steps = 0;
    this.current = start;
  }

  /** Passable neighbours of `i`, in a fixed order so runs are reproducible. */
  neighbours(i) {
    const g = this.grid;
    const x = g.xOf(i);
    const y = g.yOf(i);
    const out = [];
    for (const d of DIRS) {
      if (!(g.open[i] & d.bit)) continue;      // wall between the two cells
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (!g.inside(nx, ny)) continue;
      out.push(g.idx(nx, ny));
    }
    return out;
  }

  reconstruct(end) {
    const path = [];
    let cur = end;
    while (cur !== -1) {
      path.push(cur);
      if (cur === this.start) break;
      cur = this.cameFrom[cur];
    }
    path.reverse();
    this.path = path;
    this.found = path.length > 0 && path[0] === this.start && path[path.length - 1] === this.goal;
    return this.found;
  }

  finish(end) {
    this.done = true;
    if (end !== undefined) this.reconstruct(end);
    return true;
  }
}

/** Breadth-first: expands in rings, so the first time it reaches the goal is via a shortest path. */
export class BFS extends Search {
  constructor(grid, start, goal) {
    super(grid, start, goal);
    this.queue = [start];
    this.head = 0;
    this.seen[start] = 1;
  }

  get frontier() {
    return this.queue.slice(this.head);
  }

  step() {
    if (this.done) return true;
    if (this.head >= this.queue.length) return this.finish();
    this.steps++;

    const i = this.queue[this.head++];
    this.current = i;
    this.expanded[i] = 1;
    this.visitedCount++;
    if (i === this.goal) return this.finish(i);

    for (const n of this.neighbours(i)) {
      if (this.seen[n]) continue;
      this.seen[n] = 1;
      this.cameFrom[n] = i;
      this.queue.push(n);
    }
    return false;
  }
}

/** Depth-first: commits to one branch until it dead-ends, then backtracks. */
export class DFS extends Search {
  constructor(grid, start, goal) {
    super(grid, start, goal);
    this.stack = [start];
    this.seen[start] = 1;
  }

  get frontier() {
    return this.stack.slice();
  }

  step() {
    if (this.done) return true;
    if (!this.stack.length) return this.finish();
    this.steps++;

    const i = this.stack.pop();
    this.current = i;
    // Mark on expansion, not on discovery -- this is the visited set the
    // visualiser paints, and it is what makes DFS's single-corridor sweep
    // visible instead of an invisible no-op.
    this.expanded[i] = 1;
    this.visitedCount++;
    if (i === this.goal) return this.finish(i);

    for (const n of this.neighbours(i)) {
      if (this.seen[n]) continue;
      this.seen[n] = 1;
      this.cameFrom[n] = i;
      this.stack.push(n);
    }
    return false;
  }
}

/**
 * A* with the Manhattan heuristic. On a 4-connected unit-cost grid that never
 * overestimates the true distance, so A* is admissible and also returns a
 * shortest path -- while usually expanding far fewer cells than BFS.
 */
export class AStar extends Search {
  constructor(grid, start, goal) {
    super(grid, start, goal);
    this.g = new Float64Array(grid.size).fill(Infinity);
    this.f = new Float64Array(grid.size).fill(Infinity);
    this.g[start] = 0;
    this.f[start] = this.h(start);
    this.open = [start];
    this.seen[start] = 1;
  }

  h(i) {
    const g = this.grid;
    return Math.abs(g.xOf(i) - g.xOf(this.goal)) + Math.abs(g.yOf(i) - g.yOf(this.goal));
  }

  get frontier() {
    return this.open.slice();
  }

  step() {
    if (this.done) return true;
    if (!this.open.length) return this.finish();
    this.steps++;

    // Linear scan for the lowest f. The grids here are small enough that a
    // binary heap would not pay for its own complexity.
    let bestAt = 0;
    for (let k = 1; k < this.open.length; k++) {
      if (this.f[this.open[k]] < this.f[this.open[bestAt]]) bestAt = k;
    }
    const i = this.open.splice(bestAt, 1)[0];
    this.current = i;
    this.expanded[i] = 1;
    this.visitedCount++;
    if (i === this.goal) return this.finish(i);

    for (const n of this.neighbours(i)) {
      const tentative = this.g[i] + 1;
      if (tentative >= this.g[n]) continue;
      this.cameFrom[n] = i;
      this.g[n] = tentative;
      this.f[n] = tentative + this.h(n);
      this.seen[n] = 1;
      if (!this.open.includes(n)) this.open.push(n);
    }
    return false;
  }
}

export const ALGORITHMS = {
  bfs: {
    label: 'Breadth-First Search',
    ctor: BFS,
    optimal: true,
    blurb: 'Expands outwards in rings, one ring per unit of distance. The first time it touches the goal it has arrived by a shortest route — but it pays for that by visiting nearly everything closer than the goal.',
  },
  dfs: {
    label: 'Depth-First Search',
    ctor: DFS,
    optimal: false,
    blurb: 'Follows one corridor as far as it goes, then backtracks to the last junction. On a maze with loops it would often settle for a long way round; on a perfect maze there is only one route, so what it really saves is search effort, not distance.',
  },
  astar: {
    label: 'A* (Manhattan)',
    ctor: AStar,
    optimal: true,
    blurb: 'Like BFS, but it prefers cells that look closer to the goal. The Manhattan distance never overestimates on a 4-connected grid, so A* still returns a shortest path while expanding far fewer cells.',
  },
};

/** True shortest distance from start to goal, for checking the searches. */
export function shortestDistance(grid, start, goal) {
  const dist = new Int32Array(grid.size).fill(-1);
  dist[start] = 0;
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    if (i === goal) return dist[i];
    const x = grid.xOf(i);
    const y = grid.yOf(i);
    for (const d of DIRS) {
      if (!(grid.open[i] & d.bit)) continue;
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (!grid.inside(nx, ny)) continue;
      const n = grid.idx(nx, ny);
      if (dist[n] !== -1) continue;
      dist[n] = dist[i] + 1;
      queue.push(n);
    }
  }
  return dist[goal];
}

/** A path is legal only if each step is one cell through an actual opening. */
export function pathIsLegal(grid, path, start, goal) {
  if (!path.length) return false;
  if (path[0] !== start || path[path.length - 1] !== goal) return false;
  for (let k = 1; k < path.length; k++) {
    const a = path[k - 1];
    const b = path[k];
    const dx = grid.xOf(b) - grid.xOf(a);
    const dy = grid.yOf(b) - grid.yOf(a);
    const dir = DIRS.find((d) => d.dx === dx && d.dy === dy);
    if (!dir) return false;
    if (!(grid.open[a] & dir.bit)) return false;
  }
  return true;
}
