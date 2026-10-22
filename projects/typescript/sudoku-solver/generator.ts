import { BLOCK_H, BLOCK_W, COLS, EMPTY, DIGITS, ROWS } from "./config";
import { Board } from "./sudoku-utils";
import { BacktrackingSolver } from "./solvers/backtracking";

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function generateSudoku(removeCount = 40, seed = Date.now()): [Board, Board] {
  const random = seededRandom(seed);
  const board = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => EMPTY));
  const digits = [...DIGITS];
  for (let block = 0; block < ROWS; block += BLOCK_H) {
    const shuffled = [...digits];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    let index = 0;
    for (let row = block; row < block + BLOCK_H; row++) for (let column = block; column < block + BLOCK_W; column++) {
      board[row][column] = shuffled[index++];
    }
  }

  const solution = new BacktrackingSolver(board).solve();
  if (!solution) throw new Error("Could not generate a valid Sudoku solution.");
  const puzzle = solution.map((row) => [...row]);
  const cells = Array.from({ length: ROWS * COLS }, (_, index) => index);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  for (const cell of cells.slice(0, Math.max(0, Math.min(ROWS * COLS, removeCount)))) {
    puzzle[Math.floor(cell / COLS)][cell % COLS] = EMPTY;
  }
  return [puzzle, solution];
}
