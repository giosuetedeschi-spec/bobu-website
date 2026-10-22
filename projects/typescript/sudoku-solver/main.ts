import { formatBoard, parseFen } from "./sudoku-utils";
import { BacktrackingSolver } from "./solvers/backtracking";

const puzzle = parseFen("53..7....\\6..195...\\.98....6.\\8...6...3\\4..8.3..1\\7...2...6\\.6....28.\\...419..5\\....8..79");
const solution = new BacktrackingSolver(puzzle).solve();
if (!solution) throw new Error("Puzzle has no solution.");
console.log(formatBoard(solution));
