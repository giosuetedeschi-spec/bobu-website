/**
 * Snake — entities.
 *
 * Grid-space only (integer cells). Nothing here knows about pixels, the DOM or
 * timing, which keeps the simulation trivially testable and headless-safe.
 */

import * as C from './constants.js';

export const key = (x, y) => y * C.GRID_W + x;

export class Snake {
  /** @param {{x:number,y:number}[]} cells head-first @param {{x:number,y:number}} dir */
  constructor(cells, dir) {
    this.body = cells.map((c) => ({ x: c.x, y: c.y }));
    this.dir = dir;
    this.occupied = new Set(this.body.map((c) => key(c.x, c.y)));
    this.growPending = 0;
  }

  get head() {
    return this.body[0];
  }

  get tail() {
    return this.body[this.body.length - 1];
  }

  get length() {
    return this.body.length;
  }

  covers(x, y) {
    return this.occupied.has(key(x, y));
  }

  /** Cell the head would enter next, honouring wrap-around when enabled. */
  nextHead(dir, wrap) {
    let x = this.head.x + dir.x;
    let y = this.head.y + dir.y;
    if (wrap) {
      x = (x + C.GRID_W) % C.GRID_W;
      y = (y + C.GRID_H) % C.GRID_H;
    }
    return { x, y };
  }

  /** Free the tail cell. Must happen *before* the collision test so that
   *  chasing your own tail is legal — the cell is vacated as you enter it. */
  popTail() {
    const t = this.body.pop();
    this.occupied.delete(key(t.x, t.y));
    return t;
  }

  pushHead(cell) {
    this.body.unshift(cell);
    this.occupied.add(key(cell.x, cell.y));
  }

  snapshot() {
    return this.body.map((c) => ({ x: c.x, y: c.y }));
  }
}

/** Cell equality helper used by the self-test and the engine. */
export const same = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y;

/**
 * Pick a free cell uniformly at random.
 * Builds the set of free cells and indexes into it — no rejection sampling, so
 * it terminates even when the board is nearly full (and reports `null` when it
 * is completely full, which is a win, not a hang).
 */
export function pickFreeCell(rng, blocked) {
  const free = [];
  for (let y = 0; y < C.GRID_H; y++) {
    for (let x = 0; x < C.GRID_W; x++) {
      if (!blocked.has(key(x, y))) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[rng.int(free.length)];
}
