/**
 * Maze solver — bootstrap, renderer and harness contract.
 *
 * The maze comes from the same recursive-backtracker generator the maze
 * generator demo uses, so every maze here is perfect: exactly one path between
 * any two cells. That is what makes the DFS-vs-BFS-vs-A* comparison honest —
 * they are all solving the same instance.
 */

import { Grid, Rng, DIRS } from './grid.js';
import { RecursiveBacktracker } from './algorithms/backtracker.js';
import { ALGORITHMS, shortestDistance, pathIsLegal } from './algorithms/search.js';

const DIM = 31;

const PALETTE = {
  bg: '#0b1020',
  board: '#0e1426',
  cell: '#141c30',
  visited: 'rgba(56, 189, 248, 0.30)',
  frontier: 'rgba(251, 191, 36, 0.55)',
  path: '#f472b6',
  start: '#34d399',
  goal: '#fb7185',
  cursor: '#ffffff',
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const el = (id) => document.getElementById(id);
const dom = {
  algo: el('algo-select'),
  speed: el('speed-range'),
  solve: el('btn-solve'),
  clear: el('btn-clear'),
  newMaze: el('btn-new'),
  blurb: el('algo-blurb'),
  visited: el('stat-visited'),
  frontier: el('stat-frontier'),
  path: el('stat-path'),
  optimal: el('stat-optimal'),
  table: el('compare-table').querySelector('tbody'),
  note: el('compare-note'),
  toast: el('toast'),
};

let grid = new Grid(DIM, DIM);
let seed = 1;
let start = 0;
let goal = 0;
let search = null;
let algoKey = 'bfs';
let raf = null;
let running = false;

/* ------------------------------------------------------------------ maze */

function buildMaze(nextSeed) {
  seed = nextSeed >>> 0 || 1;
  grid = new Grid(DIM, DIM);
  const gen = new RecursiveBacktracker(grid, new Rng(seed));
  let guard = 0;
  while (!gen.done && guard++ < 1_000_000) gen.step();
  start = grid.idx(0, 0);
  goal = grid.idx(DIM - 1, DIM - 1);
  search = null;
  clearCompare();
  syncStats();
  draw();
}

/* --------------------------------------------------------------- solving */

function newSearch(key = algoKey) {
  algoKey = key;
  dom.blurb.textContent = ALGORITHMS[algoKey].blurb;
  search = new ALGORITHMS[algoKey].ctor(grid, start, goal);
  syncStats();
}

function finishSearch(limit = 500_000) {
  if (!search) newSearch();
  let guard = 0;
  while (!search.done && guard++ < limit) search.step();
  syncStats();
  draw();
  return search;
}

function stop() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  dom.solve.textContent = 'Solve';
}

function animate() {
  if (!running) return;
  const perFrame = Number(dom.speed.value);
  for (let i = 0; i < perFrame && !search.done; i++) search.step();
  syncStats();
  draw();
  if (search.done) {
    stop();
    recordCompare();
    const d = shortestDistance(grid, start, goal);
    const optimal = search.path.length - 1 === d;
    toast(search.found
      ? `${ALGORITHMS[algoKey].label}: ${search.path.length - 1} steps, ${search.visitedCount} cells visited${optimal ? ' — shortest' : ` — ${search.path.length - 1 - d} longer than shortest`}`
      : 'No path found.');
  } else {
    raf = requestAnimationFrame(animate);
  }
}

function solve() {
  if (running) { stop(); return; }
  newSearch(dom.algo.value);
  running = true;
  dom.solve.textContent = 'Stop';
  raf = requestAnimationFrame(animate);
}

/* ----------------------------------------------------------------- stats */

function syncStats() {
  if (!search) {
    dom.visited.textContent = '—';
    dom.frontier.textContent = '—';
    dom.path.textContent = '—';
    dom.optimal.textContent = '—';
    dom.optimal.dataset.good = 'false';
    return;
  }
  dom.visited.textContent = String(search.visitedCount);
  dom.frontier.textContent = String(search.frontier.length);
  dom.path.textContent = search.done ? String(Math.max(0, search.path.length - 1)) : '—';
  if (search.done) {
    const d = shortestDistance(grid, start, goal);
    const optimal = search.found && search.path.length - 1 === d;
    dom.optimal.textContent = optimal ? 'Shortest' : search.found ? `+${search.path.length - 1 - d}` : 'No path';
    dom.optimal.dataset.good = String(optimal);
  } else {
    dom.optimal.textContent = '—';
    dom.optimal.dataset.good = 'false';
  }
}

function clearCompare() {
  dom.table.replaceChildren();
  dom.note.textContent = 'Solve to fill this in.';
}

/** Runs all three on the current maze so the trade-off is visible at a glance. */
function recordCompare() {
  const d = shortestDistance(grid, start, goal);
  const rows = [];
  for (const [key, spec] of Object.entries(ALGORITHMS)) {
    const s = new spec.ctor(grid, start, goal);
    let guard = 0;
    while (!s.done && guard++ < 500_000) s.step();
    rows.push({ key, label: spec.label, visited: s.visitedCount, path: s.path.length - 1 });
  }
  dom.table.replaceChildren(...rows.map((r) => {
    const tr = document.createElement('tr');
    if (r.key === algoKey) tr.className = 'current';
    tr.innerHTML = `<td>${r.label.replace(' (Manhattan)', '')}</td><td>${r.visited}</td>`
      + `<td class="${r.path === d ? 'best' : ''}">${r.path}</td>`;
    return tr;
  }));
  dom.note.textContent = `Shortest possible: ${d} steps.`;
}

function toast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => dom.toast.classList.remove('show'), 3200);
}

/* ---------------------------------------------------------------- render */

let cell = 10, ox = 0, oy = 0, dpr = 1, cssW = 0, cssH = 0;

function layout() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const rect = canvas.getBoundingClientRect();
  cssW = Math.max(120, Math.round(rect.width || 640));
  cssH = Math.max(120, Math.round(rect.height || 480));
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const pad = 10;
  cell = Math.max(3, Math.floor(Math.min((cssW - pad * 2) / DIM, (cssH - pad * 2) / DIM)));
  ox = Math.round((cssW - cell * DIM) / 2);
  oy = Math.round((cssH - cell * DIM) / 2);
}

function fillCell(i, color, shrink = 0) {
  const x = ox + grid.xOf(i) * cell + shrink;
  const y = oy + grid.yOf(i) * cell + shrink;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, cell - shrink * 2, cell - shrink * 2);
}

function draw() {
  layout();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const inset = Math.max(0.5, cell * 0.16);
  const w = cell - inset * 2;

  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(ox - 6, oy - 6, cell * DIM + 12, cell * DIM + 12);

  // Passages.
  for (let i = 0; i < grid.size; i++) {
    const px = ox + grid.xOf(i) * cell + inset;
    const py = oy + grid.yOf(i) * cell + inset;
    ctx.fillStyle = PALETTE.cell;
    ctx.fillRect(px, py, w, w);
    if (grid.open[i] & DIRS[1].bit) ctx.fillRect(px + w, py, inset * 2, w);
    if (grid.open[i] & DIRS[2].bit) ctx.fillRect(px, py + w, w, inset * 2);
  }

  if (search) {
    // Expanded cells, then the frontier on top of them.
    ctx.fillStyle = PALETTE.visited;
    for (let i = 0; i < grid.size; i++) {
      if (!search.expanded[i]) continue;
      const px = ox + grid.xOf(i) * cell + inset;
      const py = oy + grid.yOf(i) * cell + inset;
      ctx.fillRect(px, py, w, w);
      if (grid.open[i] & DIRS[1].bit && search.expanded[i + 1]) ctx.fillRect(px + w, py, inset * 2, w);
      if (grid.open[i] & DIRS[2].bit && search.expanded[i + DIM]) ctx.fillRect(px, py + w, w, inset * 2);
    }

    ctx.fillStyle = PALETTE.frontier;
    for (const i of search.frontier) fillCell(i, PALETTE.frontier, inset);

    // The path, drawn as a continuous ribbon.
    if (search.path.length > 1) {
      ctx.strokeStyle = PALETTE.path;
      ctx.lineWidth = Math.max(1.5, cell * 0.34);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = PALETTE.path;
      ctx.shadowBlur = cell * 0.8;
      ctx.beginPath();
      search.path.forEach((i, k) => {
        const cx = ox + grid.xOf(i) * cell + cell / 2;
        const cy = oy + grid.yOf(i) * cell + cell / 2;
        if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (!search.done && search.current >= 0) fillCell(search.current, PALETTE.cursor, inset);
  }

  fillCell(start, PALETTE.start, inset);
  fillCell(goal, PALETTE.goal, inset);
}

/* ---------------------------------------------------------------- events */

dom.solve.addEventListener('click', solve);
dom.clear.addEventListener('click', () => { stop(); search = null; clearCompare(); syncStats(); draw(); });
dom.newMaze.addEventListener('click', () => { stop(); buildMaze((Math.random() * 0xffffffff) >>> 0); });
dom.algo.addEventListener('change', () => { stop(); newSearch(dom.algo.value); draw(); });

const onResize = () => draw();
window.addEventListener('resize', onResize);
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(onResize).observe(canvas.parentElement);

/* ------------------------------------------------------- harness contract */

/**
 * The claims worth proving: BFS and A* really do return shortest paths, every
 * returned path is legal (no walking through walls), and DFS finds a path even
 * though it is usually longer.
 */
function runSelfTest() {
  const results = [];
  const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail: String(detail) }); };

  let bfsBad = '', astarBad = '', dfsBad = '', illegal = '';
  let dfsLonger = 0;

  for (let s = 1; s <= 10; s++) {
    const g = new Grid(21, 21);
    const gen = new RecursiveBacktracker(g, new Rng(s));
    let guard = 0;
    while (!gen.done && guard++ < 500000) gen.step();
    const a = g.idx(0, 0);
    const b = g.idx(20, 20);
    const best = shortestDistance(g, a, b);

    const run = (key) => {
      const search = new ALGORITHMS[key].ctor(g, a, b);
      let n = 0;
      while (!search.done && n++ < 500000) search.step();
      return search;
    };

    const bfs = run('bfs');
    const astar = run('astar');
    const dfs = run('dfs');

    if (bfs.path.length - 1 !== best) bfsBad ||= `seed ${s}: ${bfs.path.length - 1} vs ${best}`;
    if (astar.path.length - 1 !== best) astarBad ||= `seed ${s}: ${astar.path.length - 1} vs ${best}`;
    if (!dfs.found) dfsBad ||= `seed ${s}: no path`;
    for (const [key, search] of [['bfs', bfs], ['astar', astar], ['dfs', dfs]]) {
      if (!pathIsLegal(g, search.path, a, b)) illegal ||= `${key} on seed ${s}`;
    }
    if (dfs.path.length - 1 > best) dfsLonger++;
  }

  check('BFS returns a shortest path on 10 seeded mazes', !bfsBad, bfsBad);
  check('A* returns a shortest path on 10 seeded mazes', !astarBad, astarBad);
  check('DFS always finds a path', !dfsBad, dfsBad);
  check('every returned path is contiguous and never crosses a wall', !illegal, illegal);
  // A perfect maze has exactly one route between any two cells, so all three
  // searches must return that same route. The difference between them is not
  // the path -- it is how much of the maze they had to look at to find it.
  check('on a perfect maze every algorithm returns the same unique path', dfsLonger === 0, `${dfsLonger}/10 mazes differed`);

  // A* should not expand more than BFS on the same maze.
  const g = new Grid(21, 21);
  const gen = new RecursiveBacktracker(g, new Rng(3));
  let guard = 0;
  while (!gen.done && guard++ < 500000) gen.step();
  const a = g.idx(0, 0), b = g.idx(20, 20);
  const runN = (key) => {
    const s = new ALGORITHMS[key].ctor(g, a, b);
    let n = 0;
    while (!s.done && n++ < 500000) s.step();
    return s.visitedCount;
  };
  check('A* expands no more cells than BFS', runN('astar') <= runN('bfs'), `${runN('astar')} vs ${runN('bfs')}`);

  const passed = results.filter((r) => r.ok).length;
  return { ok: passed === results.length, passed, failed: results.length - passed, total: results.length, results };
}

window.__GAME__ = {
  id: 'maze-solver',
  version: 1,
  ready: true,
  meta: { name: 'Maze Solver', players: '0', mode: 'visualiser' },

  getState() {
    return {
      status: search?.done ? 'done' : search ? 'playing' : 'idle',
      turn: null,
      score: search?.visitedCount ?? 0,
      algorithm: algoKey,
      seed,
      start,
      goal,
      done: !!search?.done,
      found: !!search?.found,
      visited: search?.visitedCount ?? 0,
      frontier: search ? search.frontier.length : 0,
      path: search ? search.path.slice() : [],
      shortest: shortestDistance(grid, start, goal),
      grid: { cols: grid.cols, rows: grid.rows },
      stats: {
        visited: search?.visitedCount ?? 0,
        pathLength: search ? Math.max(0, search.path.length - 1) : 0,
        steps: search?.steps ?? 0,
      },
    };
  },

  // A solver's resting state is a solved maze, so the state is worth reading.
  reset(s = 1) {
    stop();
    buildMaze(s >>> 0);
    newSearch(algoKey);
    finishSearch();
    recordCompare();
  },

  step(n = 1) {
    if (!search) newSearch();
    for (let i = 0; i < n && !search.done; i++) search.step();
    syncStats();
    draw();
  },

  input(action, payload) {
    switch (action) {
      case 'generate':
        stop();
        buildMaze(payload?.seed ?? seed);
        return { ok: true, seed };
      case 'solve':
        stop();
        newSearch(payload?.algorithm ?? algoKey);
        finishSearch();
        recordCompare();
        return { ok: true, pathLength: search.path.length - 1, visited: search.visitedCount };
      case 'setAlgorithm': {
        const key = payload?.algorithm ?? payload;
        if (!ALGORITHMS[key]) return { ok: false, reason: `unknown algorithm '${key}'` };
        stop();
        dom.algo.value = key;
        newSearch(key);
        draw();
        return { ok: true, algorithm: key };
      }
      case 'clear':
        stop();
        search = null;
        clearCompare();
        syncStats();
        draw();
        return { ok: true };
      case 'selftest':
        return runSelfTest();
      default:
        return { ok: false, reason: `unknown action '${action}'` };
    }
  },

  actions: () => ['generate', 'solve', 'setAlgorithm', 'clear', 'selftest'],
};

/* --------------------------------------------------------------------- go */

dom.blurb.textContent = ALGORITHMS[algoKey].blurb;
buildMaze(1);
newSearch('bfs');
finishSearch();
recordCompare();
