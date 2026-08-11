/**
 * Snake — simulation core.
 *
 * Deterministic and completely synchronous: one call to `tick()` advances the
 * world exactly one logical step. Nothing in here reads the clock, the DOM or
 * Math.random, so the harness can drive it with `step(n)` and get byte-identical
 * results for a given seed.
 */

import * as C from './constants.js';
import { makeRng } from './rng.js';
import { Snake, pickFreeCell, key, same } from './entities.js';

const MAX_QUEUED_TURNS = 2;

export class Engine {
  constructor(options = {}) {
    this.mode = { wrap: !!options.wrap, obstacles: !!options.obstacles };
    this.reset(options.seed ?? 1);
  }

  /* ---------------------------------------------------------------- setup */

  reset(seed = 1, options = {}) {
    if (options.wrap !== undefined) this.mode.wrap = !!options.wrap;
    if (options.obstacles !== undefined) this.mode.obstacles = !!options.obstacles;

    this.seed = seed >>> 0;
    this.rng = makeRng(this.seed);
    this.tickCount = 0;
    this.status = 'playing';
    this.paused = false;
    this.score = 0;
    this.foodEaten = 0;
    this.bonusEaten = 0;
    this.deathCause = null;
    this.queue = [];

    const startX = Math.floor(C.GRID_W / 2);
    const startY = Math.floor(C.GRID_H / 2);
    const cells = [];
    for (let i = 0; i < C.INITIAL_LENGTH; i++) cells.push({ x: startX - i, y: startY });
    this.snake = new Snake(cells, C.RIGHT);
    this.spawn = { x: startX, y: startY };

    this.obstacles = this.mode.obstacles ? this._buildObstacles() : [];
    this.obstacleSet = new Set(this.obstacles.map((o) => key(o.x, o.y)));

    this.bonus = null;
    this.food = null;
    this.food = this._spawnFood();

    // Rendering-only history: where every segment sat one tick ago.
    this.prevBody = this.snake.snapshot();
    return this;
  }

  /** Sparse clusters, never inside the snake's starting corridor. */
  _buildObstacles() {
    const cells = [];
    const taken = new Set();
    const guarded = (x, y) =>
      Math.abs(y - this.spawn.y) <= 1 && x <= this.spawn.x + C.OBSTACLE_SPAWN_GUARD;

    for (let c = 0; c < C.OBSTACLE_CLUSTERS; c++) {
      const horizontal = this.rng() < 0.5;
      const len = 2 + this.rng.int(3);
      const ox = 2 + this.rng.int(C.GRID_W - 4 - (horizontal ? len : 0));
      const oy = 2 + this.rng.int(C.GRID_H - 4 - (horizontal ? 0 : len));
      const run = [];
      let ok = true;
      for (let i = 0; i < len; i++) {
        const x = horizontal ? ox + i : ox;
        const y = horizontal ? oy : oy + i;
        if (x < 1 || y < 1 || x >= C.GRID_W - 1 || y >= C.GRID_H - 1) { ok = false; break; }
        if (guarded(x, y) || taken.has(key(x, y))) { ok = false; break; }
        run.push({ x, y });
      }
      if (!ok) continue;
      for (const cell of run) {
        taken.add(key(cell.x, cell.y));
        cells.push(cell);
      }
    }
    return cells;
  }

  /* --------------------------------------------------------------- spawns */

  _blockedCells() {
    const blocked = new Set(this.snake.occupied);
    for (const k of this.obstacleSet) blocked.add(k);
    if (this.food) blocked.add(key(this.food.x, this.food.y));
    if (this.bonus) blocked.add(key(this.bonus.x, this.bonus.y));
    return blocked;
  }

  /** Uniform over the free cells — never on the body, never a spin-loop. */
  _spawnFood() {
    const blocked = this._blockedCells();
    if (this.food) blocked.delete(key(this.food.x, this.food.y));
    const cell = pickFreeCell(this.rng, blocked);
    if (!cell) {
      this.status = 'won';
      return null;
    }
    return cell;
  }

  _spawnBonus() {
    const cell = pickFreeCell(this.rng, this._blockedCells());
    if (!cell) return null;
    return { x: cell.x, y: cell.y, ttl: C.BONUS_TTL_TICKS, maxTtl: C.BONUS_TTL_TICKS };
  }

  /* ---------------------------------------------------------------- input */

  /**
   * Buffer a turn. Only one turn is consumed per tick and an exact reversal of
   * the *last committed or queued* direction is rejected — that is the fix for
   * the classic "two keys inside one tick folds the snake into itself" bug.
   */
  queueDirection(dir) {
    if (!dir) return { ok: false, reason: 'unknown direction' };
    if (this.status !== 'playing') return { ok: false, reason: `game is ${this.status}` };
    const reference = this.queue.length ? this.queue[this.queue.length - 1] : this.snake.dir;
    if (C.isOpposite(dir, reference)) return { ok: false, reason: 'reversal rejected' };
    if (same(dir, reference)) return { ok: true, queued: false, reason: 'already heading there' };
    if (this.queue.length >= MAX_QUEUED_TURNS) return { ok: true, queued: false, reason: 'queue full' };
    this.queue.push(dir);
    return { ok: true, queued: true };
  }

  setPaused(value) {
    if (this.status !== 'playing') return { ok: false, reason: `game is ${this.status}` };
    this.paused = value === undefined ? !this.paused : !!value;
    return { ok: true, paused: this.paused };
  }

  /* ----------------------------------------------------------------- tick */

  get tickMs() {
    const grown = this.snake.length - C.INITIAL_LENGTH;
    return Math.max(C.TICK_MS_MIN, C.TICK_MS_START - grown * C.TICK_MS_PER_SEGMENT);
  }

  _die(cause) {
    this.status = 'lost';
    this.deathCause = cause;
  }

  /** Advance exactly one logical step. Returns the events that happened. */
  tick() {
    if (this.status !== 'playing' || this.paused) return [];

    const events = [];
    this.prevBody = this.snake.snapshot();
    this.tickCount++;

    // One direction change per tick, drained from the buffer.
    if (this.queue.length) {
      const next = this.queue.shift();
      if (!C.isOpposite(next, this.snake.dir)) this.snake.dir = next;
    }

    const head = this.snake.nextHead(this.snake.dir, this.mode.wrap);

    if (!this.mode.wrap && (head.x < 0 || head.y < 0 || head.x >= C.GRID_W || head.y >= C.GRID_H)) {
      this._die('wall');
      return ['dead'];
    }
    if (this.obstacleSet.has(key(head.x, head.y))) {
      this._die('obstacle');
      return ['dead'];
    }

    const eatsFood = !!this.food && same(head, this.food);
    const eatsBonus = !!this.bonus && same(head, this.bonus);
    if (eatsFood || eatsBonus) this.snake.growPending += C.GROWTH_PER_FOOD;

    // Vacate the tail *before* testing the head: entering the cell your tail is
    // leaving on the very same tick is legal.
    if (this.snake.growPending > 0) this.snake.growPending--;
    else this.snake.popTail();

    if (this.snake.covers(head.x, head.y)) {
      this._die('self');
      return ['dead'];
    }

    this.snake.pushHead(head);

    if (eatsFood) {
      this.score += C.POINTS_PER_FOOD;
      this.foodEaten++;
      events.push('eat');
      this.food = this._spawnFood();
      if (!this.bonus && this.foodEaten % C.BONUS_EVERY === 0) {
        this.bonus = this._spawnBonus();
        if (this.bonus) events.push('bonus-spawn');
      }
    }

    if (eatsBonus) {
      this.score += C.BONUS_POINTS;
      this.bonusEaten++;
      this.bonus = null;
      events.push('bonus');
    } else if (this.bonus) {
      this.bonus.ttl--;
      if (this.bonus.ttl <= 0) {
        this.bonus = null;
        events.push('bonus-expired');
      }
    }

    return events;
  }

  /* ---------------------------------------------------------------- state */

  getState() {
    return {
      id: 'snake',
      status: this.status,
      turn: null,
      score: this.score,
      tick: this.tickCount,
      seed: this.seed,
      paused: this.paused,
      grid: { w: C.GRID_W, h: C.GRID_H },
      snake: this.snake.snapshot(),
      length: this.snake.length,
      direction: C.dirName(this.snake.dir),
      queued: this.queue.map(C.dirName),
      food: this.food ? { x: this.food.x, y: this.food.y } : null,
      bonus: this.bonus ? { x: this.bonus.x, y: this.bonus.y, ttl: this.bonus.ttl } : null,
      obstacles: this.obstacles.map((o) => ({ x: o.x, y: o.y })),
      mode: { wrap: this.mode.wrap, obstacles: this.mode.obstacles },
      foodEaten: this.foodEaten,
      bonusEaten: this.bonusEaten,
      tickMs: Math.round(this.tickMs * 100) / 100,
      deathCause: this.deathCause,
    };
  }
}
