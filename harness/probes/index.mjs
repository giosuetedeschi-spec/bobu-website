/**
 * Per-game probes. Each receives a Playwright `page` with the game bundle
 * loaded and `window.__GAME__.ready === true`, and returns `{ checks: [...] }`.
 *
 * The generic contract (getState/reset/step/input/actions, determinism,
 * illegal-input rejection) is already asserted by `SiteHarness.checkGame`.
 * These probes assert *behaviour* on top of that.
 */

const ok = (name, cond, detail) => ({ name, ok: !!cond, detail: detail ?? null });

/** Runs the game's own in-bundle rules self-test, if it exposes one. */
async function selftest(page) {
  const result = await page.evaluate(() => {
    const g = window.__GAME__;
    const actions = g.actions?.() ?? [];
    if (!actions.includes("selftest")) return { skipped: true };
    try {
      return { skipped: false, value: g.input("selftest") };
    } catch (e) {
      return { skipped: false, threw: String(e) };
    }
  });

  if (result.skipped) return [ok("exposes a rules selftest", false, "actions() has no 'selftest'")];
  if (result.threw) return [ok("selftest runs", false, result.threw)];

  const v = result.value ?? {};
  // Accept either {ok:true} or {passed:n, failed:0} shaped reports.
  const failed = v.failed ?? (v.failures ? v.failures.length : null);
  const passing = v.ok === true || failed === 0;
  const detail = failed != null ? `passed=${v.passed ?? "?"} failed=${failed}` : JSON.stringify(v).slice(0, 300);
  return [ok("rules selftest passes", passing, detail)];
}

/** Drives a realtime game and asserts the simulation actually advances. */
async function advances(page, { inputs = [], ticks = 120 } = {}) {
  const res = await page.evaluate(({ inputs, ticks }) => {
    const g = window.__GAME__;
    g.reset(11);
    const before = JSON.stringify(g.getState());
    for (const a of inputs) { try { g.input(a); } catch { /* ignore */ } }
    g.step(ticks);
    const after = JSON.stringify(g.getState());
    return { changed: before !== after, status: g.getState().status };
  }, { inputs, ticks });
  return [
    ok(`step(${ticks}) advances the simulation`, res.changed),
    ok("status is a known value", ["idle", "playing", "won", "lost", "draw", "over", "ready", "paused"].includes(res.status), res.status),
  ];
}

/** Different seeds should produce different runs — catches an ignored seed. */
async function seedMatters(page, ticks = 60) {
  const differs = await page.evaluate((t) => {
    const g = window.__GAME__;
    const run = (s) => { g.reset(s); g.step(t); return JSON.stringify(g.getState()); };
    const a = run(1), b = run(2), c = run(3);
    return !(a === b && b === c);
  }, ticks);
  return [ok("different seeds produce different runs", differs)];
}

export const PROBES = {
  async abalone(page) {
    const checks = await selftest(page);
    const r = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(7);
      const s = g.getState();
      const cells = s.board ? (Array.isArray(s.board) ? s.board.flat().filter((c) => c !== null && c !== undefined).length : Object.keys(s.board).length) : 0;
      const bad = g.input("move", { from: [99, 99], to: [98, 98] });
      return { cells, rejectsBadMove: bad?.ok === false, status: s.status };
    });
    checks.push(ok("board has 61 hex cells", r.cells === 61, String(r.cells)));
    checks.push(ok("illegal move rejected", r.rejectsBadMove));
    return { checks };
  },

  async azul(page) {
    const checks = await selftest(page);
    const r = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(7);
      const s = g.getState();
      const factories = s.factories?.length ?? 0;
      const tilesPerFactory = s.factories?.every?.((f) => (f?.tiles?.length ?? f?.length ?? 0) === 4);
      return { factories, tilesPerFactory, status: s.status };
    });
    checks.push(ok("5 factory displays for 2 players", r.factories === 5, String(r.factories)));
    checks.push(ok("each factory starts with 4 tiles", r.tilesPerFactory !== false));
    return { checks };
  },

  async tris(page) {
    const checks = await selftest(page);
    const r = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(3);
      const first = g.input("place", { cell: 0 });
      const second = g.input("place", { cell: 0 });
      return { firstOk: first?.ok !== false, rejectsOccupied: second?.ok === false };
    });
    checks.push(ok("legal placement accepted", r.firstOk));
    checks.push(ok("occupied cell rejected", r.rejectsOccupied));
    return { checks };
  },

  async mastermind(page) {
    const checks = await selftest(page);
    const r = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(5);
      const s = g.getState();
      const guess = g.input("guess", { code: [0, 0, 1, 1] });
      const after = g.getState();
      return {
        hasSecret: s.codeLength > 0 || s.secretLength > 0 || Array.isArray(s.history),
        guessOk: guess?.ok !== false,
        historyGrew: (after.history?.length ?? 0) > (s.history?.length ?? 0),
      };
    });
    checks.push(ok("exposes code/history state", r.hasSecret));
    checks.push(ok("a guess is accepted", r.guessOk));
    checks.push(ok("guess appended to history", r.historyGrew));
    return { checks };
  },

  async snake(page) {
    const checks = await selftest(page);
    checks.push(...(await advances(page, { inputs: ["right"], ticks: 20 })));
    checks.push(...(await seedMatters(page, 40)));
    const noReverse = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(9);
      g.input("right"); g.step(1);
      const before = g.getState();
      g.input("left"); g.step(1);
      const after = g.getState();
      return after.status !== "over" && after.status !== "lost";
    });
    checks.push(ok("instant reversal does not kill the snake", noReverse));
    return { checks };
  },

  async pong(page) {
    const checks = await selftest(page);
    checks.push(...(await advances(page, { ticks: 200 })));
    return { checks };
  },

  async flappy(page) {
    const checks = await selftest(page);
    checks.push(...(await advances(page, { inputs: ["start", "flap"], ticks: 150 })));
    checks.push(...(await seedMatters(page, 90)));
    const falls = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(2);
      g.input("start");
      g.step(600); // no flapping: must eventually hit the ground
      const s = g.getState();
      return s.status === "over" || s.status === "lost";
    });
    checks.push(ok("never flapping ends the run", falls));
    return { checks };
  },

  async breakout(page) {
    const checks = await selftest(page);
    checks.push(...(await advances(page, { inputs: ["launch"], ticks: 200 })));
    const scores = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(4);
      g.input("launch");
      g.step(1500);
      const after = g.getState();
      const n = (s) => (typeof s.score === "number" ? s.score : (s.score?.player ?? 0));
      const bricks = (s) => s.bricks?.filter?.((b) => b && b.hp > 0)?.length ?? s.bricksRemaining ?? null;
      return { scored: n(after) > 0, brokeBricks: bricks(after) === null ? null : bricks(after) < (after.bricksTotal ?? Infinity) };
    });
    checks.push(ok("ball destroys bricks and scores", scores.scored || scores.brokeBricks === true));
    return { checks };
  },

  async mirrordrift(page) {
    const checks = await selftest(page);
    checks.push(...(await advances(page, { inputs: ["left"], ticks: 200 })));
    checks.push(...(await seedMatters(page, 120)));
    return { checks };
  },

  async twins(page) {
    const checks = await selftest(page);
    checks.push(...(await advances(page, { inputs: ["holdLeft"], ticks: 120 })));
    checks.push(...(await seedMatters(page, 200)));
    const mirrored = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(3);
      const before = g.getState().balls.map((b) => b.side);
      g.input("swap");
      const after = g.getState().balls.map((b) => b.side);
      return before[0] !== after[0] && before[1] !== after[1];
    });
    checks.push(ok("a swap crosses both balls over", mirrored));
    return { checks };
  },

  async flip7(page) {
    const checks = await selftest(page);
    const r = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(6);
      const before = g.getState();
      const hit = g.input("hit");
      const after = g.getState();
      const deckOf = (s) => s.deckSize ?? s.deck?.length ?? null;
      return {
        hitOk: hit?.ok !== false,
        deckShrank: deckOf(before) === null ? null : deckOf(after) < deckOf(before),
        deck: deckOf(before),
      };
    });
    checks.push(ok("hit is accepted", r.hitOk));
    checks.push(ok("drawing shrinks the deck", r.deckShrank !== false, `deck=${r.deck}`));
    return { checks };
  },

  async bitwise(page) {
    const checks = await selftest(page);
    const r = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(1);
      const set = g.input("setOperands", { a: 12, b: 10 }) ?? g.input("setOperand", { which: "a", value: 12 });
      g.input("setOperation", { op: "AND" });
      const s = g.getState();
      return { accepted: set?.ok !== false, result: s.result, a: s.a, b: s.b };
    });
    checks.push(ok("operands settable", r.accepted));
    checks.push(ok("12 AND 10 === 8", r.result === 8, `got ${r.result} (a=${r.a}, b=${r.b})`));
    return { checks };
  },

  async mazegen(page) {
    const checks = await selftest(page);
    checks.push(...(await seedMatters(page, 50)));
    const r = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(21);
      g.input("generate");
      g.step(5000); // run the generation animation to completion
      const s = g.getState();
      return { status: s.status, done: s.done ?? s.complete ?? null, cells: s.grid?.length ?? s.cells?.length ?? null };
    });
    checks.push(ok("generation completes", r.done !== false, `status=${r.status}`));
    checks.push(ok("grid is populated", r.cells === null || r.cells > 0, String(r.cells)));
    return { checks };
  },

  async mazesolver(page) {
    const checks = await selftest(page);
    const r = await page.evaluate(() => {
      const g = window.__GAME__;
      g.reset(21);
      g.input("generate");
      g.step(5000);
      g.input("setAlgorithm", { algorithm: "bfs" });
      g.input("solve");
      g.step(20000);
      const s = g.getState();
      return { pathLen: s.path?.length ?? s.stats?.pathLength ?? null, visited: s.visited?.length ?? s.stats?.visited ?? null };
    });
    checks.push(ok("BFS finds a path", r.pathLen > 0, `pathLength=${r.pathLen}`));
    checks.push(ok("solver records visited cells", r.visited > 0, `visited=${r.visited}`));
    return { checks };
  },

  /**
   * Python games: wait for the Pyodide runner to finish and check its output.
   *
   * Pyodide itself is fetched from a CDN at runtime. If the network blocks it
   * (as a sandboxed CI runner does), that is an environment limitation rather
   * than a defect in the game, so the probe reports it as skipped instead of
   * failing the sweep.
   */
  async pyodide(page, spec) {
    const checks = [];

    const cdnBlocked = await page.evaluate(() => !window.loadPyodide).catch(() => true);
    if (cdnBlocked) {
      const reachable = await page.evaluate(async () => {
        try {
          await fetch("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js", { method: "HEAD", mode: "no-cors" });
          return true;
        } catch { return false; }
      }).catch(() => false);
      if (!reachable) {
        return {
          checks: [ok("pyodide CDN reachable (skipped: no network)", true, "cdn.jsdelivr.net unreachable from this runner")],
        };
      }
    }

    const done = await page
      .waitForFunction(
        () => {
          const g = window.__GAME__;
          if (!g) return false;
          const s = g.getState?.();
          return s && (s.status === "over" || s.status === "done" || s.status === "error" || (s.stdout ?? "").length > 0);
        },
        null,
        { timeout: 180000 },
      )
      .then(() => true)
      .catch(() => false);

    checks.push(ok("pyodide run finishes", done));
    if (!done) return { checks };

    const s = await page.evaluate(() => window.__GAME__.getState());
    const out = s.stdout ?? "";
    checks.push(ok("no python traceback", !/Traceback \(most recent call last\)/.test(out), out.slice(-400)));
    checks.push(ok("no ModuleNotFoundError", !/ModuleNotFoundError|ImportError/.test(out)));
    checks.push(ok("produced substantial output", out.length > 200, `${out.length} chars`));
    checks.push(ok("status is not error", s.status !== "error", s.status));
    if (spec?.id === "kalaha") {
      checks.push(ok("kalaha output mentions the board/score", /store|kalah|score|seeds/i.test(out)));
    }
    if (spec?.id === "sudoku") {
      checks.push(ok("sudoku output mentions solving", /solv|puzzle|grid/i.test(out)));
    }
    return { checks };
  },
};
