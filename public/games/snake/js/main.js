/**
 * Snake — bootstrap.
 *
 * Wires the deterministic Engine to the canvas Renderer, the DOM HUD and the
 * keyboard/touch controls, and publishes the `window.__GAME__` contract that
 * the headless harness drives (see harness/GAME_API.md).
 *
 * The render loop is a fixed-timestep accumulator: rendering interpolates
 * between ticks, but every rule runs inside `Engine.tick()`, which the harness
 * can also call directly and synchronously.
 */

import * as C from './constants.js';
import { Engine } from './engine.js';
import { Renderer } from './renderer.js';
import { runSelfTest } from './selftest.js';

const canvas = document.getElementById('game-canvas');
const engine = new Engine({ seed: (Date.now() >>> 0) || 1 });
const renderer = new Renderer(canvas);

const el = {
  score: document.getElementById('score'),
  best: document.getElementById('best'),
  length: document.getElementById('length'),
  speed: document.getElementById('speed-readout'),
  overlay: document.getElementById('overlay'),
  overlayTitle: document.getElementById('overlay-title'),
  overlayText: document.getElementById('overlay-text'),
  overlayAction: document.getElementById('overlay-action'),
  restart: document.getElementById('btn-restart'),
  wrap: document.getElementById('toggle-wrap'),
  obstacles: document.getElementById('toggle-obstacles'),
};

/* ------------------------------------------------------------------ storage */
// localStorage throws in a sandboxed iframe; the game must not care.

function safeGet(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode or sandboxed iframe — high scores just don't persist */
  }
}

let best = Number(safeGet(C.STORAGE_KEY, '0')) || 0;

let settings = { wrap: false, obstacles: false };
try {
  settings = { ...settings, ...JSON.parse(safeGet(C.SETTINGS_KEY, '{}')) };
} catch {
  /* corrupt settings — fall back to defaults */
}
engine.mode.wrap = settings.wrap;
engine.mode.obstacles = settings.obstacles;

/* ------------------------------------------------------------------- state */

// "ready" gates the very first tick so the board is visible before it moves.
let phase = 'ready';

function newRun(seed) {
  engine.reset(seed ?? ((Math.random() * 0xffffffff) >>> 0), settings);
  phase = 'ready';
  renderer.particles.length = 0;
  renderer.shake = 0;
  syncHud();
  showOverlay('ready');
}

/* -------------------------------------------------------------------- HUD */

function syncHud() {
  const s = engine.getState();
  el.score.textContent = String(s.score);
  el.best.textContent = String(best);
  el.length.textContent = String(s.length);
  const pace = Math.round((C.TICK_MS_START / s.tickMs) * 100);
  el.speed.textContent = `Speed ${pace}%`;
  el.wrap.setAttribute('aria-pressed', String(settings.wrap));
  el.obstacles.setAttribute('aria-pressed', String(settings.obstacles));
}

const OVERLAY_COPY = {
  ready: {
    title: 'Snake',
    text: 'Eat to grow. Don’t bite yourself.',
    action: 'Play',
  },
  paused: { title: 'Paused', text: 'Take your time.', action: 'Resume' },
  lost: { title: 'Game over', text: '', action: 'Play again' },
  won: { title: 'Board cleared', text: 'There is nowhere left to put food. Remarkable.', action: 'Play again' },
};

const DEATH_TEXT = {
  wall: 'You drove into the wall.',
  self: 'You bit your own tail.',
  obstacle: 'You hit an obstacle.',
};

function showOverlay(state) {
  const copy = OVERLAY_COPY[state];
  if (!copy) return;
  const s = engine.getState();
  el.overlay.dataset.state = state;
  el.overlay.hidden = false;
  el.overlayTitle.textContent = copy.title;
  el.overlayText.textContent =
    state === 'lost'
      ? `${DEATH_TEXT[s.deathCause] ?? 'You crashed.'} Score ${s.score}${s.score >= best && s.score > 0 ? ' — new best!' : ''}`
      : copy.text;
  el.overlayAction.textContent = copy.action;
}

function hideOverlay() {
  el.overlay.hidden = true;
}

/* ------------------------------------------------------------------ events */

function onTickEvents(events) {
  for (const e of events) {
    if (e === 'eat' && engine.food) renderer.burst(engine.snake.head, C.PALETTE.food, 14);
    if (e === 'bonus') {
      renderer.burst(engine.snake.head, C.PALETTE.bonus, 26);
      renderer.kick(1.4);
    }
    if (e === 'dead') {
      renderer.burst(engine.snake.head, C.PALETTE.danger, 30);
      renderer.kick(2.2);
    }
  }
  if (engine.status === 'lost' || engine.status === 'won') {
    if (engine.score > best) {
      best = engine.score;
      safeSet(C.STORAGE_KEY, String(best));
    }
    phase = engine.status;
    showOverlay(engine.status);
  }
  syncHud();
}

/** One logical step, plus the presentation side effects it triggers. */
function advance() {
  const events = engine.tick();
  if (events.length) onTickEvents(events);
  else syncHud();
}

/* -------------------------------------------------------------------- loop */

let acc = 0;
let last = performance.now();

function frame(now) {
  const dt = Math.min(now - last, 250); // a backgrounded tab must not fast-forward
  last = now;

  if (phase === 'playing' && !engine.paused) {
    acc += dt;
    let guard = 0;
    while (acc >= engine.tickMs && guard++ < 8) {
      acc -= engine.tickMs;
      advance();
      if (phase !== 'playing') { acc = 0; break; }
    }
  } else {
    acc = 0;
  }

  const alpha = phase === 'playing' && !engine.paused ? Math.min(1, acc / engine.tickMs) : 1;
  renderer.draw(engine, alpha, now, dt);
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ input */

const KEY_DIRECTIONS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', a: 'left', s: 'down', d: 'right',
  W: 'up', A: 'left', S: 'down', D: 'right',
};

function start() {
  if (phase === 'ready') {
    phase = 'playing';
    last = performance.now();
    acc = 0;
    hideOverlay();
  } else if (phase === 'playing' && engine.paused) {
    engine.setPaused(false);
    last = performance.now();
    hideOverlay();
  }
}

function steer(name) {
  const dir = C.DIRECTIONS[name];
  if (!dir) return { ok: false, reason: `unknown direction '${name}'` };
  start();
  return engine.queueDirection(dir);
}

function togglePause() {
  if (phase !== 'playing') return { ok: false, reason: `game is ${phase}` };
  const r = engine.setPaused();
  if (engine.paused) showOverlay('paused');
  else { last = performance.now(); hideOverlay(); }
  return r;
}

window.addEventListener('keydown', (e) => {
  const dir = KEY_DIRECTIONS[e.key];
  if (dir) {
    e.preventDefault();
    steer(dir);
    return;
  }
  if (e.key === ' ') {
    e.preventDefault();
    if (phase === 'ready') start();
    else if (phase === 'lost' || phase === 'won') newRun();
    else togglePause();
  }
  if (e.key === 'r' || e.key === 'R') newRun();
});

// Touch: a swipe of at least 24px picks the dominant axis.
let touchStart = null;
canvas.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
    if (phase === 'lost' || phase === 'won') newRun();
    else start();
    return;
  }
  steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
}, { passive: true });

el.overlayAction.addEventListener('click', () => {
  if (phase === 'lost' || phase === 'won') newRun();
  else start();
});
el.restart.addEventListener('click', () => newRun());

function toggleSetting(name) {
  settings[name] = !settings[name];
  safeSet(C.SETTINGS_KEY, JSON.stringify(settings));
  newRun();
}
el.wrap.addEventListener('click', () => toggleSetting('wrap'));
el.obstacles.addEventListener('click', () => toggleSetting('obstacles'));

const onResize = () => renderer.resize();
window.addEventListener('resize', onResize);
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(onResize).observe(canvas.parentElement);

/* ------------------------------------------------------- harness contract */

const ACTIONS = ['up', 'down', 'left', 'right', 'pause', 'resume', 'start', 'restart', 'setMode', 'selftest'];

window.__GAME__ = {
  id: 'snake',
  version: 1,
  ready: true,
  meta: { name: 'Snake', players: '1', mode: 'realtime' },

  getState() {
    return { ...engine.getState(), phase, best };
  },

  reset(seed = 1) {
    settings = { ...settings };
    engine.reset(seed >>> 0, settings);
    // The harness drives ticks itself, so a reset lands straight in play.
    phase = 'playing';
    renderer.particles.length = 0;
    renderer.shake = 0;
    hideOverlay();
    syncHud();
  },

  step(n = 1) {
    for (let i = 0; i < n; i++) {
      if (engine.status !== 'playing') break;
      const events = engine.tick();
      if (events.includes('dead')) {
        if (engine.score > best) { best = engine.score; safeSet(C.STORAGE_KEY, String(best)); }
        phase = engine.status;
      }
    }
    syncHud();
  },

  input(action, payload) {
    switch (action) {
      case 'up': case 'down': case 'left': case 'right':
        return engine.queueDirection(C.DIRECTIONS[action]);
      case 'start':
        start();
        return { ok: true };
      case 'pause':
        return engine.setPaused(true);
      case 'resume':
        return engine.setPaused(false);
      case 'restart':
        this.reset(payload?.seed ?? engine.seed);
        return { ok: true };
      case 'setMode': {
        if (!payload || (payload.wrap === undefined && payload.obstacles === undefined)) {
          return { ok: false, reason: 'setMode needs { wrap } and/or { obstacles }' };
        }
        if (payload.wrap !== undefined) settings.wrap = !!payload.wrap;
        if (payload.obstacles !== undefined) settings.obstacles = !!payload.obstacles;
        engine.reset(engine.seed, settings);
        syncHud();
        return { ok: true, mode: { ...settings } };
      }
      case 'selftest':
        return runSelfTest();
      default:
        return { ok: false, reason: `unknown action '${action}'` };
    }
  },

  actions: () => ACTIONS.slice(),
};

/* ------------------------------------------------------------------- go */

syncHud();
showOverlay('ready');
requestAnimationFrame(frame);
