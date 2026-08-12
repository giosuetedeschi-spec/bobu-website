/**
 * Flip 7 — presentation.
 *
 * Pure view layer: `render(state)` takes the engine's `toState()` snapshot and
 * paints it. It holds no rules and no game state of its own, so the harness can
 * drive the engine directly without the DOM ever disagreeing with it.
 */

import { ACTION_LABEL, ACTION_BLURB } from './constants.js';

const el = (id) => document.getElementById(id);

const dom = {
  round: el('round'),
  deck: el('deck'),
  discard: el('discard'),
  target: el('target'),
  targetInline: el('target-inline'),
  seats: el('seats'),
  log: el('log'),
  prompt: el('prompt'),
  hit: el('btn-hit'),
  stay: el('btn-stay'),
  newGame: el('btn-new'),
  modal: el('modal'),
  modalTitle: el('modal-title'),
  modalText: el('modal-text'),
  modalChoices: el('modal-choices'),
  modalAction: el('modal-action'),
};

const STATUS_LABEL = {
  active: 'In',
  stayed: 'Stayed',
  busted: 'Busted',
  frozen: 'Frozen',
  out: 'Out',
};

/** One card face. Number, modifier and action cards each read differently. */
function cardNode(card, opts = {}) {
  const node = document.createElement('div');
  node.className = `card ${card.kind}`;
  if (card.kind === 'action') node.classList.add(`action-${card.action}`);
  if (card.kind === 'modifier') node.classList.add(card.mod === 'mult' ? 'mult' : 'add');
  if (opts.fresh) node.classList.add('fresh');

  if (card.kind === 'number') {
    node.innerHTML = `<span class="corner tl">${card.value}</span>`
      + `<span class="pip">${card.value}</span>`
      + `<span class="corner br">${card.value}</span>`;
  } else if (card.kind === 'modifier') {
    node.innerHTML = `<span class="tag">bonus</span><span class="pip">${card.label}</span>`;
  } else {
    node.innerHTML = `<span class="tag">action</span>`
      + `<span class="pip act">${ACTION_LABEL[card.action]}</span>`
      + `<span class="blurb">${ACTION_BLURB[card.action] ?? ''}</span>`;
  }
  return node;
}

function seatNode(player, state) {
  const seat = document.createElement('article');
  seat.className = 'seat';
  seat.dataset.status = player.status;
  seat.dataset.testid = `seat-${player.index}`;
  if (player.isHuman) seat.classList.add('you');
  if (state.turnIndex === player.index && state.phase === 'turns') seat.classList.add('active');

  const head = document.createElement('header');
  head.innerHTML = `
    <span class="name">${player.name}${player.isHuman ? '<em> · you</em>' : ''}</span>
    <span class="chips">
      ${player.secondChance ? '<span class="chip save" title="Second Chance in hand">shield</span>' : ''}
      <span class="chip state ${player.status}">${STATUS_LABEL[player.status] ?? player.status}</span>
    </span>`;

  const hand = document.createElement('div');
  hand.className = 'hand';
  if (player.cards.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'card empty';
    hand.appendChild(empty);
  } else {
    for (const card of player.cards) {
      hand.appendChild(cardNode(card, { fresh: state.lastCard && state.lastCard.uid === card.uid }));
    }
  }

  const foot = document.createElement('footer');
  const uniques = Array.from({ length: 7 }, (_, i) =>
    `<i class="tick${i < player.uniqueCount ? ' on' : ''}"></i>`).join('');
  foot.innerHTML = `
    <span class="uniques" title="${player.uniqueCount} of 7 unique numbers">${uniques}</span>
    <span class="scores">
      <span class="round-score" title="this round">${player.roundScore}</span>
      <span class="total" title="banked total">${player.total}</span>
    </span>`;

  seat.append(head, hand, foot);
  return seat;
}

export function render(state) {
  dom.round.textContent = String(state.round);
  dom.deck.textContent = String(state.deckSize);
  dom.discard.textContent = String(state.discardSize);
  dom.target.textContent = String(state.target);
  dom.targetInline.textContent = String(state.target);

  dom.seats.replaceChildren(...state.players.map((p) => seatNode(p, state)));

  dom.log.replaceChildren(...state.log.slice().reverse().map((entry) => {
    const li = document.createElement('li');
    li.className = `tone-${entry.tone ?? 'info'}`;
    li.textContent = entry.text ?? String(entry);
    return li;
  }));

  const canAct = state.canAct;
  dom.hit.disabled = !canAct;
  dom.stay.disabled = !canAct;

  if (state.phase === 'gameover') {
    dom.prompt.textContent = state.winner === null
      ? 'Game over.'
      : `${state.players[state.winner].name} wins with ${state.players[state.winner].total}.`;
  } else if (state.pendingChoice && state.pendingChoice.chooser === 0) {
    dom.prompt.textContent = `Choose a target for ${ACTION_LABEL[state.pendingChoice.card.action]}.`;
  } else if (canAct) {
    dom.prompt.textContent = `Your move — ${state.roundScore} in hand.`;
  } else if (state.phase === 'roundend') {
    dom.prompt.textContent = 'Round over.';
  } else {
    dom.prompt.textContent = `${state.players[state.turnIndex]?.name ?? 'Table'} is thinking…`;
  }
}

/* ------------------------------------------------------------------ modal */

function openModal({ title, text, choices = [], action = null }) {
  dom.modalTitle.textContent = title;
  dom.modalText.textContent = text ?? '';
  dom.modalChoices.replaceChildren(...choices.map((c) => {
    const b = document.createElement('button');
    b.className = 'btn choice';
    b.textContent = c.label;
    b.dataset.testid = `choice-${c.value}`;
    b.addEventListener('click', c.onPick);
    return b;
  }));
  if (action) {
    dom.modalAction.hidden = false;
    dom.modalAction.textContent = action.label;
    dom.modalAction.onclick = action.onPick;
  } else {
    dom.modalAction.hidden = true;
    dom.modalAction.onclick = null;
  }
  dom.modal.hidden = false;
}

export function closeModal() {
  dom.modal.hidden = true;
}

/** The human must pick who an action card lands on. */
export function askChoice(state, onPick) {
  const pending = state.pendingChoice;
  openModal({
    title: ACTION_LABEL[pending.card.action],
    text: `${ACTION_BLURB[pending.card.action] ?? ''} Who gets it?`,
    choices: pending.candidates.map((idx) => ({
      value: idx,
      label: idx === 0 ? `${state.players[idx].name} (you)` : state.players[idx].name,
      onPick: () => onPick(idx),
    })),
  });
}

export function showRoundEnd(state, onContinue) {
  const rows = (state.lastRound?.rows ?? [])
    .map((r) => {
      const note = r.busted ? ' busted' : r.flip7 ? ' FLIP 7!' : r.frozen ? ' frozen' : '';
      return `${r.name}: +${r.score}${note} → ${r.total}`;
    })
    .join('\n');
  openModal({
    title: `Round ${state.lastRound?.round ?? state.round} over`,
    text: rows,
    action: { label: 'Next round', onPick: onContinue },
  });
}

export function showGameOver(state, onRestart) {
  const winner = state.winner === null ? null : state.players[state.winner];
  openModal({
    title: winner ? `${winner.name} wins` : 'Game over',
    text: state.players
      .slice()
      .sort((a, b) => b.total - a.total)
      .map((p) => `${p.name}: ${p.total}`)
      .join('\n'),
    action: { label: 'Play again', onPick: onRestart },
  });
}

export const controls = {
  onHit: (fn) => dom.hit.addEventListener('click', fn),
  onStay: (fn) => dom.stay.addEventListener('click', fn),
  onNewGame: (fn) => dom.newGame.addEventListener('click', fn),
};
