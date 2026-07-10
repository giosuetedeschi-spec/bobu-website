import { PyodideGamePage } from "@/components/games/PyodideGamePage";

export default function SudokuPage() {
  return (
    <PyodideGamePage
      title="Sudoku Solver"
      tag="Python + Pyodide"
      scriptPath="/games/sudoku/main.py"
      description="This runs the Python Sudoku solver in your browser. Check the console output below."
    />
  );
}
