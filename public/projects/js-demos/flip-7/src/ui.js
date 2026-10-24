import { WIN_SCORE } from "./constants.js";
export function setupUI(game) {
  const get = (id) => {
    const element = document.getElementById(id);
    if (!element)
      throw new Error(`Missing Flip 7 element: #${id}`);
    return element;
  };
  const total = get("total-score");
  const hand = get("hand-score");
  const message = get("message-area");
  const cards = get("card-container");
  const flip = get("btn-flip");
  const stay = get("btn-stay");
  const reset = get("btn-reset");
  const multiplier = get("multiplier-badge");
  game.ui = {
    updateStats: (score, roundScore, roundMultiplier, text) => {
      total.textContent = String(score);
      hand.textContent = String(roundScore);
      if (text)
        message.textContent = text;
      multiplier.classList.toggle("hidden", roundMultiplier <= 1);
      multiplier.textContent = `${roundMultiplier}x ACTIVE`;
    },
    onCardFlip: (card) => {
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
      if (card.display === "Second Chance")
        cards.lastElementChild?.remove();
      else {
        cards.lastElementChild?.remove();
        cards.querySelector('[data-display="Second Chance"]')?.remove();
      }
    },
    showMessage: (text) => {
      message.textContent = text;
    },
    showBonusEffect: (text) => {
      const overlay = document.createElement("div");
      overlay.className = "bonus-overlay";
      overlay.textContent = text;
      document.body.append(overlay);
      setTimeout(() => overlay.remove(), 1800);
    },
    onStay: (score) => {
      message.textContent = `Banked ${score} points.`;
    },
    onWin: () => {
      message.textContent = "You win! 200 points reached.";
      flip.disabled = true;
      stay.disabled = true;
      reset.disabled = false;
      reset.textContent = "PLAY AGAIN";
    },
    toggleControls: (canFlip, canStay, showReset) => {
      flip.disabled = !canFlip;
      stay.disabled = !canStay;
      reset.classList.remove("hidden");
      reset.disabled = false;
      if (showReset)
        reset.textContent = game.totalScore >= WIN_SCORE ? "PLAY AGAIN" : "NEW GAME";
    }
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
    game.newGame();
    reset.textContent = "NEW GAME";
  });
}
