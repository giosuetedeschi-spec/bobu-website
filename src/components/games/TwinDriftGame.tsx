"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const W = 720;
const H = 460;
const CX = 360;
const CY = 230;
const RX = 250;
const RY = 145;
const OUTER_X = 295;
const OUTER_Y = 190;
const INNER_X = 205;
const INNER_Y = 100;
type Car = { x: number; y: number; vx: number; vy: number; angle: number };
type Race = { car: Car; rivalAngle: number; previousTrackAngle: number; laps: number; rivalLaps: number; score: number; time: number; done: boolean };

function createRace(): Race {
  return {
    car: { x: CX + RX, y: CY, vx: 0, vy: 0, angle: Math.PI / 2 },
    rivalAngle: Math.PI,
    previousTrackAngle: 0,
    laps: 0,
    rivalLaps: 0,
    score: 0,
    time: 90,
    done: false,
  };
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, label: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#111827";
  ctx.fillRect(-12, -13, 8, 5); ctx.fillRect(7, -13, 8, 5);
  ctx.fillRect(-12, 8, 8, 5); ctx.fillRect(7, 8, 8, 5);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(-12, -19, 24, 38, 7); ctx.fill();
  ctx.fillStyle = "#cbd5e1";
  ctx.beginPath(); ctx.roundRect(-8, -12, 16, 11, 4); ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath(); ctx.roundRect(-8, 3, 16, 9, 3); ctx.fill();
  ctx.fillStyle = "#f8fafc"; ctx.fillRect(-8, -18, 5, 2); ctx.fillRect(3, -18, 5, 2);
  ctx.restore();
  ctx.fillStyle = "#f8fafc"; ctx.font = "600 12px system-ui"; ctx.textAlign = "center";
  ctx.fillText(label, x, y - 29);
}

export function TwinDriftGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raceRef = useRef<Race>(createRace());
  const keysRef = useRef(new Set<string>());
  const [score, setScore] = useState(0);
  const [laps, setLaps] = useState(0);
  const [time, setTime] = useState(90);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("Finish three laps before the rival. Hold a turn while accelerating to drift.");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof CanvasRenderingContext2D === "undefined") return;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const keys = keysRef.current;
    let frame = 0;
    let last = 0;
    let scoreTick = 0;
    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(key)) event.preventDefault();
      keys.add(key);
    };
    const onUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", onDown); window.addEventListener("keyup", onUp);

    const draw = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.032) : 0;
      last = now;
      const race = raceRef.current;
      const car = race.car;
      if (!race.done) {
        race.time = Math.max(0, race.time - dt);
        const accelerate = keys.has("arrowup") || keys.has("w") ? 1 : 0;
        const brake = keys.has("arrowdown") || keys.has("s") ? 1 : 0;
        const steer = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
        const forwardX = Math.cos(car.angle); const forwardY = Math.sin(car.angle);
        let forward = car.vx * forwardX + car.vy * forwardY;
        forward = Math.max(-120, Math.min(300, forward + accelerate * 190 * dt - brake * 250 * dt));
        if (!accelerate && !brake) forward *= Math.pow(0.985, dt * 60);
        const onTrack = ((car.x - CX) ** 2 / RX ** 2 + (car.y - CY) ** 2 / RY ** 2) > 0.55 &&
          ((car.x - CX) ** 2 / RX ** 2 + (car.y - CY) ** 2 / RY ** 2) < 1.65;
        const turnRate = (0.55 + Math.min(Math.abs(forward) / 150, 1.25)) * (forward < 0 ? -1 : 1);
        car.angle += steer * turnRate * dt;
        const drifting = accelerate > 0 && steer !== 0 && Math.abs(forward) > 95;
        const traction = drifting ? 0.965 : 0.82;
        const sideX = -Math.sin(car.angle); const sideY = Math.cos(car.angle);
        const side = car.vx * sideX + car.vy * sideY;
        car.vx = Math.cos(car.angle) * forward + sideX * side * traction;
        car.vy = Math.sin(car.angle) * forward + sideY * side * traction;
        car.x += car.vx * dt; car.y += car.vy * dt;
        if (car.x < 24 || car.x > W - 24) car.vx *= -0.5;
        if (car.y < 24 || car.y > H - 24) car.vy *= -0.5;
        car.x = Math.max(24, Math.min(W - 24, car.x)); car.y = Math.max(24, Math.min(H - 24, car.y));

        if (drifting && onTrack) {
          race.score += Math.round(Math.abs(side) * dt * 0.16);
          scoreTick += dt;
          if (scoreTick > 0.4) { setScore(race.score); scoreTick = 0; }
        }
        const trackPosition = (car.x - CX) ** 2 / RX ** 2 + (car.y - CY) ** 2 / RY ** 2;
        const onTrackNow = trackPosition > 0.55 && trackPosition < 1.65;
        const trackAngle = (Math.atan2((car.y - CY) / RY, (car.x - CX) / RX) + Math.PI * 2) % (Math.PI * 2);
        if (onTrackNow && race.previousTrackAngle > 5.2 && trackAngle < 1.1 && forward > 40) { race.laps += 1; setLaps(race.laps); }
        race.previousTrackAngle = trackAngle;
        race.rivalAngle += dt * 0.9;
        if (race.rivalAngle >= Math.PI * 3) { race.rivalAngle -= Math.PI * 2; race.rivalLaps += 1; }
        setTime(Math.ceil(race.time));
        if (race.laps >= 3 || race.rivalLaps >= 3 || race.time <= 0) {
          race.done = true; setDone(true);
          setMessage(race.laps >= 3 && race.laps > race.rivalLaps ? "You win! Great driving." : race.laps === race.rivalLaps ? "Time! It's a photo finish." : "The rival takes the win. Try another run!");
        }
      }

      ctx.fillStyle = "#183b2d"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#64748b"; ctx.beginPath(); ctx.ellipse(CX, CY, OUTER_X, OUTER_Y, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#183b2d"; ctx.beginPath(); ctx.ellipse(CX, CY, INNER_X, INNER_Y, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 2; ctx.setLineDash([18, 16]);
      ctx.beginPath(); ctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#f8fafc"; ctx.font = "700 13px system-ui"; ctx.textAlign = "center"; ctx.fillText("START / FINISH", CX, CY - OUTER_Y + 28);
      const rivalX = CX + RX * Math.cos(race.rivalAngle); const rivalY = CY + RY * Math.sin(race.rivalAngle);
      drawCar(ctx, rivalX, rivalY, Math.atan2(RY * Math.cos(race.rivalAngle), -RX * Math.sin(race.rivalAngle)), "#fb7185", "RIVAL");
      drawCar(ctx, car.x, car.y, car.angle, "#38bdf8", "YOU");
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  const reset = () => {
    raceRef.current = createRace(); setScore(0); setLaps(0); setTime(90); setDone(false);
    setMessage("Finish three laps before the rival. Hold a turn while accelerating to drift.");
  };
  const hold = (key: string, pressed: boolean) => {
    if (pressed) keysRef.current.add(key);
    else keysRef.current.delete(key);
  };
  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3, width: "100%", maxWidth: 900, minWidth: 0, boxSizing: "border-box", mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">Steer: ← → or A / D · Accelerate: ↑ / W · Brake: ↓ / S</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>Lap {Math.min(laps + 1, 3)}/3 · Drift {score} · {time}s</Typography>
      </Box>
      <Box sx={{ position: "relative", overflow: "hidden", borderRadius: 2 }}>
        <canvas ref={canvasRef} width={W} height={H} aria-label="Twin Drift race track" style={{ display: "block", width: "100%", height: "auto" }} />
        {done && <Box sx={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", gap: 1, textAlign: "center", bgcolor: "#0f172acc", color: "white", p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{message}</Typography>
          <Typography>Drift score: {score}</Typography><Button variant="contained" onClick={reset} sx={{ justifySelf: "center", mt: 1 }}>Race again</Button>
        </Box>}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
        {[["arrowleft", "←"], ["arrowright", "→"], ["arrowup", "Accelerate"], ["arrowdown", "Brake"]].map(([key, label]) => (
          <Button key={key} variant="outlined" aria-label={label === "←" || label === "→" ? `Steer ${label === "←" ? "left" : "right"}` : label}
            onPointerDown={() => hold(key, true)} onPointerUp={() => hold(key, false)} onPointerLeave={() => hold(key, false)} onPointerCancel={() => hold(key, false)}
            sx={{ touchAction: "none", userSelect: "none" }}>{label}</Button>
        ))}
      </Box>
      <Typography role="status" aria-live="polite" sx={{ mt: 1, color: "text.secondary", textAlign: "center" }}>{done ? "" : message}</Typography>
    </Paper>
  );
}
