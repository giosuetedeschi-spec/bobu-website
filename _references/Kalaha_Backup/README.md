# Kalaha (Mancala) - Python Implementation

A playable terminal version of the ancient board game **Kalaha** (also known as Mancala), featuring a strong AI opponent.

## 🎮 Features
- **Game Modes**:
  - Human vs Human
  - Human vs Bot
  - Bot vs Human
- **Advanced AI**:
  - **Minimax Algorithm** with Alpha-Beta Pruning.
  - **Transposition Table** powered by **Zobrist Hashing** for high performance.
  - **Move Ordering** to optimize search efficiency.
  - **Heuristics** evaluating material, side control, mobility, and capture potential.
- **Customizable**: Configurable search depth (default: 6).

## 🚀 How to Run
1. Ensure you have Python installed.
2. Clone the repository or navigate to the project folder.
3. Run the game:
   ```bash
   python kalaha/main.py
   ```
4. Follow the on-screen instructions to select a game mode and play.

## 📜 Rules
- **Board**: Two rows of 6 pits each, plus a store (Kalaha) for each player.
- **Seeds**: Starts with 6 seeds per pit.
- **Objective**: Capture more seeds in your store than your opponent.
- **Movement**:
  - Choose a pit to sow its seeds counter-clockwise.
  - If the last seed lands in your store, you get an **Extra Turn**.
  - If the last seed lands in an empty pit on your side, you **Capture** that seed and all seeds in the opposite pit.
- **Game Over**: When one player's pits are all empty. Remaining seeds on the board go to the respective owners.

## 🧠 Technical Documentation
- `kalaha/ai_engine.py`: Core AI logic.
- `tabelle_finali.txt`: Explanation of Endgame Tablebases.
- `zobrist.txt`: Implementation details of Zobrist Hashing.
- `valutazione.txt`: Analysis of the evaluation function.
- `training_ai.txt`: Plan for future Reinforcement Learning implementation.

## 🛠 Project Structure
```
Kalaha/
│
├── kalaha/             # Source code
│   ├── main.py         # Entry point and Game Loop
│   ├── game_logic.py   # Rules and State Management
│   ├── ai_engine.py    # Minimax, Alpha-Beta, TT
│   ├── zobrist...py    # Zobrist Hashing
│   └── tests.py        # Unit Tests
│
├── README.md           # This file
├── tabelle_finali.txt  # Docs
├── zobrist.txt         # Docs
├── valutazione.txt     # Docs
└── training_ai.txt     # Docs
```

## 📝 Roadmap
- [x] Core Game Engine
- [x] Terminal UI
- [x] AI (Minimax + Alpha-Beta)
- [x] Transposition Tables & Zobrist Hashing
- [ ] End-game Tablebases
- [ ] GUI (Pygame)
- [ ] Reinforcement Learning Agent
