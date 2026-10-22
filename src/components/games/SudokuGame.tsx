"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type Board = number[][];
type Puzzle = { puzzle: Board; solution: Board };

function createRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function shuffledDigits(random: () => number) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

function canPlace(board: Board, row: number, col: number, value: number) {
  for (let i = 0; i < 9; i++) if (board[row][i] === value || board[i][col] === value) return false;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) for (let c = boxCol; c < boxCol + 3; c++) if (board[r][c] === value) return false;
  return true;
}

function fillBoard(board: Board, random: () => number, position = 0): boolean {
  if (position === 81) return true;
  const row = Math.floor(position / 9);
  const col = position % 9;
  if (board[row][col]) return fillBoard(board, random, position + 1);
  for (const value of shuffledDigits(random)) {
    if (!canPlace(board, row, col, value)) continue;
    board[row][col] = value;
    if (fillBoard(board, random, position + 1)) return true;
  }
  board[row][col] = 0;
  return false;
}

function newPuzzle(seed = 0x51d0): Puzzle {
  const random = createRandom(seed);
  const solution = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(solution, random);
  const puzzle = solution.map((row) => [...row]);
  const cells = Array.from({ length: 81 }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  for (const cell of cells.slice(0, 42)) puzzle[Math.floor(cell / 9)][cell % 9] = 0;
  return { puzzle, solution };
}

export function SudokuGame() {
  const [puzzle, setPuzzle] = useState<Puzzle>(newPuzzle);
  const [board, setBoard] = useState<Board>(() => puzzle.puzzle.map((row) => [...row]));
  const [message, setMessage] = useState("Fill the empty cells. Each row, column, and 3×3 box uses 1–9 once.");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = newPuzzle(Date.now());
      setPuzzle(next);
      setBoard(next.puzzle.map((row) => [...row]));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const givens = puzzle.puzzle;
  const solved = board.every((row, r) => row.every((value, c) => value === puzzle.solution[r][c]));

  const startNew = () => {
    const next = newPuzzle(Date.now());
    setPuzzle(next);
    setBoard(next.puzzle.map((row) => [...row]));
    setMessage("New puzzle ready. Fill the empty cells.");
  };
  const updateCell = (row: number, col: number, raw: string) => {
    if (givens[row][col]) return;
    const digit = raw.replace(/[^1-9]/g, "").slice(-1);
    const next = board.map((line, r) => line.map((value, c) => r === row && c === col ? Number(digit) || 0 : value));
    setBoard(next);
    setMessage(next.every((line, r) => line.every((value, c) => value === puzzle.solution[r][c]))
      ? "Solved! Every row, column, and box is correct."
      : "Keep going, or ask for a hint.");
  };
  const hint = () => {
    const empty = board.flatMap((row, r) => row.map((value, c) => value === 0 ? { r, c } : null).filter((cell): cell is { r: number; c: number } => cell !== null));
    const cell = empty[0];
    if (!cell) return;
    setBoard((current) => current.map((row, r) => row.map((value, c) => r === cell.r && c === cell.c ? puzzle.solution[r][c] : value)));
    setMessage("One cell filled. Keep solving.");
  };
  const check = () => {
    if (solved) setMessage("Solved! Every row, column, and box is correct.");
    else if (board.some((row) => row.includes(0))) setMessage("Some cells are still empty.");
    else setMessage("A few values are off. Check the rows, columns, and boxes.");
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, width: "100%", maxWidth: 620, minWidth: 0, boxSizing: "border-box", mx: "auto" }}>
      <Typography color="text.secondary" sx={{ mb: 2 }}>A fresh puzzle is generated in your browser. Clues are fixed; use the keyboard to fill the rest.</Typography>
      <Box role="grid" aria-label="Sudoku puzzle" sx={{ display: "grid", gridTemplateColumns: "repeat(9, minmax(0, 1fr))", width: "100%", maxWidth: 468, minWidth: 0, boxSizing: "border-box", mx: "auto", borderTop: "2px solid #334155", borderLeft: "2px solid #334155" }}>
        {board.flatMap((row, r) => row.map((value, c) => (
          <input
            key={`${r}-${c}`}
            aria-label={`Row ${r + 1}, column ${c + 1}${givens[r][c] ? ", clue" : ""}`}
            inputMode="numeric"
            maxLength={1}
            value={value || ""}
            readOnly={Boolean(givens[r][c])}
            onChange={(event) => updateCell(r, c, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                const [dr, dc] = event.key === "ArrowUp" ? [-1, 0] : event.key === "ArrowDown" ? [1, 0] : event.key === "ArrowLeft" ? [0, -1] : [0, 1];
                document.getElementById(`sudoku-${r + dr}-${c + dc}`)?.focus();
              }
            }}
            id={`sudoku-${r}-${c}`}
            style={{
              width: "100%", aspectRatio: "1", minWidth: 0, border: 0, borderRight: (c + 1) % 3 === 0 ? "2px solid #334155" : "1px solid #cbd5e1",
              borderBottom: (r + 1) % 3 === 0 ? "2px solid #334155" : "1px solid #cbd5e1", textAlign: "center", fontSize: "clamp(1rem, 4vw, 1.45rem)",
              fontWeight: givens[r][c] ? 700 : 500, color: givens[r][c] ? "#1e293b" : "#2563eb", background: givens[r][c] ? "#f1f5f9" : "white", padding: 0,
            }}
          />
        )))}
      </Box>
      <Typography role="status" aria-live="polite" color={solved ? "success.main" : "text.secondary"} sx={{ minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", mt: 1 }}>{message}</Typography>
      <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1, mt: 1 }}>
        <Button variant="outlined" onClick={startNew}>New puzzle</Button>
        <Button variant="outlined" onClick={hint} disabled={solved}>Hint</Button>
        <Button variant="contained" onClick={check}>Check</Button>
      </Box>
    </Paper>
  );
}
