import { WIN_SCORE } from './constants.js';

export function setupUI(game) {
    const els = {
        totalScore: document.getElementById('total-score'),
        handScore: document.getElementById('hand-score'),
        msg: document.getElementById('message-area'),
        cards: document.getElementById('card-container'),
        btnFlip: document.getElementById('btn-flip'),
        btnStay: document.getElementById('btn-stay'),
        btnReset: document.getElementById('btn-reset'),
        multiplier: document.getElementById('multiplier-badge')
    };

    game.ui = {
        updateStats: (total, round, mult, msg) => {
            els.totalScore.textContent = total;
            els.handScore.textContent = round;
            if (msg) els.msg.textContent = msg;

            if (mult > 1) {
                els.multiplier.classList.remove('hidden');
                els.multiplier.textContent = `${mult}x ACTIVE`;
            } else {
                els.multiplier.classList.add('hidden');
            }

            if (game.isTurnActive && game.forcedFlips === 0) {
                els.btnFlip.disabled = false;
                els.btnStay.disabled = false;
                els.btnReset.classList.add('hidden');
            }
        },
        onCardFlip: (card) => {
            const div = document.createElement('div');
            div.className = `card ${card.type === 'action' ? 'action' : ''} ${card.value === 7 || card.display === '7' ? 'danger' : ''}`;
            div.textContent = card.display;
            els.cards.appendChild(div);
            els.cards.scrollTop = els.cards.scrollHeight;
        },
        onBust: (card) => {
            const cards = els.cards.querySelectorAll('.card');
            cards[cards.length - 1].classList.add('bust-anim');
        },
        showMessage: (msg) => {
            els.msg.textContent = msg;
            els.msg.style.animation = 'none';
            els.msg.offsetHeight; /* trigger reflow */
            els.msg.style.animation = 'pulse 0.5s';
        },
        showBonusEffect: (msg) => {
            // In a real app we'd use a nice modal
            const overlay = document.createElement('div');
            overlay.className = 'bonus-overlay';
            overlay.textContent = msg;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.remove(), 2000);
        },
        onStay: (score) => {
            els.msg.textContent = `Banked ${score} points!`;
        },
        onWin: () => {
            els.msg.textContent = "YOU WIN! 200 POINTS REACHED!";
            els.msg.style.color = "#0f0";
            els.btnFlip.disabled = true;
            els.btnStay.disabled = true;
            els.btnReset.classList.remove('hidden');
            els.btnReset.textContent = "PLAY AGAIN";
        },
        toggleControls: (canFlip, canStay, showReset) => {
            els.btnFlip.disabled = !canFlip;
            els.btnStay.disabled = !canStay;
            if (showReset) {
                els.btnReset.classList.remove('hidden');
                if (game.totalScore >= WIN_SCORE) {
                    els.btnReset.textContent = "PLAY AGAIN";
                } else {
                    els.btnReset.textContent = "NEXT TURN";
                }
            } else {
                els.btnReset.classList.add('hidden');
            }
        }
    };

    // Event Listeners
    els.btnFlip.addEventListener('click', () => {
        if (!game.isTurnActive && els.btnReset.classList.contains('hidden')) {
            game.startTurn();
            game.flipCard();
        } else {
            game.flipCard();
        }
    });

    els.btnStay.addEventListener('click', () => game.stay());

    els.btnReset.addEventListener('click', () => {
        els.cards.innerHTML = '';
        if (game.totalScore >= WIN_SCORE) {
            game.totalScore = 0;
        }
        game.startTurn();
        game.flipCard();
    });
}
