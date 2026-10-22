"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { applyMove, finishBoard, getBestMove, initialBoard, isTerminal, type KalahaBoard } from "@/lib/kalaha";

const startBoard = () => initialBoard();

export function KalahaGame() {
  const [board, setBoard] = useState<KalahaBoard>(startBoard);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [gameOver, setGameOver] = useState(false);
  const thinking = turn === 1 && !gameOver;
  const [message, setMessage] = useState("Choose a pit on your side to sow its stones.");

  useEffect(() => {
    if (turn !== 1 || gameOver) return;
    const timer = window.setTimeout(() => {
      const pit = getBestMove(board, 1, 7).move;
      if (pit === null) return;
      const result = applyMove(board, pit, 1);
      if (isTerminal(result.board)) {
        const finalBoard = finishBoard(result.board);
        setBoard(finalBoard); setGameOver(true); setTurn(0);
        setMessage(finalBoard[6] > finalBoard[13] ? "You win!" : finalBoard[6] < finalBoard[13] ? "The computer wins." : "Draw game.");
      } else {
        setBoard(result.board); setTurn(result.extra ? 1 : 0);
        if (result.extra) setMessage("The computer earned another turn.");
        else setMessage("Your turn. Pick one of the highlighted pits.");
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [board, turn, gameOver]);

  const play = (pit: number) => {
    if (turn !== 0 || thinking || gameOver || board[pit] === 0) return;
    const result = applyMove(board, pit, 0);
    if (isTerminal(result.board)) {
      const finalBoard = finishBoard(result.board);
      setBoard(finalBoard); setGameOver(true);
      setMessage(finalBoard[6] > finalBoard[13] ? "You win!" : finalBoard[6] < finalBoard[13] ? "The computer wins." : "Draw game.");
    } else {
      setBoard(result.board); setTurn(result.extra ? 0 : 1);
      setMessage(result.extra ? "Your last stone landed in your store. Take another turn!" : "Computer is thinking…");
    }
  };
  const restart = () => { setBoard(startBoard()); setTurn(0); setGameOver(false); setMessage("Choose a pit on your side to sow its stones."); };
  const pitButton = (pit: number, label: string, disabled: boolean) => (
    <Button key={pit} variant={turn === 0 && !disabled ? "contained" : "outlined"} disabled={disabled} onClick={() => play(pit)} aria-label={`${label}, ${board[pit]} stones`} sx={{ minWidth: { xs: 30, sm: 52 }, minHeight: { xs: 44, sm: 58 }, p: 0.5, borderRadius: 2, fontSize: { xs: "0.9rem", sm: "1.15rem" }, fontWeight: 800 }}>
      {board[pit]}
    </Button>
  );

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, width: "100%", maxWidth: 760, minWidth: 0, boxSizing: "border-box", mx: "auto" }}>
      <Typography color="text.secondary" sx={{ mb: 2 }}>This version starts with four stones in each pit. Sow counter-clockwise; capture the stones opposite an empty pit on your side. Landing in your store earns another turn.</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "36px minmax(0, 1fr) 36px", sm: "minmax(64px, 76px) 1fr minmax(64px, 76px)" }, gap: { xs: 0.5, sm: 1.5 }, alignItems: "center", p: { xs: 1, sm: 2 }, bgcolor: "#f1f5f9", borderRadius: 3, overflowX: "auto", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
        <Box aria-label={`Your store: ${board[6]} stones`} sx={{ gridRow: "1 / span 4", minHeight: { xs: 148, sm: 176 }, display: "grid", placeContent: "center", textAlign: "center", bgcolor: "#dbeafe", borderRadius: 2, color: "#1d4ed8" }}>
          <Typography variant="caption">YOU</Typography><Typography variant="h4" sx={{ fontWeight: 800 }}>{board[6]}</Typography>
        </Box>
        <Typography variant="caption" sx={{ gridColumn: 2, textAlign: "center", color: "text.secondary" }}>COMPUTER</Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: { xs: 0.4, sm: 0.8 }, gridColumn: 2, minWidth: 0 }}>
          {[12, 11, 10, 9, 8, 7].map((pit) => pitButton(pit, `Computer pit ${13 - pit}`, true))}
        </Box>
        <Box aria-label={`Computer store: ${board[13]} stones`} sx={{ gridColumn: 3, gridRow: "1 / span 4", minHeight: { xs: 148, sm: 176 }, display: "grid", placeContent: "center", textAlign: "center", bgcolor: "#e2e8f0", borderRadius: 2 }}>
          <Typography variant="caption">CPU</Typography><Typography variant="h4" sx={{ fontWeight: 800 }}>{board[13]}</Typography>
        </Box>
        <Typography variant="caption" sx={{ gridColumn: 2, textAlign: "center", color: "text.secondary" }}>YOUR PITS</Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: { xs: 0.4, sm: 0.8 }, gridColumn: 2, minWidth: 0 }}>
          {[0, 1, 2, 3, 4, 5].map((pit) => pitButton(pit, `Your pit ${pit + 1}`, turn !== 0 || thinking || gameOver || board[pit] === 0))}
        </Box>
      </Box>
      <Typography role="status" aria-live="polite" sx={{ minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: gameOver ? "success.main" : "text.secondary" }}>{message}</Typography>
      <Box sx={{ display: "flex", justifyContent: "center" }}><Button variant="outlined" onClick={restart}>New game</Button></Box>
    </Paper>
  );
}
