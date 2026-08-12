/**
 * Snake — built-in self test.
 *
 * Driven from the harness with `window.__GAME__.input("selftest")`.
 * Every case builds its own throw-away Engine so the live game is untouched.
 */

import * as C from './constants.js';
import { Engine } from './engine.js';
import { Snake, key } from './entities.js';

/** Fresh engine with a hand-placed body and nothing else on the board. */
function scenario(cells, dir, options = {}) {
  const e = new Engine({ seed: options.seed ?? 7 });
  e.reset(options.seed ?? 7, { wrap: !!options.wrap, obstacles: false });
  e.snake = new Snake(cells, dir);
  e.prevBody = e.snake.snapshot();
  e.obstacles = [];
  e.obstacleSet = new Set();
  e.bonus = null;
  e.food = options.food ?? { x: -9, y: -9 }; // off-board: unreachable, never eaten
  return e;
}

export function runSelfTest() {
  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok: !!ok, detail: String(detail) });
    return !!ok;
  };
  const t = (name, fn) => {
    try {
      fn(check.bind(null, name));
    } catch (err) {
      results.push({ name, ok: false, detail: `threw: ${err && err.message}` });
    }
  };

  /* 1 — a direct reversal is rejected, including across a buffered turn. */
  t('reversal is rejected', (ok) => {
    const e = new Engine({ seed: 3 });
    const straight = e.queueDirection(C.LEFT); // snake starts heading right
    ok(straight.ok === false && /reversal/.test(straight.reason), `immediate: ${straight.reason}`);
  });

  t('reversal across a buffered turn is rejected', (ok) => {
    const e = new Engine({ seed: 3 });
    const a = e.queueDirection(C.UP); // legal, buffered
    const b = e.queueDirection(C.DOWN); // would fold the snake in half
    e.tick();
    e.tick();
    const alive = e.status === 'playing';
    ok(
      a.ok && a.queued && b.ok === false && alive,
      `queued=${a.queued} second=${b.ok}/${b.reason} status=${e.status}`
    );
  });

  t('same-tick double turn never self-collides', (ok) => {
    // Hammer every ordered pair of directions between ticks; the snake must
    // survive all of them (it can only die by hitting a wall much later).
    const dirs = [C.UP, C.DOWN, C.LEFT, C.RIGHT];
    let survived = true;
    for (const a of dirs) {
      for (const b of dirs) {
        const e = new Engine({ seed: 11, wrap: true });
        e.queueDirection(a);
        e.queueDirection(b);
        e.tick();
        e.tick();
        if (e.status !== 'playing') survived = false;
      }
    }
    ok(survived, survived ? '16/16 pairs survived' : 'a direction pair killed the snake');
  });

  /* 2 — food placement. */
  t('food never spawns on the body (400 seeded spawns)', (ok) => {
    // Serpentine body filling eight full rows: 224 of 560 cells occupied.
    const cells = [];
    for (let y = 2; y < 10; y++) {
      for (let i = 0; i < C.GRID_W; i++) {
        const x = y % 2 === 0 ? i : C.GRID_W - 1 - i;
        cells.push({ x, y });
      }
    }
    const e = scenario(cells, C.RIGHT, { seed: 2024 });
    let bad = 0;
    let outside = 0;
    for (let i = 0; i < 400; i++) {
      const f = e._spawnFood();
      e.food = f;
      if (!f) { outside++; continue; }
      if (e.snake.covers(f.x, f.y)) bad++;
      if (f.x < 0 || f.y < 0 || f.x >= C.GRID_W || f.y >= C.GRID_H) outside++;
    }
    ok(bad === 0 && outside === 0, `onBody=${bad} offBoard=${outside}`);
  });

  t('food is not placed on obstacles', (ok) => {
    const e = new Engine({ seed: 5, obstacles: true });
    let bad = 0;
    for (let i = 0; i < 200; i++) {
      const f = e._spawnFood();
      e.food = f;
      if (f && e.obstacleSet.has(key(f.x, f.y))) bad++;
    }
    ok(bad === 0 && e.obstacles.length > 0, `obstacles=${e.obstacles.length} collisions=${bad}`);
  });

  t('same seed reproduces the same food sequence', (ok) => {
    const run = () => {
      const e = new Engine({ seed: 4242 });
      const seq = [];
      for (let i = 0; i < 60; i++) {
        e.tick();
        seq.push(e.food ? `${e.food.x},${e.food.y}` : 'null');
      }
      return seq.join('|');
    };
    const a = run();
    const b = run();
    ok(a === b, a === b ? 'identical' : 'diverged');
  });

  /* 3 — growth. */
  t('eating grows the snake by exactly one segment', (ok) => {
    const cells = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    const e = scenario(cells, C.RIGHT, { food: { x: 11, y: 10 } });
    const before = e.snake.length;
    const score = e.score;
    e.tick();
    const afterEat = e.snake.length;
    e.food = { x: -9, y: -9 };
    e.tick();
    const afterMove = e.snake.length;
    ok(
      afterEat === before + 1 && afterMove === afterEat && e.score === score + C.POINTS_PER_FOOD,
      `${before} -> ${afterEat} -> ${afterMove}, score +${e.score - score}`
    );
  });

  t('bonus food expires on its timer', (ok) => {
    const e = scenario([{ x: 5, y: 5 }, { x: 4, y: 5 }], C.RIGHT);
    e.bonus = { x: 20, y: 15, ttl: 3, maxTtl: 3 };
    e.tick();
    const mid = e.bonus && e.bonus.ttl;
    e.tick();
    e.tick();
    ok(mid === 2 && e.bonus === null, `ttl after 1 tick=${mid}, after 3=${e.bonus}`);
  });

  /* 4 — walls. */
  t('running into a wall ends the game', (ok) => {
    const cells = [
      { x: C.GRID_W - 1, y: 10 },
      { x: C.GRID_W - 2, y: 10 },
      { x: C.GRID_W - 3, y: 10 },
    ];
    const e = scenario(cells, C.RIGHT);
    e.tick();
    ok(e.status === 'lost' && e.deathCause === 'wall', `${e.status}/${e.deathCause}`);
  });

  t('wrap mode carries the snake across the edge', (ok) => {
    const cells = [
      { x: C.GRID_W - 1, y: 10 },
      { x: C.GRID_W - 2, y: 10 },
      { x: C.GRID_W - 3, y: 10 },
    ];
    const e = scenario(cells, C.RIGHT, { wrap: true });
    e.tick();
    ok(
      e.status === 'playing' && e.snake.head.x === 0 && e.snake.head.y === 10,
      `${e.status} head=${e.snake.head.x},${e.snake.head.y}`
    );
  });

  t('hitting an obstacle ends the game', (ok) => {
    const e = scenario([{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], C.RIGHT);
    e.obstacles = [{ x: 6, y: 5 }];
    e.obstacleSet = new Set([key(6, 5)]);
    e.tick();
    ok(e.status === 'lost' && e.deathCause === 'obstacle', `${e.status}/${e.deathCause}`);
  });

  /* 5 — self collision. */
  t('running into your own body ends the game', (ok) => {
    // Head at (5,5); (5,6) is an interior segment, not the tail.
    const cells = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ];
    const e = scenario(cells, C.RIGHT);
    e.queueDirection(C.DOWN);
    e.tick();
    ok(e.status === 'lost' && e.deathCause === 'self', `${e.status}/${e.deathCause}`);
  });

  /* 6 — the tail-chase must stay legal. */
  t('following your own tail does NOT end the game', (ok) => {
    // 2x2 loop: head (6,5) moves left into the tail cell (5,5), which is
    // vacated on the same tick.
    const cells = [
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 5, y: 5 },
    ];
    const e = scenario(cells, C.LEFT);
    e.tick();
    const alive = e.status === 'playing';
    const head = e.snake.head;
    ok(
      alive && head.x === 5 && head.y === 5 && e.snake.length === 4,
      `${e.status} head=${head.x},${head.y} len=${e.snake.length}`
    );
  });

  t('a full tail-chase loop survives many laps', (ok) => {
    const cells = [
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 5, y: 5 },
    ];
    const e = scenario(cells, C.LEFT);
    const turns = [C.LEFT, C.DOWN, C.RIGHT, C.UP];
    for (let lap = 0; lap < 12; lap++) {
      for (const d of turns) {
        e.queueDirection(d);
        e.tick();
        if (e.status !== 'playing') break;
      }
    }
    ok(e.status === 'playing', `status=${e.status} after 12 laps`);
  });

  const failed = results.filter((r) => !r.ok);
  return {
    ok: failed.length === 0,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  };
}
