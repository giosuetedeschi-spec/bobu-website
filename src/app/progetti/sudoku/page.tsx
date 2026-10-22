import Container from "@mui/material/Container";
import { GamePageHeader } from "@/components/games/GamePageHeader";
import { SudokuGame } from "@/components/games/SudokuGame";
import { SudokuSolverVisualizer } from "@/components/games/SudokuSolverVisualizer";

export default function SudokuPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GamePageHeader title="Sudoku" tag="TypeScript · Puzzle" />
      <SudokuGame />
      <SudokuSolverVisualizer />
    </Container>
  );
}
