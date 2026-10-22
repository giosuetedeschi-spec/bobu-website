"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const WIDTH = 720;
const HEIGHT = 460;
const PADDLE_WIDTH = 104;
const COLORS = ["#fb7185", "#fb923c", "#facc15", "#4ade80", "#60a5fa"];
type Game = {
  x: number; y: number; vx: number; vy: number; paddleX: number;
  bricks: { x: number; y: number; alive: boolean; color: string }[];
  score: number; lives: number; phase: "playing" | "won" | "lost";
};

function createGame(): Game {
  const cols = 10;
  const gap = 8;
  const brickWidth = (WIDTH - 48 - gap * (cols - 1)) / cols;
  const bricks = Array.from({ length: 50 }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return { x: 24 + col * (brickWidth + gap), y: 48 + row * 30, alive: true, color: COLORS[row] };
  });
  return { x: WIDTH / 2, y: HEIGHT - 68, vx: 210, vy: -250, paddleX: (WIDTH - PADDLE_WIDTH) / 2, bricks, score: 0, lives: 3, phase: "playing" };
}

export function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game>(createGame());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<Game["phase"]>("playing");
  const restart = useCallback(() => {
    gameRef.current = createGame();
    setScore(0); setLives(3); setPhase("playing");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof CanvasRenderingContext2D === "undefined") return;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const game = gameRef.current;
    const brickWidth = (WIDTH - 48 - 8 * 9) / 10;
    const keys = new Set<string>();
    let frame = 0;
    let previous = 0;
    const moveTo = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      game.paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, (clientX - rect.left) / rect.width * WIDTH - PADDLE_WIDTH / 2));
    };
    const pointerMove = (event: PointerEvent) => moveTo(event.clientX);
    const keyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d"].includes(key)) event.preventDefault();
      keys.add(key);
    };
    const keyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    canvas.addEventListener("pointermove", pointerMove);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    const draw = (time: number) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.032) : 0;
      previous = time;
      if (game.phase === "playing") {
        if (keys.has("arrowleft") || keys.has("a")) game.paddleX -= 480 * dt;
        if (keys.has("arrowright") || keys.has("d")) game.paddleX += 480 * dt;
        game.paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, game.paddleX));
        game.x += game.vx * dt; game.y += game.vy * dt;
        if (game.x < 8 || game.x > WIDTH - 8) game.vx *= -1;
        if (game.y < 8) game.vy = Math.abs(game.vy);
        const paddleY = HEIGHT - 42;
        if (game.vy > 0 && game.y + 8 >= paddleY && game.y < paddleY + 12 && game.x >= game.paddleX && game.x <= game.paddleX + PADDLE_WIDTH) {
          const offset = (game.x - (game.paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
          game.vx = offset * 300;
          game.vy = -Math.sqrt(Math.max(210 * 210, 250 * 250 + 210 * 210 - game.vx * game.vx));
          game.y = paddleY - 8;
        }
        for (const brick of game.bricks) {
          if (!brick.alive || game.x + 8 < brick.x || game.x - 8 > brick.x + brickWidth || game.y + 8 < brick.y || game.y - 8 > brick.y + 22) continue;
          brick.alive = false; game.vy *= -1; game.score += 10; setScore(game.score);
          if (game.bricks.every((item) => !item.alive)) { game.phase = "won"; setPhase("won"); }
          break;
        }
        if (game.y - 8 > HEIGHT) {
          game.lives -= 1; setLives(game.lives);
          if (!game.lives) { game.phase = "lost"; setPhase("lost"); }
          else { game.x = WIDTH / 2; game.y = HEIGHT - 68; game.vx = 210 * (Math.random() < 0.5 ? -1 : 1); game.vy = -250; }
        }
      }
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
      bg.addColorStop(0, "#111827"); bg.addColorStop(1, "#0f172a");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      for (const brick of game.bricks) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color; ctx.beginPath(); ctx.roundRect(brick.x, brick.y, brickWidth, 22, 5); ctx.fill();
      }
      ctx.fillStyle = "#e2e8f0"; ctx.beginPath(); ctx.roundRect(game.paddleX, HEIGHT - 42, PADDLE_WIDTH, 12, 6); ctx.fill();
      ctx.fillStyle = "#67e8f9"; ctx.shadowColor = "#67e8f9"; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(game.x, game.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame); canvas.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp);
    };
  }, [phase]);

  const nudge = (direction: -1 | 1) => { gameRef.current.paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, gameRef.current.paddleX + direction * 44)); };
  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3, width: "100%", minWidth: 0, boxSizing: "border-box" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, gap: 2 }}>
        <Typography variant="body2" color="text.secondary">Move with ← →, A / D, or your pointer.</Typography>
        <Typography variant="body2" sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>Score {score} · Lives {lives}</Typography>
      </Box>
      <Box sx={{ position: "relative", overflow: "hidden", borderRadius: 2 }}>
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Breakout game board" style={{ display: "block", width: "100%", height: "auto", touchAction: "none" }} />
        {phase !== "playing" && <Box sx={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center", bgcolor: "#0f172acc", color: "white", p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>{phase === "won" ? "All clear!" : "Game over"}</Typography>
          <Typography sx={{ mb: 2 }}>{phase === "won" ? `You scored ${score} points.` : `Final score: ${score}.`}</Typography>
          <Button variant="contained" onClick={restart} sx={{ justifySelf: "center" }}>Play again</Button>
        </Box>}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 1.5 }}>
        <Button variant="outlined" onClick={() => nudge(-1)} aria-label="Move paddle left">← Left</Button>
        <Button variant="outlined" onClick={() => nudge(1)} aria-label="Move paddle right">Right →</Button>
      </Box>
    </Paper>
  );
}
