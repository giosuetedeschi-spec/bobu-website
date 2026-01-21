# Flip 7 - Prototype

Flip 7 is a fast-paced "push-your-luck" card game. This folder contains the functional prototype designed for a neon-noir aesthetic.

## 🃏 Playing the Game
**IMPORTANT**: Due to the use of ES Modules for code organization, you **cannot** simply double-click `index.html`. Browsers block modules over the `file://` protocol for security.

To run the game:
1. Open a terminal in this folder.
2. Run a local server. For example: `npx serve .` or use the "Live Server" extension in VS Code.
3. Open the provided `localhost` URL in your browser.

## 📖 Rules
1. **The Turn**: Flip a card. Choose to **Stay** or **Flip** again.
2. **The Bust**: If you flip a number already in your hand, you lose all points for that round.
3. **Flip 7 Bonus**: Flipping 7 unique cards earns a massive jackpot (+50 pts).
4. **Special Cards**:
    - **Freeze**: Ends your turn and banks points immediately.
    - **Double**: Doubles your round score.
    - **Plus 3**: Adds 3 points.
    - **Flip 3**: Forces 3 more flips.

## 🛠 Project Structure
The code is refactored into a modular structure for readability and easy integration:
- `index.html`: UI Structure.
- `style.css`: Neon visuals and animations.
- `game.js`: Entry point.
- `src/constants.js`: Card distribution and score settings.
- `src/engine.js`: The `Flip7Game` logic engine.
- `src/ui.js`: DOM binding and rendering logic.

## 🎯 Implementation Choices
- **Modular Classes**: The game engine is a standalone class, making it easy to port to React by swapping the `ui.js` module for a React component.
- **Neon Aesthetic**: Uses CSS custom properties and standard animations for a "premium" feel without heavy libraries.
- **Deck Distribution**: Uses a pyramid distribution (1x12, 2x11 ... 12x1) to balance risk.
