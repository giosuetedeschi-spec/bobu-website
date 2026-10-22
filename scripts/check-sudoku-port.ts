import assert from "node:assert/strict";
import { COLS, DIGITS, ROWS } from "../projects/typescript/sudoku-solver/config";
import { generateSudoku } from "../projects/typescript/sudoku-solver/generator";
import { parseFen } from "../projects/typescript/sudoku-solver/sudoku-utils";
import { SudokuSolver } from "../projects/typescript/sudoku-solver/solvers";

const puzzle = parseFen("53..7....\\6..195...\\.98....6.\\8...6...3\\4..8.3..1\\7...2...6\\.6....28.\\...419..5\\....8..79");

function assertSolved(board: string[][] | null) {
  assert.ok(board, "expected a Sudoku solution");
  for (const row of board) assert.deepEqual([...row].sort(), DIGITS);
  for (let column = 0; column < COLS; column++) assert.deepEqual(board.map((row) => row[column]).sort(), DIGITS);
  for (let br = 0; br < ROWS; br += 3) for (let bc = 0; bc < COLS; bc += 3) {
    assert.deepEqual(board.slice(br, br + 3).flatMap((row) => row.slice(bc, bc + 3)).sort(), DIGITS);
  }
}

assertSolved(new SudokuSolver(puzzle).solve("backtracking"));
assertSolved(new SudokuSolver(puzzle).solve("ac3"));
const [generated, answer] = generateSudoku(40, 1234);
assertSolved(answer);
assert.equal(generated.flat().filter((value) => value === ".").length, 40);
console.log("Sudoku TypeScript port: parser, backtracking, AC-3, and generator passed.");
