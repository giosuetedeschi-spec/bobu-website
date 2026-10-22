import { applySowingMove, cleanupBoard, initialState, isGameOver, legalMovesFor, P1_STORE, P2_STORE, type KalahaBoard } from "../game_logic";

export type Observation = number[];
export type StepResult = { observation: Observation; reward: number; terminated: boolean; truncated: boolean; extraTurn: boolean; error?: "illegal_move" };

export class KalahaEnv {
  board: KalahaBoard = initialState();
  currentPlayer: 0 | 1 = 0;
  moveCount = 0;

  constructor(readonly maxMoves = 200) {}

  reset(): Observation {
    this.board = initialState();
    this.currentPlayer = 0;
    this.moveCount = 0;
    return this.observation();
  }

  step(action: number): StepResult {
    if (!Number.isInteger(action) || action < 0 || action >= 6 || !this.actionMask()[action]) {
      return { observation: this.observation(), reward: -10, terminated: true, truncated: false, extraTurn: false, error: "illegal_move" };
    }
    const pit = action + (this.currentPlayer === 0 ? 0 : 7);
    const result = applySowingMove(this.board, pit, this.currentPlayer);
    this.board = result.board;
    this.moveCount++;
    let reward = 0;
    let terminated = false;
    if (isGameOver(this.board)) {
      this.board = cleanupBoard(this.board);
      const own = this.currentPlayer === 0 ? P1_STORE : P2_STORE;
      const other = this.currentPlayer === 0 ? P2_STORE : P1_STORE;
      reward = Math.sign(this.board[own] - this.board[other]);
      terminated = true;
    }
    if (!result.extra) this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
    return { observation: this.observation(), reward, terminated, truncated: !terminated && this.moveCount >= this.maxMoves, extraTurn: result.extra };
  }

  actionMask(): boolean[] {
    const legal = new Set(legalMovesFor(this.board, this.currentPlayer).map((pit) => pit - (this.currentPlayer === 0 ? 0 : 7)));
    return Array.from({ length: 6 }, (_, action) => legal.has(action));
  }

  observation(): Observation {
    const ownPits = this.currentPlayer === 0 ? this.board.slice(0, 6) : this.board.slice(7, 13);
    const otherPits = this.currentPlayer === 0 ? this.board.slice(7, 13) : this.board.slice(0, 6);
    const ownStore = this.board[this.currentPlayer === 0 ? P1_STORE : P2_STORE];
    const otherStore = this.board[this.currentPlayer === 0 ? P2_STORE : P1_STORE];
    return [...ownPits, ownStore, ...otherPits, otherStore, this.currentPlayer];
  }
}
