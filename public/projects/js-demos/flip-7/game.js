/**
 * Flip 7 — bootstrap.
 *
 * Connects the rules engine to the view, paces the AI seats with a timer, and
 * publishes the `window.__GAME__` contract (harness/GAME_API.md).
 *
 * All rules live in src/engine.js. This file only decides *when* the engine is
 * allowed to take its next self-driven step, so the harness can bypass the
 * timer entirely and call `step(n)` synchronously.
 */

import { Flip7Engine } from './src/engine.js';
import { runSelfTest } from './src/selftest.js';
import { render, controls, askChoice, closeModal, showRoundEnd, showGameOver } from './src/ui.js';

const AI_DELAY_MS = 620;

const engine = new Flip7Engine({ seed: (Date.now() >>> 0) || 1 });

let timer = null;
let modalShown = null; // which blocking modal is currently up, if any

/* ------------------------------------------------------------------ paint */

function paint() {
  const state = engine.toState();
  render(state);

  // Exactly one blocking modal at a time, and only when the human must decide.
  if (state.phase === 'gameover') {
    if (modalShown !== 'over') { modalShown = 'over'; showGameOver(state, () => newGame()); }
    return;
  }
  if (state.pendingChoice && state.pendingChoice.chooser === 0) {
    if (modalShown !== 'choice') {
      modalShown = 'choice';
      askChoice(state, (target) => {
        closeModal();
        modalShown = null;
        engine.applyChoice(target);
        paint();
        pump();
      });
    }
    return;
  }
  if (state.phase === 'roundend') {
    if (modalShown !== 'round') {
      modalShown = 'round';
      showRoundEnd(state, () => {
        closeModal();
        modalShown = null;
        engine.advance(); // roundend -> beginRound
        paint();
        pump();
      });
    }
    return;
  }

  if (modalShown) { closeModal(); modalShown = null; }
}

/* ------------------------------------------------------------------- pump */

function stopPump() {
  if (timer) clearTimeout(timer);
  timer = null;
}

/** Lets the engine take its own steps, one every AI_DELAY_MS, while it is busy. */
function pump() {
  stopPump();
  const state = engine.toState();
  if (state.phase === 'gameover' || state.phase === 'roundend') return;
  if (state.pendingChoice && state.pendingChoice.chooser === 0) return;
  if (!engine.busy) return;

  timer = setTimeout(() => {
    engine.advance();
    paint();
    pump();
  }, AI_DELAY_MS);
}

function newGame(seed) {
  stopPump();
  closeModal();
  modalShown = null;
  engine.reset(seed ?? ((Math.random() * 0xffffffff) >>> 0));
  paint();
  pump();
}

/* --------------------------------------------------------------- controls */

controls.onHit(() => {
  const r = engine.hit();
  if (r.ok) { paint(); pump(); }
});

controls.onStay(() => {
  const r = engine.stay();
  if (r.ok) { paint(); pump(); }
});

controls.onNewGame(() => newGame());

window.addEventListener('keydown', (e) => {
  if (e.key === 'h' || e.key === 'H') controlsClick(engine.hit());
  if (e.key === 's' || e.key === 'S') controlsClick(engine.stay());
});

function controlsClick(result) {
  if (result?.ok) { paint(); pump(); }
}

/* ------------------------------------------------------- harness contract */

const ACTIONS = ['hit', 'stay', 'choose', 'advance', 'restart', 'selftest'];

window.__GAME__ = {
  id: 'flip-7',
  version: 1,
  ready: true,
  meta: { name: 'Flip 7', players: '1 + 3 AI', mode: 'turn-based' },

  getState() {
    return engine.toState();
  },

  /**
   * Deals the opening round and runs the AI seats up to the human's first
   * decision, so a reset lands on a position a player could actually be
   * looking at rather than on an empty table mid-deal.
   */
  reset(seed = 1) {
    stopPump();
    closeModal();
    modalShown = null;
    engine.reset(seed >>> 0);
    engine.step(40);
    render(engine.toState());
  },

  /**
   * Advance the engine's own work. Deliberately does NOT paint modals: the
   * harness drives the machine, and a blocking modal would stall it on a
   * human choice that no one is there to make.
   */
  step(n = 1) {
    const moved = engine.step(n);
    render(engine.toState());
    return moved;
  },

  input(action, payload) {
    switch (action) {
      case 'hit': {
        const r = engine.hit();
        paint();
        if (r.ok) pump();
        return r;
      }
      case 'stay': {
        const r = engine.stay();
        paint();
        if (r.ok) pump();
        return r;
      }
      case 'choose': {
        const target = payload?.target ?? payload;
        if (!engine.pendingChoice) return { ok: false, reason: 'no action card is waiting on a target' };
        if (typeof target !== 'number') return { ok: false, reason: 'choose needs { target: <player index> }' };
        if (!engine.pendingChoice.candidates.includes(target)) {
          return { ok: false, reason: `player ${target} is not a legal target` };
        }
        engine.applyChoice(target);
        paint();
        pump();
        return { ok: true };
      }
      case 'advance': {
        const moved = engine.step(payload?.n ?? 1);
        render(engine.toState());
        return { ok: true, moved };
      }
      case 'restart':
        this.reset(payload?.seed ?? engine.seed);
        return { ok: true };
      case 'selftest':
        return runSelfTest(window.__GAME__);
      default:
        return { ok: false, reason: `unknown action '${action}'` };
    }
  },

  actions: () => ACTIONS.slice(),
};

/* --------------------------------------------------------------------- go */

paint();
pump();
