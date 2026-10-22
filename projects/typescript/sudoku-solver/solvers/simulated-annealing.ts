import { BLOCK_H, BLOCK_W, COLS, DIGITS, EMPTY, ROWS } from "../config";
import { Board } from "../sudoku-utils";

export class SimulatedAnnealingSolver {
  answerBoard: Board | null = null;

  constructor(readonly originalBoard: Board, private readonly random = Math.random) {}

  solve(maxSteps = 100_000): Board | null {
    const board = this.initialize();
    let score = this.score(board);
    let bestScore = score;
    this.answerBoard = board.map((row) => [...row]);
    let temperature = 1;

    for (let step = 1; score > 0 && step <= maxSteps; step++) {
      temperature *= 0.99;
      const previous = board.map((row) => [...row]);
      const blockRow = Math.floor(this.random() * (ROWS / BLOCK_H));
      const blockColumn = Math.floor(this.random() * (COLS / BLOCK_W));
      this.swapMutable(board, blockRow, blockColumn);
      const nextScore = this.score(board);
      const delta = nextScore - score;
      if (delta < 0 || Math.exp(-delta / Math.max(temperature, Number.EPSILON)) > this.random()) {
        score = nextScore;
        if (score < bestScore) {
          bestScore = score;
          this.answerBoard = board.map((row) => [...row]);
        }
      } else {
        for (let row = 0; row < ROWS; row++) board[row] = previous[row];
      }
      if (step % 2_000 === 0) temperature += 0.5;
    }
    return score === 0 ? board : null;
  }

  private initialize(): Board {
    const board = this.originalBoard.map((row) => [...row]);
    for (let br = 0; br < ROWS / BLOCK_H; br++) for (let bc = 0; bc < COLS / BLOCK_W; bc++) {
      const fixed = new Set<string>();
      const mutable: Array<[number, number]> = [];
      for (let r = br * BLOCK_H; r < (br + 1) * BLOCK_H; r++) for (let c = bc * BLOCK_W; c < (bc + 1) * BLOCK_W; c++) {
        if (board[r][c] === EMPTY) mutable.push([r, c]);
        else if (DIGITS.includes(board[r][c])) fixed.add(board[r][c]);
      }
      const missing = this.shuffle(DIGITS.filter((digit) => !fixed.has(digit)));
      if (missing.length !== mutable.length) return board;
      mutable.forEach(([r, c], index) => { board[r][c] = missing[index]; });
    }
    return board;
  }

  private swapMutable(board: Board, blockRow: number, blockColumn: number) {
    const cells: Array<[number, number]> = [];
    for (let row = blockRow * BLOCK_H; row < (blockRow + 1) * BLOCK_H; row++) {
      for (let column = blockColumn * BLOCK_W; column < (blockColumn + 1) * BLOCK_W; column++) {
        if (this.originalBoard[row][column] === EMPTY) cells.push([row, column]);
      }
    }
    if (cells.length < 2) return;
    const a = Math.floor(this.random() * cells.length);
    let b = Math.floor(this.random() * (cells.length - 1));
    if (b >= a) b++;
    const [r1, c1] = cells[a];
    const [r2, c2] = cells[b];
    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
  }

  private score(board: Board): number {
    let errors = 0;
    const countDuplicates = (values: string[]) => {
      const counts = new Map<string, number>();
      for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
      return [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    };
    for (let row = 0; row < ROWS; row++) errors += countDuplicates(board[row]);
    for (let column = 0; column < COLS; column++) errors += countDuplicates(board.map((row) => row[column]));
    return errors;
  }

  private shuffle<T>(values: T[]): T[] {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }
}
