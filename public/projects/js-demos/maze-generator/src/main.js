/**
 * Maze generator — bootstrap.
 *
 * Owns the grid, the currently selected algorithm, the animation loop and the
 * `window.__GAME__` contract (harness/GAME_API.md). Generation is driven by
 * `algo.step()`, so the harness can run a maze to completion synchronously via
 * `step(n)` without touching requestAnimationFrame.
 */

import { Grid, Rng, analyse, DIRS } from './grid.js';
import { RecursiveBacktracker } from './algorithms/backtracker.js';
import { PrimsAlgorithm } from './algorithms/prims.js';
import { RecursiveDivision } from './algorithms/division.js';
import { Renderer } from './renderer.js';

const ALGORITHMS = {
  backtracker: { label: 'Recursive Backtracker', ctor: RecursiveBacktracker, blurb: 'Carves as deep as it can, then backs up. Long, winding corridors.' },
  prims: { label: "Prim's Algorithm", ctor: PrimsAlgorithm, blurb: 'Grows from a random frontier. Short, bushy branches.' },
  division: { label: 'Recursive Division', ctor: RecursiveDivision, blurb: 'Splits the space with walls, punching one gap per wall. Rooms and corridors.' },
};

const SIZES = { small: 21, medium: 31, large: 41 };

const canvas = document.getElementById('maze-canvas');
const el = {
  algo: document.getElementById('algo-select'),
  size: document.getElementById('size-select'),
  speed: document.getElementById('speed-range'),
  generate: document.getElementById('btn-generate'),
  instant: document.getElementById('btn-instant'),
  png: document.getElementById('btn-export-png'),
  json: document.getElementById('btn-export-json'),
  blurb: document.getElementById('algo-blurb'),
  statCells: document.getElementById('stat-cells'),
  statCarved: document.getElementById('stat-carved'),
  statSteps: document.getElementById('stat-steps'),
  statPerfect: document.getElementById('stat-perfect'),
  toast: document.getElementById('toast'),
};

const renderer = new Renderer(canvas);

let dim = SIZES.medium;
let grid = new Grid(dim, dim);
let algoKey = 'backtracker';
let algo = null;
let seed = 1;
let running = false;
let raf = null;

/* ------------------------------------------------------------------ setup */

function build(nextSeed = seed, key = algoKey) {
  seed = nextSeed >>> 0;
  algoKey = key;
  grid = new Grid(dim, dim);
  algo = new ALGORITHMS[algoKey].ctor(grid, new Rng(seed));
  el.blurb.textContent = ALGORITHMS[algoKey].blurb;
  syncStats();
  renderer.draw(grid, algo);
}

/** Runs the current algorithm to completion without animating. */
function finish(limit = 2_000_000) {
  let n = 0;
  while (algo && !algo.done && n++ < limit) algo.step();
  syncStats();
  renderer.draw(grid, algo);
}

/* ------------------------------------------------------------------ stats */

function syncStats() {
  const a = analyse(grid);
  el.statCells.textContent = String(a.cells);
  el.statCarved.textContent = String(a.edges);
  el.statSteps.textContent = String(algo?.steps ?? 0);
  const label = algo?.done ? (a.perfect ? 'Perfect' : a.connected ? 'Has loops' : 'Disconnected') : 'Carving…';
  el.statPerfect.textContent = label;
  el.statPerfect.dataset.good = String(!!algo?.done && a.perfect);
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.toast.classList.remove('show'), 2200);
}

/* ------------------------------------------------------------------- loop */

function stop() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  el.generate.textContent = 'Generate';
}

function animate() {
  if (!running) return;
  // The slider is "steps per frame": low = contemplative, high = brisk.
  const perFrame = Number(el.speed.value);
  for (let i = 0; i < perFrame && !algo.done; i++) algo.step();
  syncStats();
  renderer.draw(grid, algo);
  if (algo.done) {
    stop();
    toast(analyse(grid).perfect ? 'Perfect maze — every cell reachable, no loops.' : 'Generation finished.');
    return;
  }
  raf = requestAnimationFrame(animate);
}

function generate() {
  if (running) { stop(); return; }
  build((Math.random() * 0xffffffff) >>> 0, el.algo.value);
  running = true;
  el.generate.textContent = 'Stop';
  raf = requestAnimationFrame(animate);
}

/* ------------------------------------------------------------------ export */

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Wall bitmask per cell — enough to reconstruct the maze exactly. */
function toJson() {
  const rows = [];
  for (let y = 0; y < grid.rows; y++) {
    const row = [];
    for (let x = 0; x < grid.cols; x++) row.push(grid.open[grid.idx(x, y)]);
    rows.push(row);
  }
  return JSON.stringify({ cols: grid.cols, rows: grid.rows, seed, algorithm: algoKey, open: rows, dirs: DIRS.map((d) => d.name) });
}

/* ----------------------------------------------------------------- events */

el.generate.addEventListener('click', generate);
el.instant.addEventListener('click', () => {
  stop();
  build((Math.random() * 0xffffffff) >>> 0, el.algo.value);
  finish();
  toast(analyse(grid).perfect ? 'Perfect maze.' : 'Generation finished.');
});
el.algo.addEventListener('change', () => { stop(); build(seed, el.algo.value); });
el.size.addEventListener('change', () => {
  stop();
  dim = SIZES[el.size.value] ?? SIZES.medium;
  build(seed, el.algo.value);
});
el.png.addEventListener('click', () => {
  const a = document.createElement('a');
  a.download = `maze-${algoKey}-${seed}.png`;
  a.href = canvas.toDataURL();
  a.click();
});
el.json.addEventListener('click', () => download(toJson(), `maze-${algoKey}-${seed}.json`, 'application/json'));

const onResize = () => renderer.draw(grid, algo);
window.addEventListener('resize', onResize);
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(onResize).observe(canvas.parentElement);

/* ------------------------------------------------------- harness contract */

/**
 * Proves the defining property of a perfect maze across every algorithm and a
 * spread of seeds: every cell reachable (connected) and exactly cells-1
 * passages (acyclic).
 */
function runSelfTest() {
  const results = [];
  const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail: String(detail) }); return !!ok; };

  for (const key of Object.keys(ALGORITHMS)) {
    let allPerfect = true;
    let worst = '';
    for (let s = 1; s <= 12; s++) {
      const g = new Grid(21, 21);
      const a = new ALGORITHMS[key].ctor(g, new Rng(s));
      let guard = 0;
      while (!a.done && guard++ < 500000) a.step();
      const stats = analyse(g);
      if (!stats.perfect) {
        allPerfect = false;
        worst = `seed ${s}: connected=${stats.connected} edges=${stats.edges} cells=${stats.cells}`;
        break;
      }
    }
    check(`${ALGORITHMS[key].label} produces a perfect maze over 12 seeds`, allPerfect, worst);
  }

  // Determinism: identical seed must reproduce the maze bit for bit.
  const run = (s) => {
    const g = new Grid(21, 21);
    const a = new RecursiveBacktracker(g, new Rng(s));
    let guard = 0;
    while (!a.done && guard++ < 500000) a.step();
    return g.open.join(',');
  };
  check('same seed reproduces the same maze', run(7) === run(7));
  check('different seeds produce different mazes', run(7) !== run(8));

  const passed = results.filter((r) => r.ok).length;
  return { ok: passed === results.length, passed, failed: results.length - passed, total: results.length, results };
}

window.__GAME__ = {
  id: 'maze-generator',
  version: 1,
  ready: true,
  meta: { name: 'Maze Generator', players: '0', mode: 'visualiser' },

  getState() {
    const stats = analyse(grid);
    return {
      status: algo?.done ? 'done' : 'playing',
      turn: null,
      score: stats.edges,
      algorithm: algoKey,
      seed,
      done: !!algo?.done,
      steps: algo?.steps ?? 0,
      grid: { cols: grid.cols, rows: grid.rows, open: Array.from(grid.open) },
      cells: stats.cells,
      stats,
    };
  },

  // A generator's resting state is a finished maze; watching it get carved is
  // the separate `generate` action.
  reset(s = 1) {
    stop();
    build(s >>> 0, algoKey);
    finish();
  },

  step(n = 1) {
    if (!algo) return;
    for (let i = 0; i < n && !algo.done; i++) algo.step();
    syncStats();
    renderer.draw(grid, algo);
  },

  input(action, payload) {
    switch (action) {
      case 'generate':
        stop();
        build(payload?.seed ?? seed, payload?.algorithm ?? algoKey);
        return { ok: true };
      case 'finish':
        finish();
        return { ok: true, stats: analyse(grid) };
      case 'setAlgorithm': {
        const key = payload?.algorithm ?? payload;
        if (!ALGORITHMS[key]) return { ok: false, reason: `unknown algorithm '${key}'` };
        stop();
        el.algo.value = key;
        build(seed, key);
        return { ok: true };
      }
      case 'setSize': {
        const key = payload?.size ?? payload;
        if (!SIZES[key]) return { ok: false, reason: `unknown size '${key}'` };
        dim = SIZES[key];
        el.size.value = key;
        build(seed, algoKey);
        return { ok: true };
      }
      case 'selftest':
        return runSelfTest();
      default:
        return { ok: false, reason: `unknown action '${action}'` };
    }
  },

  actions: () => ['generate', 'finish', 'setAlgorithm', 'setSize', 'selftest'],
};

/* --------------------------------------------------------------------- go */

build(1, 'backtracker');
finish();
