import { CARDS, FLIP_SEVEN_BONUS, type ActionCard, type Card } from "./constants.js";
import { WIN_SCORE } from "./constants.js";

type Flip7Ui = {
  updateStats?: (total: number, round: number, multiplier: number, message?: string) => void;
  onCardFlip?: (card: Card) => void;
  onBust?: (card: Card) => void;
  onSecondChance?: (card: Card) => void;
  showMessage?: (message: string) => void;
  showBonusEffect?: (message: string) => void;
  onStay?: (score: number) => void;
  onWin?: () => void;
  toggleControls?: (canFlip: boolean, canStay: boolean, showReset: boolean) => void;
};

export class Flip7Game {
  deck: Card[] = [];
  discardPile: Card[] = [];
  currentHand: Card[] = [];
  totalScore = 0;
  roundScore = 0;
  private numberScore = 0;
  private modifierScore = 0;
  roundMultiplier = 1;
  forcedFlips = 0;
  isTurnActive = false;
  ui: Flip7Ui = {};
  private flipTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() { this.initDeck(); }

  initDeck(): void {
    this.deck = CARDS.NUMBERS.flatMap(({ val, count }) =>
      Array.from({ length: count }, (): Card => ({ type: "number", value: val, display: String(val) })),
    );
    this.deck.push(...CARDS.ACTIONS.flatMap(({ display, action, count }) =>
      Array.from({ length: count }, (): Card => ({ type: "action", value: 0, display, action })),
    ));
    this.deck.push(...CARDS.MODIFIERS.map(({ value, display }): Card => ({ type: "modifier", value, display, modifier: "POINTS" })));
    this.deck.push({ type: "modifier", value: 0, display: "x2", modifier: "DOUBLE" });
    this.shuffle(this.deck);
    this.discardPile = [];
  }

  private shuffle(cards: Card[]): void {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  startTurn(): void {
    if (!this.deck.length) this.recycleDiscardPile();
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

  flipCard(): void {
    if (!this.isTurnActive || this.flipTimer) return;
    if (!this.deck.length) this.recycleDiscardPile();
    const card = this.deck.pop();
    if (!card) return;
    this.ui.toggleControls?.(false, false, false);
    this.ui.onCardFlip?.(card);
    this.flipTimer = setTimeout(() => {
      this.flipTimer = undefined;
      this.processCard(card);
    }, 400);
  }

  processCard(card: Card): void {
    if (!this.isTurnActive) return;
    const duplicate = card.type === "number" && this.currentHand.some((held) => held.type === "number" && held.value === card.value);
    this.currentHand.push(card);
    if (duplicate) {
      const secondChance = this.currentHand.find((held) => held.type === "action" && held.action === "SECOND_CHANCE") as ActionCard | undefined;
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

    if (!this.isTurnActive) return;
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
      this.flipTimer = setTimeout(() => { this.flipTimer = undefined; this.flipCard(); }, 550);
      return;
    }
    this.updateUI();
    this.ui.toggleControls?.(true, this.currentHand.length > 0, false);
  }

  private applyCard(card: Card): void {
    if (card.type === "number") this.numberScore += card.value;
    if (card.type === "modifier") {
      if (card.modifier === "DOUBLE") this.roundMultiplier *= 2;
      else this.modifierScore += card.value;
    }
    if (card.type === "action") {
      switch (card.action) {
        case "FREEZE": this.ui.showMessage?.("Freeze: your turn ends and points are banked."); this.stay(); break;
        case "FLIP3": this.forcedFlips += 3; this.ui.showMessage?.("Flip Three: draw three cards."); break;
        case "SECOND_CHANCE":
          if (this.currentHand.filter((held) => held.type === "action" && held.action === "SECOND_CHANCE").length > 1) {
            this.currentHand.pop();
            this.discardPile.push(card);
            this.ui.onSecondChance?.(card);
            this.ui.showMessage?.("Only one Second Chance is allowed; extra copy discarded.");
          } else this.ui.showMessage?.("Second Chance is ready to cancel one duplicate number.");
          break;
      }
    }
  }

  private recycleDiscardPile(): void {
    if (!this.discardPile.length) { this.initDeck(); return; }
    this.deck = this.discardPile.splice(0);
    this.shuffle(this.deck);
  }

  private handleBust(card: Card): void {
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

  stay(): void {
    if (!this.isTurnActive) return;
    const totalRound = this.numberScore * this.roundMultiplier + this.modifierScore;
    this.totalScore += totalRound;
    this.isTurnActive = false;
    this.discardPile.push(...this.currentHand);
    this.currentHand = [];
    this.ui.onStay?.(totalRound);
    if (this.totalScore >= WIN_SCORE) this.ui.onWin?.();
    else this.ui.toggleControls?.(false, false, true);
    this.updateUI();
  }

  newGame(): void {
    if (this.flipTimer) clearTimeout(this.flipTimer);
    this.flipTimer = undefined;
    this.totalScore = 0;
    this.initDeck();
    this.startTurn();
  }

  updateUI(message?: string): void {
    this.ui.updateStats?.(this.totalScore, this.roundScore, this.roundMultiplier, message);
  }

  private refreshRoundScore(): void {
    this.roundScore = this.numberScore + this.modifierScore;
  }
}
