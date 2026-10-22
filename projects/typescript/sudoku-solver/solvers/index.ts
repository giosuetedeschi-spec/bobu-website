import { Board } from "../sudoku-utils";
import { AC3Solver } from "./ac3";
import { BacktrackingSolver } from "./backtracking";
import { SimulatedAnnealingSolver } from "./simulated-annealing";

export type SudokuStrategy = "backtracking" | "ac3" | "simulated_annealing";

export class SudokuSolver {
  constructor(readonly board: Board) {}

  solve(strategy: SudokuStrategy = "backtracking"): Board | null {
    switch (strategy) {
      case "backtracking": return new BacktrackingSolver(this.board).solve();
      case "ac3": return new AC3Solver(this.board).solve();
      case "simulated_annealing": return new SimulatedAnnealingSolver(this.board).solve();
      default: throw new Error(`Unknown Sudoku strategy: ${strategy satisfies never}`);
    }
  }
}
