import { WIN_SCORE, type Card } from "./constants.js";
import type { Flip7Game } from "./engine.js";

export function setupUI(game: Flip7Game): void {
  const get = <T extends HTMLElement>(id: string): T => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing Flip 7 element: #${id}`);
    return element as T;
  };
  const total = get<HTMLElement>("total-score");
  const hand = get<HTMLElement>("hand-score");
  const message = get<HTMLElement>("message-area");
  const cards = get<HTMLElement>("card-container");
  const flip = get<HTMLButtonElement>("btn-flip");
  const stay = get<HTMLButtonElement>("btn-stay");
  const reset = get<HTMLButtonElement>("btn-reset");
  const multiplier = get<HTMLElement>("multiplier-badge");

  game.ui = {
    updateStats: (score, roundScore, roundMultiplier, text) => {
      total.textContent = String(score);
      hand.textContent = String(roundScore);
      if (text) message.textContent = text;
      multiplier.classList.toggle("hidden", roundMultiplier <= 1);
      multiplier.textContent = `${roundMultiplier}x ACTIVE`;
    },
    onCardFlip: (card: Card) => {
      const tile = document.createElement("div");
      tile.className = `card ${card.type} ${card.type === "number" && card.value >= 10 ? "danger" : ""}`;
      tile.dataset.display = card.display;
      tile.textContent = card.display;
      cards.querySelector(".card-slot")?.remove();
      cards.append(tile);
      cards.scrollTop = cards.scrollHeight;
    },
    onBust: () => cards.lastElementChild?.classList.add("bust-anim"),
    onSecondChance: (card) => {
      if (card.display === "Second Chance") cards.lastElementChild?.remove();
      else {
        cards.lastElementChild?.remove();
        cards.querySelector('[data-display="Second Chance"]')?.remove();
      }
    },
    showMessage: (text) => { message.textContent = text; },
    showBonusEffect: (text) => {
      const overlay = document.createElement("div");
      overlay.className = "bonus-overlay";
      overlay.textContent = text;
      document.body.append(overlay);
      setTimeout(() => overlay.remove(), 1800);
    },
    onStay: (score) => { message.textContent = `Banked ${score} points.`; },
    onWin: () => {
      message.textContent = "You win! 200 points reached.";
      flip.disabled = true;
      stay.disabled = true;
      reset.classList.remove("hidden");
      reset.textContent = "PLAY AGAIN";
    },
    toggleControls: (canFlip, canStay, showReset) => {
      flip.disabled = !canFlip;
      stay.disabled = !canStay;
      reset.classList.toggle("hidden", !showReset);
      if (showReset) reset.textContent = game.totalScore >= WIN_SCORE ? "PLAY AGAIN" : "NEXT TURN";
    },
  };

  flip.addEventListener("click", () => {
    if (!game.isTurnActive) {
      cards.replaceChildren();
      game.startTurn();
    }
    game.flipCard();
  });
  stay.addEventListener("click", () => game.stay());
  reset.addEventListener("click", () => {
    cards.replaceChildren();
    if (game.totalScore >= WIN_SCORE) { game.newGame(); game.flipCard(); }
    else { game.startTurn(); game.flipCard(); }
  });
}
