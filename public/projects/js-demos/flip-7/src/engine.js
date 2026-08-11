/**
 * Flip 7 — headless rules engine.
 *
 * Pure logic: no DOM, no timers, no Math.random. Everything advances through
 * `advance()`, one atomic beat at a time, so the UI can animate each beat and
 * the test harness can drive the same machine synchronously.
 *
 * Rules implemented (see README for sources):
 *  - 94 card deck (see constants.js).
 *  - Each round the dealer deals one card face up to every player, then play
 *    passes around the table: on your turn you Hit (exactly one card) or Stay.
 *  - Flipping a number you already show busts you: 0 for the round, unless you
 *    hold Second Chance, which is discarded together with the duplicate.
 *  - 7 unique numbers = Flip 7: the round ends immediately, +15 bonus.
 *  - Round score = sum of number cards, doubled if x2 is held, then flat
 *    modifiers added, then +15 for Flip 7. Modifiers never count as numbers.
 *  - Action cards are given to any active player (yourself included):
 *      Freeze     -> that player stays immediately (banks what they have)
 *      Flip Three -> that player flips three cards one at a time
 *      Second Chance -> kept; a duplicate one is passed to another active
 *                       player who has none, otherwise discarded
 *    Freeze / Flip Three drawn *during* a Flip Three are assigned only after
 *    that Flip Three finishes, and only if the player did not bust or Flip 7.
 *  - Round ends when every player has stayed/busted/frozen, or on a Flip 7.
 *  - The deck reshuffles from the discard pile when it runs out.
 *  - Game ends at the end of the round in which somebody reaches 200; the
 *    highest total wins. A tie at the top plays another round.
 */

import {
  TARGET_SCORE, FLIP7_BONUS, FLIP7_COUNT, ACTION_LABEL, DEFAULT_NAMES, deckTemplate,
} from './constants.js';

/** mulberry32 — small, fast, seedable PRNG (deliberately not Math.random). */
export function makeRng(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Flip7Engine {
  constructor(opts = {}) {
    this.names = opts.names ? opts.names.slice() : DEFAULT_NAMES.slice();
    this.humanIndex = opts.humanIndex === undefined ? 0 : opts.humanIndex;
    this.target = opts.target === undefined ? TARGET_SCORE : opts.target;
    this.dealOnStart = opts.dealOnStart !== false;
    this.reset(opts.seed === undefined ? 1 : opts.seed);
  }

  // ---------------------------------------------------------------- lifecycle

  reset(seed) {
    this.seed = (seed >>> 0) || 1;
    this.rng = makeRng(this.seed);
    this._uid = 0;
    this._tick = 0;
    this.round = 0;
    this.dealerIndex = this.names.length - 1;
    this.deck = [];
    this.discard = [];
    this.log = [];
    this.winner = null;
    this.lastRound = null;
    this.lastCard = null;
    this.phase = 'idle';
    this.players = this.names.map((name, index) => ({
      index,
      name,
      isHuman: index === this.humanIndex,
      total: 0,
      ...this._blankHand(),
    }));
    this._freshDeck();
    this.beginRound();
    return this;
  }

  _blankHand() {
    return {
      status: 'active', // active | stayed | busted | flip7
      cards: [],        // everything showing in front of the player, draw order
      numbers: [],      // unique number values, in draw order
      modifiers: [],    // modifier cards held
      secondChance: false,
      frozen: false,
      roundScore: 0,
    };
  }

  _freshDeck() {
    this.deck = deckTemplate().map((c) => ({ ...c, uid: ++this._uid }));
    this._shuffle(this.deck);
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  beginRound() {
    this.round += 1;
    this.lastRound = null;
    this.lastCard = null;
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
    for (const p of this.players) Object.assign(p, this._blankHand());
    this.pendingChoice = null;
    this.pendingFlips = null;
    this.deferred = [];
    this.turnPending = false;
    this.dealPos = 0;
    this.turnIndex = (this.dealerIndex + 1) % this.players.length;
    this.phase = this.dealOnStart ? 'dealing' : 'turns';
    this._say(`Round ${this.round} — ${this.players[this.dealerIndex].name} deals.`, 'round');
  }

  _say(text, tone = 'info') {
    this.log.push({ n: ++this._tick, text, tone });
    if (this.log.length > 60) this.log.shift();
  }

  // ------------------------------------------------------------------- cards

  draw() {
    if (!this.deck.length) {
      if (!this.discard.length) return null;
      this.deck = this._shuffle(this.discard.slice());
      this.discard = [];
      this._say('Deck exhausted — discard pile reshuffled.', 'info');
    }
    const card = this.deck.pop();
    this.lastCard = card;
    return card;
  }

  /** Cards left that the players cannot see — used for (fair) AI odds. */
  _pool() {
    return this.deck.length >= 8 ? this.deck : this.deck.concat(this.discard);
  }

  // -------------------------------------------------------------- the pump

  /** One atomic beat. Returns true if the game state moved. */
  advance() {
    if (this.phase === 'gameover') return false;

    if (this.pendingChoice) {
      if (this.players[this.pendingChoice.chooser].isHuman) return false;
      this.applyChoice(this._aiChoose(this.pendingChoice));
      return true;
    }

    if (this.phase === 'roundend') { this.beginRound(); return true; }

    if (this.pendingFlips) {
      if (this.pendingFlips.count > 0 && this.players[this.pendingFlips.player].status === 'active') {
        this.pendingFlips.count -= 1;
        const who = this.pendingFlips.player;
        if (this.pendingFlips.count === 0) this.pendingFlips = null;
        this.flip(who, true);
        return true;
      }
      this.pendingFlips = null;
      return true;
    }

    if (this.deferred.length) { this._resolveDeferred(); return true; }

    if (this.phase === 'dealing') {
      const order = this._seatOrder();
      const seat = order[this.dealPos];
      this.dealPos += 1;
      this._say(`Deal to ${this.players[seat].name}.`, 'deal');
      this.flip(seat, false, true);
      if (this.dealPos >= order.length && this.phase === 'dealing') {
        this.phase = 'turns';
        this.turnIndex = order[0];
        if (this.players[this.turnIndex].status !== 'active') this.nextTurn();
      }
      return true;
    }

    if (this.phase === 'turns') {
      if (this.turnPending) { this.turnPending = false; this.nextTurn(); return true; }
      const p = this.players[this.turnIndex];
      if (!p || p.status !== 'active') { this.nextTurn(); return true; }
      if (p.isHuman) return false; // waiting on a human Hit / Stay
      this._aiAct(p);
      return true;
    }

    return false;
  }

  step(n = 1) {
    let moved = 0;
    for (let i = 0; i < n; i++) {
      if (!this.advance()) break;
      moved += 1;
    }
    return moved;
  }

  /** True while the machine still has work it can do on its own. */
  get busy() {
    if (this.phase === 'gameover') return false;
    if (this.pendingChoice) return !this.players[this.pendingChoice.chooser].isHuman;
    if (this.phase === 'roundend') return false;
    if (this.pendingFlips || this.deferred.length || this.phase === 'dealing') return true;
    if (this.phase !== 'turns') return false;
    if (this.turnPending) return true;
    const p = this.players[this.turnIndex];
    return !!p && (p.status !== 'active' || !p.isHuman);
  }

  _seatOrder() {
    const n = this.players.length;
    const start = (this.dealerIndex + 1) % n;
    return Array.from({ length: n }, (_, i) => (start + i) % n);
  }

  nextTurn() {
    if (this.phase !== 'turns') return;
    const n = this.players.length;
    for (let i = 1; i <= n; i++) {
      const idx = (this.turnIndex + i) % n;
      if (this.players[idx].status === 'active') { this.turnIndex = idx; return; }
    }
    this.endRound('all players finished');
  }

  // ------------------------------------------------------------ card resolve

  /**
   * Give one card to a player.
   * @param {number} idx    seat
   * @param {boolean} forced true when it comes from a Flip Three
   * @param {boolean} dealt  true when it is the opening deal
   */
  flip(idx, forced = false, dealt = false) {
    const p = this.players[idx];
    if (!p || p.status !== 'active') return null;
    const card = this.draw();
    if (!card) { this.endRound('deck empty'); return null; }

    if (card.kind === 'number') this._takeNumber(p, card);
    else if (card.kind === 'modifier') this._takeModifier(p, card);
    else this._takeAction(p, card, forced);

    if (this.phase === 'turns' || this.phase === 'dealing') this._checkRoundEnd();
    void dealt;
    return card;
  }

  _takeNumber(p, card) {
    const dup = p.numbers.includes(card.value);
    if (!dup) {
      p.cards.push(card);
      p.numbers.push(card.value);
      this._say(`${p.name} flips ${card.value}.`, 'card');
      if (p.numbers.length >= FLIP7_COUNT) {
        p.status = 'flip7';
        this._say(`FLIP 7! ${p.name} has seven unique numbers (+${FLIP7_BONUS}).`, 'flip7');
        this.endRound(`${p.name} hit Flip 7`);
      }
      return;
    }
    if (p.secondChance) {
      p.secondChance = false;
      const held = p.cards.findIndex((c) => c.kind === 'action' && c.action === 'second');
      if (held >= 0) this.discard.push(...p.cards.splice(held, 1));
      this.discard.push(card);
      this._say(`${p.name} draws a second ${card.value} — Second Chance saves them!`, 'save');
      return;
    }
    card.bust = true;
    p.cards.push(card);
    p.status = 'busted';
    this._say(`${p.name} busts on a second ${card.value}.`, 'bust');
  }

  _takeModifier(p, card) {
    p.cards.push(card);
    p.modifiers.push(card);
    this._say(`${p.name} takes ${card.label}.`, 'card');
  }

  _takeAction(p, card, forced) {
    if (card.action === 'second') {
      if (!p.secondChance) {
        p.secondChance = true;
        p.cards.push(card);
        this._say(`${p.name} holds a Second Chance.`, 'card');
        return;
      }
      const candidates = this.players
        .filter((q) => q.status === 'active' && q.index !== p.index && !q.secondChance)
        .map((q) => q.index);
      if (!candidates.length) {
        this.discard.push(card);
        this._say(`${p.name} draws a spare Second Chance — discarded.`, 'info');
        return;
      }
      if (candidates.length === 1 || !p.isHuman) {
        const pick = candidates.length === 1 ? candidates[0] : this._aiChoose({ card, chooser: p.index, candidates });
        this.applyChoice(typeof pick === 'number' ? pick : pick.target, { card, chooser: p.index, candidates });
        return;
      }
      this.pendingChoice = { type: 'give', card, chooser: p.index, candidates };
      return;
    }

    // Freeze / Flip Three
    if (forced) {
      this.deferred.push({ card, chooser: p.index });
      this._say(`${p.name} draws ${card.label} — resolved after the Flip Three.`, 'info');
      return;
    }
    this._offerAction(card, p.index);
  }

  _offerAction(card, chooser) {
    const candidates = this.players.filter((q) => q.status === 'active').map((q) => q.index);
    if (!candidates.length) { this.discard.push(card); return; }
    if (candidates.length === 1 || !this.players[chooser].isHuman) {
      const target = candidates.length === 1 ? candidates[0] : this._aiChoose({ card, chooser, candidates });
      this.applyChoice(target, { card, chooser, candidates });
      return;
    }
    this.pendingChoice = { type: 'give', card, chooser, candidates };
  }

  _resolveDeferred() {
    const { card, chooser } = this.deferred.shift();
    const owner = this.players[chooser];
    if (owner.status !== 'active') {
      this.discard.push(card);
      this._say(`${owner.name} is out — ${card.label} is discarded.`, 'info');
      return;
    }
    this._offerAction(card, chooser);
  }

  /** Resolve a pending "who gets this action card" choice. */
  applyChoice(target, explicit = null) {
    const choice = explicit || this.pendingChoice;
    if (!choice) return { ok: false, reason: 'no pending choice' };
    if (!choice.candidates.includes(target)) return { ok: false, reason: 'illegal target' };
    if (!explicit) this.pendingChoice = null;

    const card = choice.card;
    const giver = this.players[choice.chooser];
    const t = this.players[target];

    if (card.action === 'second') {
      t.secondChance = true;
      t.cards.push(card);
      this._say(`${giver.name} passes a Second Chance to ${t.name}.`, 'card');
    } else if (card.action === 'freeze') {
      t.cards.push(card);
      this._say(`${giver.name} freezes ${t.name}.`, 'freeze');
      if (t.status === 'active') {
        t.frozen = true;
        t.status = 'stayed';
        this._say(`${t.name} is frozen and banks ${this.projectedScore(t)}.`, 'stay');
      }
      this._checkRoundEnd();
    } else if (card.action === 'flip3') {
      this.discard.push(card);
      this._say(`${giver.name} sends Flip Three to ${t.name}.`, 'flip3');
      if (t.status === 'active') this.pendingFlips = { player: target, count: 3 };
    }
    if (this.phase === 'turns' || this.phase === 'dealing') this._checkRoundEnd();
    return { ok: true, target };
  }

  // -------------------------------------------------------------- round end

  _checkRoundEnd() {
    if (this.phase === 'roundend' || this.phase === 'gameover') return;
    if (this.players.some((p) => p.status === 'flip7')) { this.endRound('flip 7'); return; }
    if (!this.players.some((p) => p.status === 'active')) this.endRound('everyone is out');
  }

  projectedScore(p) {
    if (p.status === 'busted') return 0;
    let base = p.numbers.reduce((a, b) => a + b, 0);
    if (p.modifiers.some((m) => m.mod === 'mult')) base *= 2;
    for (const m of p.modifiers) if (m.mod === 'add') base += m.value;
    if (p.numbers.length >= FLIP7_COUNT) base += FLIP7_BONUS;
    return base;
  }

  endRound(reason) {
    if (this.phase === 'roundend' || this.phase === 'gameover') return;
    this.pendingChoice = null;
    this.pendingFlips = null;
    this.deferred = [];
    this.turnPending = false;

    const rows = this.players.map((p) => {
      const score = this.projectedScore(p);
      p.roundScore = score;
      p.total += score;
      return {
        index: p.index,
        name: p.name,
        score,
        busted: p.status === 'busted',
        flip7: p.numbers.length >= FLIP7_COUNT,
        frozen: p.frozen,
        total: p.total,
      };
    });
    for (const p of this.players) { this.discard.push(...p.cards); p.cards = []; }
    this.lastRound = { round: this.round, reason, rows };
    this._say(`Round ${this.round} over (${reason}).`, 'round');

    const best = Math.max(...this.players.map((p) => p.total));
    if (best >= this.target) {
      const leaders = this.players.filter((p) => p.total === best);
      if (leaders.length === 1) {
        this.winner = leaders[0].index;
        this.phase = 'gameover';
        this._say(`${leaders[0].name} wins with ${best} points!`, 'win');
        return;
      }
      this._say(`Tied at ${best} — one more round to break it.`, 'info');
    }
    this.phase = 'roundend';
  }

  // ------------------------------------------------------------------- AI

  _bustOdds(p) {
    const pool = this._pool();
    if (!pool.length) return 0;
    let dups = 0;
    for (const c of pool) if (c.kind === 'number' && p.numbers.includes(c.value)) dups += 1;
    return dups / pool.length;
  }

  _expectedGain(p) {
    const pool = this._pool();
    if (!pool.length) return 0;
    let sum = 0; let n = 0;
    for (const c of pool) {
      if (c.kind === 'number' && !p.numbers.includes(c.value)) { sum += c.value; n += 1; }
      else if (c.kind === 'modifier') { sum += c.mod === 'mult' ? Math.max(4, p.numbers.reduce((a, b) => a + b, 0)) : c.value; n += 1; }
      else if (c.kind === 'action') { sum += 3; n += 1; }
    }
    return n ? sum / n : 0;
  }

  _aiAct(p) {
    const uniques = p.numbers.length;
    const held = this.projectedScore(p);
    const bust = this._bustOdds(p);
    const gain = this._expectedGain(p);
    const leader = Math.max(...this.players.map((q) => q.total));
    const behind = leader - p.total;

    let hit;
    if (p.secondChance) hit = bust < 0.9;
    else if (uniques <= 2) hit = true;
    else if (uniques === FLIP7_COUNT - 1) hit = bust < 0.6;
    else {
      let appetite = 1;
      if (behind > 45) appetite = 1.35;
      if (p.total + held >= this.target) appetite = 0.55;
      hit = gain * (1 - bust) * appetite > held * bust;
      if (bust > 0.72 && held > 8) hit = false;
    }

    if (hit) {
      this.flip(p.index, false);
      if (this.phase === 'turns') this.turnPending = true;
    } else {
      this._say(`${p.name} stays on ${held}.`, 'stay');
      p.status = 'stayed';
      this._checkRoundEnd();
      if (this.phase === 'turns') this.turnPending = true;
    }
  }

  _aiChoose(choice) {
    const { card, chooser, candidates } = choice;
    const me = this.players[chooser];
    const others = candidates.filter((i) => i !== chooser);
    const by = (list, score) => list.slice().sort((a, b) => score(this.players[b]) - score(this.players[a]))[0];

    if (card.action === 'freeze') {
      // Freeze the opponent sitting on the fattest hand; only self if alone.
      if (!others.length) return chooser;
      return by(others, (q) => this.projectedScore(q));
    }
    if (card.action === 'flip3') {
      // Take it myself when I am still safe, otherwise hand it to the
      // opponent most likely to bust on three cards.
      if (this._bustOdds(me) < 0.22 && me.numbers.length <= 2 && candidates.includes(chooser)) return chooser;
      if (!others.length) return chooser;
      return by(others, (q) => this._bustOdds(q) * 100 + q.numbers.length);
    }
    // spare Second Chance -> the least threatening opponent
    if (!others.length) return candidates[0];
    return by(others, (q) => -q.total);
  }

  // ---------------------------------------------------------------- public

  human() { return this.players[this.humanIndex] || null; }

  status() {
    if (this.phase === 'gameover') {
      if (this.humanIndex < 0) return 'over';
      return this.winner === this.humanIndex ? 'won' : 'lost';
    }
    return 'playing';
  }

  canAct() {
    return this.phase === 'turns' && !this.pendingChoice && !this.pendingFlips
      && !this.deferred.length && !this.turnPending
      && this.turnIndex === this.humanIndex
      && this.players[this.humanIndex] && this.players[this.humanIndex].status === 'active';
  }

  hit() {
    if (this.phase === 'gameover') return { ok: false, reason: 'game over' };
    if (this.phase === 'roundend') return { ok: false, reason: 'round is over — continue first' };
    if (this.pendingChoice) return { ok: false, reason: 'resolve the action card first' };
    if (!this.canAct()) return { ok: false, reason: 'not your turn' };
    const card = this.flip(this.humanIndex, false);
    if (this.phase === 'turns') this.turnPending = true;
    return { ok: true, card: card && { ...card } };
  }

  stay() {
    if (this.phase === 'gameover') return { ok: false, reason: 'game over' };
    if (this.phase === 'roundend') return { ok: false, reason: 'round is over — continue first' };
    if (this.pendingChoice) return { ok: false, reason: 'resolve the action card first' };
    if (!this.canAct()) return { ok: false, reason: 'not your turn' };
    const p = this.players[this.humanIndex];
    this._say(`${p.name} stays on ${this.projectedScore(p)}.`, 'stay');
    p.status = 'stayed';
    this._checkRoundEnd();
    if (this.phase === 'turns') this.turnPending = true;
    return { ok: true };
  }

  toState() {
    const h = this.human();
    const score = {};
    for (const p of this.players) score[p.name] = p.total;
    return {
      status: this.status(),
      turn: this.phase === 'turns' && this.turnIndex === this.humanIndex && this.canAct() ? 'player'
        : (this.phase === 'gameover' || this.phase === 'roundend' ? null : 'ai'),
      score,
      seed: this.seed,
      round: this.round,
      phase: this.phase,
      target: this.target,
      deckSize: this.deck.length,
      discardSize: this.discard.length,
      dealer: this.dealerIndex,
      turnIndex: this.turnIndex,
      canAct: this.canAct(),
      busy: this.busy,
      winner: this.winner,
      roundScore: h ? this.projectedScore(h) : 0,
      totalScore: h ? h.total : 0,
      lastCard: this.lastCard ? { ...this.lastCard } : null,
      pendingChoice: this.pendingChoice
        ? {
          type: this.pendingChoice.type,
          card: { ...this.pendingChoice.card },
          chooser: this.pendingChoice.chooser,
          candidates: this.pendingChoice.candidates.slice(),
        }
        : null,
      pendingFlips: this.pendingFlips ? { ...this.pendingFlips } : null,
      lastRound: this.lastRound ? JSON.parse(JSON.stringify(this.lastRound)) : null,
      players: this.players.map((p) => ({
        index: p.index,
        name: p.name,
        isHuman: p.isHuman,
        status: p.status,
        frozen: p.frozen,
        secondChance: p.secondChance,
        numbers: p.numbers.slice(),
        uniqueCount: p.numbers.length,
        cards: p.cards.map((c) => ({ ...c })),
        roundScore: this.projectedScore(p),
        total: p.total,
      })),
      log: this.log.slice(-8),
    };
  }

  // ------------------------------------------------------- test-only helpers

  /** Replace the deck with an exact draw order (first element is drawn first). */
  _stack(cards) {
    this.deck = cards.map((c) => ({ ...c, uid: ++this._uid })).reverse();
    return this;
  }

  _label(card) { return card.kind === 'action' ? ACTION_LABEL[card.action] : card.label; }
}
