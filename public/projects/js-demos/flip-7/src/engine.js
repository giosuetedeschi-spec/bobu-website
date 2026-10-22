import { CARDS, FLIP_SEVEN_BONUS } from "./constants.js";
import { WIN_SCORE } from "./constants.js";

export class Flip7Game {
  deck = [];
  discardPile = [];
  currentHand = [];
  totalScore = 0;
  roundScore = 0;
  numberScore = 0;
  modifierScore = 0;
  roundMultiplier = 1;
  forcedFlips = 0;
  isTurnActive = false;
  ui = {};
  flipTimer;
  constructor() {
    this.initDeck();
  }
  initDeck() {
    this.deck = CARDS.NUMBERS.flatMap(({ val, count }) => Array.from({ length: count }, () => ({ type: "number", value: val, display: String(val) })));
    this.deck.push(...CARDS.ACTIONS.flatMap(({ display, action, count }) => Array.from({ length: count }, () => ({ type: "action", value: 0, display, action }))));
    this.deck.push(...CARDS.MODIFIERS.map(({ value, display }) => ({ type: "modifier", value, display, modifier: "POINTS" })));
    this.deck.push({ type: "modifier", value: 0, display: "x2", modifier: "DOUBLE" });
    this.shuffle(this.deck);
    this.discardPile = [];
  }
  shuffle(cards) {
    for (let i = cards.length - 1;i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }
  startTurn() {
    if (!this.deck.length)
      this.recycleDiscardPile();
    this.currentHand = [];
    this.roundScore = 0;
    this.numberScore = 0;
    this.modifierScore = 0;
    this.roundMultiplier = 1;
    this.forcedFlips = 0;
    this.isTurnActive = true;
    this.updateUI("Turn started. Flip or stay.");
    this.ui.toggleControls?.(true, false, false);
  }
  flipCard() {
    if (!this.isTurnActive || this.flipTimer)
      return;
    if (!this.deck.length)
      this.recycleDiscardPile();
    const card = this.deck.pop();
    if (!card)
      return;
    this.ui.toggleControls?.(false, false, false);
    this.ui.onCardFlip?.(card);
    this.flipTimer = setTimeout(() => {
      this.flipTimer = undefined;
      this.processCard(card);
    }, 400);
  }
  processCard(card) {
    if (!this.isTurnActive)
      return;
    const duplicate = card.type === "number" && this.currentHand.some((held) => held.type === "number" && held.value === card.value);
    this.currentHand.push(card);
    if (duplicate) {
      const secondChance = this.currentHand.find((held) => held.type === "action" && held.action === "SECOND_CHANCE");
      if (secondChance) {
        this.currentHand.splice(this.currentHand.indexOf(secondChance), 1);
        this.currentHand.splice(this.currentHand.indexOf(card), 1);
        this.discardPile.push(secondChance, card);
        this.ui.onSecondChance?.(card);
        this.ui.showMessage?.("Second Chance used. The duplicate is discarded.");
      } else {
        this.handleBust(card);
        return;
      }
    } else {
      this.applyCard(card);
    }
    if (!this.isTurnActive)
      return;
    this.refreshRoundScore();
    const numberCount = this.currentHand.filter((held) => held.type === "number").length;
    if (numberCount === 7) {
      this.modifierScore += FLIP_SEVEN_BONUS;
      this.refreshRoundScore();
      this.ui.showBonusEffect?.(`FLIP 7! +${FLIP_SEVEN_BONUS} points`);
      this.stay();
      return;
    }
    if (this.forcedFlips > 0) {
      this.forcedFlips--;
      this.ui.toggleControls?.(false, false, false);
      this.flipTimer = setTimeout(() => {
        this.flipTimer = undefined;
        this.flipCard();
      }, 550);
      return;
    }
    this.updateUI();
    this.ui.toggleControls?.(true, this.currentHand.length > 0, false);
  }
  applyCard(card) {
    if (card.type === "number")
      this.numberScore += card.value;
    if (card.type === "modifier") {
      if (card.modifier === "DOUBLE")
        this.roundMultiplier *= 2;
      else
        this.modifierScore += card.value;
    }
    if (card.type === "action") {
      switch (card.action) {
        case "FREEZE":
          this.ui.showMessage?.("Freeze: your turn ends and points are banked.");
          this.stay();
          break;
        case "FLIP3":
          this.forcedFlips += 3;
          this.ui.showMessage?.("Flip Three: draw three cards.");
          break;
        case "SECOND_CHANCE":
          if (this.currentHand.filter((held) => held.type === "action" && held.action === "SECOND_CHANCE").length > 1) {
            this.currentHand.pop();
            this.discardPile.push(card);
            this.ui.onSecondChance?.(card);
            this.ui.showMessage?.("Only one Second Chance is allowed; extra copy discarded.");
          } else
            this.ui.showMessage?.("Second Chance is ready to cancel one duplicate number.");
          break;
      }
    }
  }
  recycleDiscardPile() {
    if (!this.discardPile.length) {
      this.initDeck();
      return;
    }
    this.deck = this.discardPile.splice(0);
    this.shuffle(this.deck);
  }
  handleBust(card) {
    this.isTurnActive = false;
    this.roundScore = 0;
    this.numberScore = 0;
    this.modifierScore = 0;
    this.discardPile.push(...this.currentHand);
    this.currentHand = [];
    this.ui.onBust?.(card);
    this.updateUI(`Busted by ${card.display}. No points banked this turn.`);
    this.ui.toggleControls?.(false, false, true);
  }
  stay() {
    if (!this.isTurnActive)
      return;
    const totalRound = this.numberScore * this.roundMultiplier + this.modifierScore;
    this.totalScore += totalRound;
    this.isTurnActive = false;
    this.discardPile.push(...this.currentHand);
    this.currentHand = [];
    this.ui.onStay?.(totalRound);
    if (this.totalScore >= WIN_SCORE)
      this.ui.onWin?.();
    else
      this.ui.toggleControls?.(false, false, true);
    this.updateUI();
  }
  newGame() {
    if (this.flipTimer)
      clearTimeout(this.flipTimer);
    this.flipTimer = undefined;
    this.totalScore = 0;
    this.initDeck();
    this.startTurn();
  }
  updateUI(message) {
    this.ui.updateStats?.(this.totalScore, this.roundScore, this.roundMultiplier, message);
  }
  refreshRoundScore() {
    this.roundScore = this.numberScore + this.modifierScore;
  }
}
