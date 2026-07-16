import { PyodideGamePage } from "@/components/games/PyodideGamePage";

const MODULES = [
  "config.py",
  "sudoku_utils.py",
  "generator.py",
  "solvers/__init__.py",
  "solvers/backtracking.py",
  "solvers/ac3.py",
  "solvers/simulated_annealing.py",
];

export default function SudokuPage() {
  return (
    <PyodideGamePage
      title="Sudoku Solver"
      tag="Python + Pyodide"
      scriptPath="/games/sudoku/main.py"
      moduleFiles={MODULES}
      description="This runs the Python Sudoku solver in your browser. Check the console output below."
    />
  );
}
