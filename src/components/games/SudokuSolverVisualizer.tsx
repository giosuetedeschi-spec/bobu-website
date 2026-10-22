"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { generateSudoku } from "../../../projects/typescript/sudoku-solver/generator";
import { AC3Solver } from "../../../projects/typescript/sudoku-solver/solvers/ac3";
import { BacktrackingSolver } from "../../../projects/typescript/sudoku-solver/solvers/backtracking";
import { SimulatedAnnealingSolver } from "../../../projects/typescript/sudoku-solver/solvers/simulated-annealing";
import type { Board } from "../../../projects/typescript/sudoku-solver/sudoku-utils";

type Strategy = "backtracking" | "ac3" | "simulated_annealing";
const speeds = [0, 50, 150, 350] as const;

function clone(board: Board): Board {
  return board.map((row) => [...row]);
}

export function SudokuSolverVisualizer() {
  const [puzzle, setPuzzle] = useState<Board>(() => generateSudoku(40, 0x51d0)[0]);
  const [board, setBoard] = useState<Board>(() => clone(puzzle));
  const [strategy, setStrategy] = useState<Strategy>("backtracking");
  const [speed, setSpeed] = useState<number>(150);
  const [status, setStatus] = useState("Scegli una strategia e avvia la risoluzione.");
  const [solving, setSolving] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => () => { cancelRef.current = true; }, []);

  const newPuzzle = () => {
    cancelRef.current = true;
    const next = generateSudoku(40, Date.now())[0];
    setPuzzle(next);
    setBoard(clone(next));
    setSolving(false);
    setStatus("Nuovo schema pronto.");
  };

  const solve = async () => {
    cancelRef.current = false;
    setSolving(true);
    setStatus("Risoluzione in corso…");
    const result = strategy === "backtracking"
      ? await animateBacktracking()
      : strategy === "ac3"
        ? new AC3Solver(puzzle).solve()
        : new SimulatedAnnealingSolver(puzzle).solve();
    if (cancelRef.current) return;
    setSolving(false);
    if (result) {
      setBoard(result);
      setStatus("Schema risolto.");
    } else {
      setStatus("Questa strategia non ha trovato una soluzione.");
    }
  };

  async function animateBacktracking(): Promise<Board | null> {
    const steps = new BacktrackingSolver(puzzle).solveStepByStep();
    for (const step of steps) {
      if (cancelRef.current) return null;
      setBoard(step);
      if (speed) await new Promise<void>((resolve) => window.setTimeout(resolve, speed));
      else await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    }
    return steps.at(-1) ?? null;
  }

  return (
    <Paper component="section" variant="outlined" sx={{ mt: 3, p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <Typography variant="h2" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, mb: 1 }}>
        Visualizzatore del risolutore
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Osserva il backtracking passo per passo oppure confronta AC-3 e ricerca con annealing simulato.
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel id="sudoku-strategy-label">Strategia</InputLabel>
          <Select labelId="sudoku-strategy-label" label="Strategia" value={strategy} disabled={solving} onChange={(event) => setStrategy(event.target.value as Strategy)}>
            <MenuItem value="backtracking">Backtracking</MenuItem>
            <MenuItem value="ac3">AC-3 + backtracking</MenuItem>
            <MenuItem value="simulated_annealing">Annealing simulato</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 155 }}>
          <InputLabel id="sudoku-speed-label">Velocità</InputLabel>
          <Select labelId="sudoku-speed-label" label="Velocità" value={speed} disabled={solving || strategy !== "backtracking"} onChange={(event) => setSpeed(Number(event.target.value))}>
            {speeds.map((value) => <MenuItem key={value} value={value}>{value === 0 ? "Massima" : `${value} ms`}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={solve} disabled={solving}>Risolvi</Button>
        <Button variant="outlined" onClick={newPuzzle}>Nuovo schema</Button>
      </Box>
      <Box role="grid" aria-label="Sudoku per il risolutore" sx={{ display: "grid", gridTemplateColumns: "repeat(9, minmax(0, 1fr))", width: "min(100%, 450px)", borderTop: "2px solid #334155", borderLeft: "2px solid #334155", mx: "auto" }}>
        {board.flatMap((row, r) => row.map((value, c) => (
          <Box key={`${r}-${c}`} role="gridcell" aria-label={`Riga ${r + 1}, colonna ${c + 1}: ${value === "." ? "vuota" : value}`} sx={{ aspectRatio: "1", minWidth: 0, display: "grid", placeItems: "center", borderRight: (c + 1) % 3 === 0 ? "2px solid #334155" : "1px solid #cbd5e1", borderBottom: (r + 1) % 3 === 0 ? "2px solid #334155" : "1px solid #cbd5e1", bgcolor: puzzle[r][c] === "." && value !== "." ? "#eff6ff" : "background.paper", color: puzzle[r][c] === "." ? "primary.main" : "text.primary", fontWeight: puzzle[r][c] === "." ? 500 : 700, fontSize: "clamp(.8rem, 3.7vw, 1.25rem)" }}>
            {value === "." ? "" : value}
          </Box>
        )))}
      </Box>
      <Typography role="status" aria-live="polite" color="text.secondary" sx={{ textAlign: "center", mt: 1.5, minHeight: 24 }}>{status}</Typography>
    </Paper>
  );
}
