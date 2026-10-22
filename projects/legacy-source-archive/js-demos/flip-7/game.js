import { Flip7Game } from './src/engine.js';
import { setupUI } from './src/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const game = new Flip7Game();
    setupUI(game);
    game.updateUI("Welcome Flipper. Press FLIP to start.");
});
