<<<<<<< HEAD
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
=======
import * as C from "./constants.js";

export class Vector2 {
  x;
  y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(dir) {
    return new Vector2(this.x + dir.x, this.y + dir.y);
  }
  equals(other) {
    return this.x === other.x && this.y === other.y;
  }
}

export class Snake {
  body;
  direction;
  nextDirection;
  growPending;
  constructor() {
    const startX = Math.floor(C.GRID_WIDTH / 2);
    const startY = Math.floor(C.GRID_HEIGHT / 2);
    this.body = [
      new Vector2(startX, startY),
      new Vector2(startX - 1, startY),
      new Vector2(startX - 2, startY)
    ];
    this.direction = C.RIGHT;
    this.nextDirection = C.RIGHT;
    this.growPending = 0;
  }
  setDirection(newDir) {
    if (newDir.x + this.direction.x === 0 && newDir.y + this.direction.y === 0) {
      return;
    }
    this.nextDirection = newDir;
  }
  update() {
    this.direction = this.nextDirection;
    const head = this.body[0];
    const newHead = head.add(this.direction);
    this.body.unshift(newHead);
    if (this.growPending > 0) {
      this.growPending--;
    } else {
      this.body.pop();
    }
  }
  grow(amount = C.GROWTH_PER_FOOD) {
    this.growPending += amount;
  }
  getHead() {
    return this.body[0];
  }
  checkSelfCollision() {
    const head = this.getHead();
    for (let i = 1;i < this.body.length; i++) {
      if (head.equals(this.body[i])) {
        return true;
      }
    }
    return false;
  }
  checkWallCollision() {
    const head = this.getHead();
    return head.x < 0 || head.x >= C.GRID_WIDTH || head.y < 0 || head.y >= C.GRID_HEIGHT;
  }
  draw(ctx) {
    this.body.forEach((segment, i) => {
      const brightness = 1 - i / this.body.length * 0.5;
      const r = Math.floor(16 * brightness);
      const g = Math.floor(185 * brightness);
      const b = Math.floor(129 * brightness);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(segment.x * C.GRID_SIZE, segment.y * C.GRID_SIZE, C.GRID_SIZE - 2, C.GRID_SIZE - 2);
      if (i === 0) {
        ctx.strokeStyle = C.GOLD;
        ctx.lineWidth = 2;
        ctx.strokeRect(segment.x * C.GRID_SIZE, segment.y * C.GRID_SIZE, C.GRID_SIZE - 2, C.GRID_SIZE - 2);
      }
    });
  }
}

export class Food {
  pos;
  constructor(snake) {
    this.pos = new Vector2(0, 0);
    this.respawn(snake);
  }
  respawn(snake) {
    do {
      this.pos = new Vector2(Math.floor(Math.random() * C.GRID_WIDTH), Math.floor(Math.random() * C.GRID_HEIGHT));
    } while (snake.body.some((segment) => segment.equals(this.pos)));
  }
  draw(ctx) {
    ctx.fillStyle = C.RED;
    ctx.fillRect(this.pos.x * C.GRID_SIZE, this.pos.y * C.GRID_SIZE, C.GRID_SIZE - 2, C.GRID_SIZE - 2);
  }
>>>>>>> 54630ec (fix: complete browser game implementations and ports)
}
