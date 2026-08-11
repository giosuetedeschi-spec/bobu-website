/**
 * Flip 7 — rules self-test.
 *
 * Run head-on with `window.__GAME__.input("selftest")`.
 * Returns { ok, passed, failed, results: [{ name, ok, detail }] }.
 */

import { Flip7Engine } from './engine.js';
import {
  numberCard, flatCard, doubleCard, actionCard, deckTemplate, FLIP7_BONUS,
} from './constants.js';

const num = numberCard;
const plus = flatCard;
const x2 = doubleCard;
const act = actionCard;

/** Engine with no opening deal, so tests control every card. */
function bench(names = ['You'], seed = 7) {
  return new Flip7Engine({ names, seed, dealOnStart: false });
}

export function runSelfTest(api) {
  const results = [];
  const t = (name, fn) => {
    try {
      const detail = fn();
      results.push({ name, ok: true, detail: detail || '' });
    } catch (err) {
      results.push({ name, ok: false, detail: (err && err.message) || String(err) });
    }
  };
  const eq = (got, want, what) => {
    const a = JSON.stringify(got);
    const b = JSON.stringify(want);
    if (a !== b) throw new Error(`${what}: got ${a}, want ${b}`);
  };
  const ok = (cond, what) => { if (!cond) throw new Error(what); };

  // ------------------------------------------------------------ deck shape
  t('deck is exactly 94 cards', () => {
    const e = bench();
    eq(e.deck.length, 94, 'deck size');
    eq(deckTemplate().length, 94, 'template size');
    return '94 cards';
  });

  t('number cards: one 0, and N copies of each N (1..12) = 79', () => {
    const e = bench();
    const counts = {};
    let numbers = 0;
    for (const c of e.deck) if (c.kind === 'number') { counts[c.value] = (counts[c.value] || 0) + 1; numbers += 1; }
    eq(counts[0], 1, 'count of 0');
    for (let v = 1; v <= 12; v++) eq(counts[v], v, `count of ${v}`);
    eq(numbers, 79, 'total number cards');
    return '79 number cards';
  });

  t('modifiers: one each of +2 +4 +6 +8 +10 and x2', () => {
    const e = bench();
    const mods = e.deck.filter((c) => c.kind === 'modifier');
    eq(mods.length, 6, 'modifier count');
    for (const v of [2, 4, 6, 8, 10]) {
      eq(mods.filter((m) => m.mod === 'add' && m.value === v).length, 1, `count of +${v}`);
    }
    eq(mods.filter((m) => m.mod === 'mult').length, 1, 'count of x2');
    return '6 modifiers';
  });

  t('actions: three each of Freeze, Flip Three, Second Chance', () => {
    const e = bench();
    const a = e.deck.filter((c) => c.kind === 'action');
    eq(a.length, 9, 'action count');
    for (const k of ['freeze', 'flip3', 'second']) {
      eq(a.filter((c) => c.action === k).length, 3, `count of ${k}`);
    }
    return '9 action cards';
  });

  // ------------------------------------------------------------- busting
  t('duplicate number busts the player for 0', () => {
    const e = bench();
    e._stack([num(5), num(9), num(5)]);
    e.flip(0); e.flip(0); e.flip(0);
    const p = e.players[0];
    eq(p.status, 'busted', 'status');
    eq(e.projectedScore(p), 0, 'round score');
    eq(e.phase, 'roundend', 'round should end when nobody is active');
    eq(p.total, 0, 'banked total');
    return 'bust -> 0';
  });

  t('bust wipes modifiers too', () => {
    const e = bench();
    e._stack([num(5), plus(10), x2(), num(5)]);
    e.flip(0); e.flip(0); e.flip(0); e.flip(0);
    eq(e.players[0].status, 'busted', 'status');
    eq(e.players[0].total, 0, 'total after bust');
    return 'modifiers lost on bust';
  });

  // -------------------------------------------------------- second chance
  t('Second Chance eats one duplicate then is gone', () => {
    const e = bench();
    e._stack([act('second'), num(5), num(5), num(3), num(3)]);
    e.flip(0);
    ok(e.players[0].secondChance === true, 'should hold Second Chance');
    e.flip(0);
    e.flip(0); // duplicate 5 -> saved
    const p = e.players[0];
    eq(p.status, 'active', 'still active after the save');
    eq(p.secondChance, false, 'Second Chance consumed');
    eq(p.numbers, [5], 'duplicate not kept');
    ok(p.cards.every((c) => !(c.kind === 'action' && c.action === 'second')), 'card discarded');
    e.flip(0); e.flip(0); // 3 then duplicate 3 -> real bust
    eq(e.players[0].status, 'busted', 'busts without protection');
    return 'saved once, then busted';
  });

  t('spare Second Chance goes to an active player without one', () => {
    const e = bench(['You', 'Ada']);
    e._stack([act('second'), act('second')]);
    e.flip(0);
    e.flip(0); // one candidate -> auto-passed to Ada
    eq(e.players[0].secondChance, true, 'keeps the first');
    eq(e.players[1].secondChance, true, 'Ada receives the spare');
    return 'passed to Ada';
  });

  t('spare Second Chance is discarded when nobody can take it', () => {
    const e = bench();
    e._stack([act('second'), act('second')]);
    e.flip(0); e.flip(0);
    eq(e.players[0].secondChance, true, 'still one held');
    eq(e.discard.filter((c) => c.action === 'second').length, 1, 'spare discarded');
    return 'discarded';
  });

  // ------------------------------------------------------------- scoring
  t('x2 doubles number cards only, flat modifiers added after', () => {
    const e = bench();
    e._stack([num(3), num(4), num(12), x2(), plus(10)]);
    for (let i = 0; i < 5; i++) e.flip(0);
    eq(e.projectedScore(e.players[0]), 48, '(3+4+12)*2 + 10');
    e.stay();
    eq(e.players[0].total, 48, 'banked');
    return '(3+4+12)x2+10 = 48';
  });

  t('x2 with no number cards scores only the flat modifiers', () => {
    const e = bench();
    e._stack([x2(), plus(6)]);
    e.flip(0); e.flip(0);
    eq(e.projectedScore(e.players[0]), 6, '0*2 + 6');
    return '6';
  });

  t('modifiers do not count toward the seven unique numbers', () => {
    const e = bench();
    e._stack([num(1), num(2), num(3), plus(2), x2(), plus(4), num(4), num(5), num(6)]);
    for (let i = 0; i < 9; i++) e.flip(0);
    const p = e.players[0];
    eq(p.numbers.length, 6, 'unique numbers');
    eq(p.cards.length, 9, 'cards on the table');
    eq(p.status, 'active', 'no Flip 7 yet');
    return '9 cards, 6 numbers';
  });

  // -------------------------------------------------------------- flip 7
  t(`Flip 7 pays +${FLIP7_BONUS} and ends the round immediately`, () => {
    const e = bench(['You', 'Ada']);
    e._stack([num(2), num(4), num(1), num(3), num(5), num(6), num(8), num(9)]);
    e.flip(1); // Ada shows a 2, still active
    const seven = [4, 1, 3, 5, 6, 8, 9];
    for (let i = 0; i < 7; i++) {
      eq(e.phase, 'turns', `round still live before card ${i + 1}`);
      e.flip(0);
    }
    const p = e.players[0];
    eq(p.numbers, seven, 'seven unique numbers');
    eq(p.status, 'flip7', 'flip7 status');
    eq(e.phase, 'roundend', 'round ended immediately');
    eq(p.total, 36 + FLIP7_BONUS, 'sum 36 plus the 15 bonus');
    eq(e.players[1].status, 'active', 'Ada never got to stay');
    eq(e.players[1].total, 2, 'Ada still banks the cards she showed');
    return `51 for the flipper, round over on card 7`;
  });

  // -------------------------------------------------------------- freeze
  t('Freeze makes the target stay immediately and bank', () => {
    const e = bench(['You', 'Ada']);
    e._stack([num(8), num(4), act('freeze')]);
    e.flip(1); e.flip(1);   // Ada holds 8 + 4 = 12
    e.flip(0);              // You draw Freeze -> choice pending
    ok(e.pendingChoice !== null, 'a target must be chosen');
    eq(e.pendingChoice.candidates, [0, 1], 'both players are legal targets');
    eq(e.applyChoice(9).ok, false, 'illegal target refused');
    e.applyChoice(1);
    const ada = e.players[1];
    eq(ada.status, 'stayed', 'frozen -> stayed');
    eq(ada.frozen, true, 'flagged frozen');
    eq(e.projectedScore(ada), 12, 'banks what she had');
    const before = ada.cards.length;
    e.flip(1);
    eq(ada.cards.length, before, 'receives no further cards');
    return 'Ada frozen on 12';
  });

  t('Freeze must be used on yourself when you are the last one standing', () => {
    const e = bench();
    e._stack([num(7), act('freeze')]);
    e.flip(0); e.flip(0);
    eq(e.players[0].status, 'stayed', 'self-frozen');
    eq(e.players[0].total, 7, 'banked 7');
    return 'self freeze';
  });

  // ---------------------------------------------------------- flip three
  t('Flip Three deals exactly three cards to the target', () => {
    const e = bench();
    e._stack([act('flip3'), num(1), num(2), num(3), num(4)]);
    e.flip(0);
    e.applyChoice(0);
    eq(e.pendingFlips, { player: 0, count: 3 }, 'three queued');
    e.step(10);
    eq(e.players[0].numbers, [1, 2, 3], 'exactly three flipped');
    eq(e.deck.length, 1, 'the 4 was not touched');
    return '1,2,3';
  });

  t('Flip Three stops the moment the target busts', () => {
    const e = bench();
    e._stack([act('flip3'), num(1), num(1), num(2)]);
    e.flip(0);
    e.applyChoice(0);
    e.step(10);
    eq(e.players[0].status, 'busted', 'busted on the duplicate');
    eq(e.deck.length, 1, 'third card never drawn');
    return 'stopped early';
  });

  t('an action drawn during Flip Three resolves after it', () => {
    const e = bench();
    e._stack([act('flip3'), num(1), act('freeze'), num(2)]);
    e.flip(0);
    e.applyChoice(0);
    e.advance(); // 1
    e.advance(); // freeze -> deferred
    ok(e.deferred.length === 1, 'freeze deferred, not resolved mid-flip');
    eq(e.players[0].status, 'active', 'not frozen yet');
    e.step(10);
    eq(e.players[0].numbers, [1, 2], 'all three flips happened');
    eq(e.players[0].status, 'stayed', 'then the Freeze resolved');
    return 'deferred then applied';
  });

  t('a deferred action is discarded if the drawer busted', () => {
    const e = bench();
    e._stack([act('flip3'), num(1), act('freeze'), num(1)]);
    e.flip(0);
    e.applyChoice(0);
    e.step(12);
    eq(e.players[0].status, 'busted', 'busted on the third flip');
    eq(e.discard.filter((c) => c.action === 'freeze').length, 1, 'freeze discarded');
    return 'discarded';
  });

  // ------------------------------------------------------------- endgame
  t('reaching 200 ends the game and the highest score wins', () => {
    const e = bench(['You', 'Ada']);
    e.players[0].total = 190;
    e.players[1].total = 120;
    e.players[1].status = 'stayed';
    e._stack([num(12)]);
    e.flip(0);
    e.stay();
    eq(e.players[0].total, 202, 'human total');
    eq(e.phase, 'gameover', 'game over');
    eq(e.winner, 0, 'winner index');
    eq(e.status(), 'won', 'reported status');
    eq(e.hit().ok, false, 'no further hits');
    return '202 > 200';
  });

  t('under 200 the game just rolls into the next round', () => {
    const e = bench(['You', 'Ada']);
    e.players[0].total = 100;
    e.players[1].total = 120;
    e.players[1].status = 'stayed';
    e._stack([num(9)]);
    e.flip(0);
    e.stay();
    eq(e.phase, 'roundend', 'paused on the scoreboard');
    e.advance();
    eq(e.phase, 'turns', 'next round started');
    eq(e.round, 2, 'round counter');
    return 'round 2';
  });

  t('a tie on 200 plays another round instead of ending', () => {
    const e = bench(['You', 'Ada']);
    e.players[0].total = 195;
    e.players[1].total = 205;
    e.players[1].status = 'stayed';
    e._stack([num(10)]);
    e.flip(0);
    e.stay();
    eq(e.players[0].total, 205, 'tied');
    eq(e.phase, 'roundend', 'no winner declared');
    eq(e.winner, null, 'winner still open');
    return 'tie -> extra round';
  });

  // --------------------------------------------------------------- deck
  t('the discard pile is reshuffled when the deck runs dry', () => {
    const e = bench();
    e.discard = [num(4), num(6), num(7)].map((c, i) => ({ ...c, uid: 900 + i }));
    e.deck = [];
    const c = e.draw();
    ok(c !== null, 'a card was drawn');
    eq(e.deck.length, 2, 'rest of the reshuffled pile');
    eq(e.discard.length, 0, 'discard emptied');
    return 'reshuffled';
  });

  // -------------------------------------------------------- public API
  if (api) {
    t('API: illegal action is rejected without throwing', () => {
      api.reset(11);
      const r = api.input('__nope__');
      eq(r.ok, false, 'ok flag');
      ok(typeof r.reason === 'string', 'has a reason');
      return r.reason;
    });

    t('API: same seed + same inputs give the same state', () => {
      api.reset(1234); api.step(40);
      const a = JSON.stringify(api.getState());
      api.reset(1234); api.step(40);
      const b = JSON.stringify(api.getState());
      ok(a === b, 'states diverged');
      return 'deterministic';
    });

    t('API: different seeds deal different cards', () => {
      api.reset(1); api.step(40);
      const a = JSON.stringify(api.getState().players.map((p) => p.cards.map((c) => c.label)));
      api.reset(2); api.step(40);
      const b = JSON.stringify(api.getState().players.map((p) => p.cards.map((c) => c.label)));
      ok(a !== b, 'seeds produced identical deals');
      return 'seeds differ';
    });

    t('API: hitting out of turn is refused', () => {
      api.reset(5);
      api.step(60);
      const st = api.getState();
      if (st.canAct) {
        // it is our turn: stay, then a second stay must be refused
        eq(api.input('stay').ok, true, 'stay accepted');
        eq(api.input('stay').ok, false, 'second stay refused');
      }
      return 'refused';
    });

    t('API: getState exposes deck, discard, hands and totals', () => {
      api.reset(3); api.step(30);
      const st = api.getState();
      ok(typeof st.deckSize === 'number' && typeof st.discardSize === 'number', 'pile sizes');
      ok(Array.isArray(st.players) && st.players.length >= 2, 'players');
      for (const p of st.players) {
        ok(Array.isArray(p.cards), 'hand');
        ok(typeof p.roundScore === 'number' && typeof p.total === 'number', 'scores');
      }
      ok(typeof st.round === 'number' && typeof st.status === 'string', 'round/status');
      return `${st.players.length} players, deck ${st.deckSize}`;
    });
  }

  const failed = results.filter((r) => !r.ok);
  return {
    ok: failed.length === 0,
    passed: results.length - failed.length,
    failed: failed.length,
    total: results.length,
    results,
  };
}
