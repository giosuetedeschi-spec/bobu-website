/**
 * Flip 7 — game constants.
 *
 * Deck composition follows the published game (The Op / Usaopoly, 2024):
 *   94 cards = 79 number cards + 6 modifier cards + 9 action cards
 *     numbers  : one 0, one 1, two 2s, three 3s ... twelve 12s   (1 + 78 = 79)
 *     modifiers: one each of +2, +4, +6, +8, +10 and x2          (6)
 *     actions  : three each of Freeze, Flip Three, Second Chance (9)
 */

export const TARGET_SCORE = 200;
export const FLIP7_BONUS = 15;
export const FLIP7_COUNT = 7;
export const MAX_NUMBER = 12;

export const FLAT_MODIFIERS = [2, 4, 6, 8, 10];
export const ACTION_KINDS = ['freeze', 'flip3', 'second'];

export const ACTION_LABEL = {
  freeze: 'Freeze',
  flip3: 'Flip Three',
  second: 'Second Chance',
};

export const ACTION_BLURB = {
  freeze: 'target must stay right now',
  flip3: 'target flips three cards',
  second: 'survive one duplicate',
};

export const DEFAULT_NAMES = ['You', 'Ada', 'Kai', 'Nova'];

/** Card factory helpers — `uid` is stamped by the engine so runs stay deterministic. */
export const numberCard = (value) => ({ kind: 'number', value, label: String(value) });
export const flatCard = (value) => ({ kind: 'modifier', mod: 'add', value, label: `+${value}` });
export const doubleCard = () => ({ kind: 'modifier', mod: 'mult', value: 2, label: 'x2' });
export const actionCard = (action) => ({ kind: 'action', action, label: ACTION_LABEL[action] });

/** The full 94 card list, in canonical (unshuffled) order. */
export function deckTemplate() {
  const cards = [];
  cards.push(numberCard(0));
  for (let v = 1; v <= MAX_NUMBER; v++) {
    for (let i = 0; i < v; i++) cards.push(numberCard(v));
  }
  for (const v of FLAT_MODIFIERS) cards.push(flatCard(v));
  cards.push(doubleCard());
  for (const a of ACTION_KINDS) {
    for (let i = 0; i < 3; i++) cards.push(actionCard(a));
  }
  return cards;
}
