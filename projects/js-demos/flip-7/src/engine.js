import { CARDS, WIN_SCORE } from './constants.js';

export class Flip7Game {
    constructor() {
        this.deck = [];
        this.currentHand = []; // Cards flipped this turn
        this.totalScore = 0;
        this.roundScore = 0;
        this.roundMultiplier = 1;
        this.forcedFlips = 0; // For Flip 3 card
        this.isTurnActive = false;
        this.ui = {}; // Hook for UI callbacks

        this.initDeck();
    }

    initDeck() {
        this.deck = [];
        // Add Numbers
        CARDS.NUMBERS.forEach(card => {
            for (let i = 0; i < card.count; i++) {
                this.deck.push({ type: 'number', value: card.val, display: card.val.toString() });
            }
        });
        // Add Specials
        CARDS.SPECIALS.forEach(card => {
            for (let i = 0; i < card.count; i++) {
                this.deck.push({
                    type: 'action',
                    value: card.val || 0, // Actions worth 0 face value
                    display: card.type,
                    action: card.action
                });
            }
        });
        this.shuffle();
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    startTurn() {
        if (this.deck.length < 10) this.initDeck(); // Reshuffle if low
        this.currentHand = [];
        this.roundScore = 0;
        this.roundMultiplier = 1;
        this.forcedFlips = 0;
        this.isTurnActive = true;
        this.updateUI("Turn Started! Flip a card.");
    }

    flipCard() {
        if (!this.isTurnActive) return;

        if (this.deck.length === 0) this.initDeck();
        const card = this.deck.pop();

        // UI Animation trigger
        this.ui.onCardFlip(card);

        // Process Card with small delay for animation sync
        setTimeout(() => this.processCard(card), 600);
    }

    processCard(card) {
        let bust = false;
        if (card.type === 'number' || card.display === '0') {
            const match = this.currentHand.find(c => c.value === card.value && (c.type === 'number' || c.display === '0'));
            if (match) bust = true;
        }

        this.currentHand.push(card);

        if (bust) {
            this.handleBust(card);
            return;
        }

        // Apply Card Effects
        if (card.type === 'number' || card.display === '0') {
            this.roundScore += card.value;
        } else if (card.type === 'action') {
            this.handleAction(card);
        }

        // Check Flip 7 Bonus
        if (this.currentHand.length === 7) {
            this.handleFlip7Bonus();
        }

        // Handle Forced Flips
        if (this.forcedFlips > 0) {
            this.forcedFlips--;
            setTimeout(() => this.flipCard(), 800);
        } else {
            this.updateUI();
        }
    }

    handleAction(card) {
        switch (card.action) {
            case 'FREEZE':
                this.ui.showMessage("FREEZE! Hand locked.");
                this.stay();
                break;
            case 'DOUBLE':
                this.roundMultiplier *= 2;
                this.ui.showMessage("DOUBLE SCORE active!");
                break;
            case 'PLUS3':
                this.roundScore += 3;
                break;
            case 'FLIP3':
                this.forcedFlips += 3;
                this.ui.showMessage("FLIP 3! Hang on!");
                break;
        }
    }

    handleBust(card) {
        this.isTurnActive = false;
        this.ui.onBust(card);
        this.updateUI(`BUSTED by ${card.display}!`);
        this.ui.toggleControls(false, false, true);
    }

    handleFlip7Bonus() {
        const bonus = 50;
        this.roundScore += bonus;
        this.ui.showBonusEffect("FLIP 7 JACKPOT! +50 Pts");
    }

    stay() {
        if (!this.isTurnActive) return;

        const totalRound = this.roundScore * this.roundMultiplier;
        this.totalScore += totalRound;
        this.isTurnActive = false;

        this.ui.onStay(totalRound);

        if (this.totalScore >= WIN_SCORE) {
            this.ui.onWin();
        } else {
            this.ui.toggleControls(false, false, true);
        }
    }

    updateUI(msg) {
        if (this.ui.updateStats) {
            this.ui.updateStats(this.totalScore, this.roundScore, this.roundMultiplier, msg);
        }
    }
}
