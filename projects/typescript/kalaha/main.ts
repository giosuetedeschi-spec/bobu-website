import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { applySowingMove, cleanupBoard, initialState, isGameOver, legalMovesFor, P1_STORE, P2_STORE, type Player } from "./game_logic";
import { getBestKalahaMove } from "./ai_engine";
import type { Heuristic } from "../../../src/lib/kalaha";

export type MatchMode = "human-human" | "human-ai" | "ai-human" | "ai-ai";

export function formatBoard(board: readonly number[]): string {
  const opponent = board.slice(7, 13).reverse().map((value) => String(value).padStart(2)).join("  ");
  const own = board.slice(0, 6).map((value) => String(value).padStart(2)).join("  ");
  return [
    `        ${opponent}`,
    `   (${String(board[P2_STORE]).padStart(2)})${" ".repeat(28)}(${String(board[P1_STORE]).padStart(2)})`,
    `        ${own}`,
  ].join("\n");
}

export function parseMatchOptions(args: string[]): { mode: MatchMode; depth: number; strategy: Heuristic } {
  const [rawMode = "human-ai", rawDepth = "4", rawStrategy = "balanced"] = args;
  const modes: MatchMode[] = ["human-human", "human-ai", "ai-human", "ai-ai"];
  const strategies: Heuristic[] = ["basic", "balanced", "defensive", "aggressive"];
  if (!modes.includes(rawMode as MatchMode)) throw new Error(`Mode must be one of: ${modes.join(", ")}.`);
  const depth = Number(rawDepth);
  if (!Number.isInteger(depth) || depth < 1 || depth > 12) throw new Error("Search depth must be an integer from 1 to 12.");
  if (!strategies.includes(rawStrategy as Heuristic)) throw new Error(`Strategy must be one of: ${strategies.join(", ")}.`);
  return { mode: rawMode as MatchMode, depth, strategy: rawStrategy as Heuristic };
}

export async function playKalaha(mode: MatchMode, depth: number, strategy: Heuristic): Promise<void> {
  const input = createInterface({ input: stdin, output: stdout });
  let board = initialState();
  let currentPlayer: Player = 0;
  let moveNumber = 0;
  try {
    while (!isGameOver(board) && moveNumber < 300) {
      console.log(`\nTurn ${moveNumber + 1} · Player ${currentPlayer + 1}${"\n"}${formatBoard(board)}`);
      const isHuman = mode === "human-human" || (mode === "human-ai" && currentPlayer === 0) || (mode === "ai-human" && currentPlayer === 1);
      let pit: number;
      if (isHuman) {
        const legal = legalMovesFor(board, currentPlayer);
        while (true) {
          const answer = await input.question(`Choose pit 1–6 (legal: ${legal.map((index) => index % 7 + 1).join(", ")}): `);
          const selected = Number(answer.trim());
          const candidate = currentPlayer === 0 ? selected - 1 : selected + 6;
          if (Number.isInteger(selected) && selected >= 1 && selected <= 6 && legal.includes(candidate)) {
            pit = candidate;
            break;
          }
          console.log("That pit is empty or the selection is invalid.");
        }
      } else {
        const [move] = getBestKalahaMove(board, currentPlayer, depth, strategy);
        if (move === null) break;
        pit = move;
        console.log(`Computer chooses pit ${currentPlayer === 0 ? pit + 1 : pit - 6}.`);
      }
      const result = applySowingMove(board, pit, currentPlayer);
      board = result.board;
      moveNumber++;
      if (result.extra) console.log("Extra turn.");
      else currentPlayer = currentPlayer === 0 ? 1 : 0;
    }
  } finally {
    input.close();
  }
  board = cleanupBoard(board);
  console.log(`\n${formatBoard(board)}\nGame over. Player 1: ${board[P1_STORE]} · Player 2: ${board[P2_STORE]}`);
  console.log(board[P1_STORE] === board[P2_STORE] ? "Draw." : `Player ${board[P1_STORE] > board[P2_STORE] ? 1 : 2} wins.`);
}

if (process.argv[1] && /(?:^|[/\\])main\.(?:ts|js)$/.test(process.argv[1])) {
  const { mode, depth, strategy } = parseMatchOptions(process.argv.slice(2));
  await playKalaha(mode, depth, strategy);
}
