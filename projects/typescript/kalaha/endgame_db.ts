import { readFile, writeFile } from "node:fs/promises";
import { zobrist } from "./zobrist_hashing";

type DatabaseData = { max_seeds?: number; positions?: Record<string, number> };

export class EndgameDB {
  private positions: Record<string, number> = {};
  maxSeeds = 0;

  async load(path = "endgame_db.json"): Promise<void> {
    try {
      const data = JSON.parse(await readFile(path, "utf8")) as DatabaseData;
      this.positions = data.positions ?? {};
      this.maxSeeds = data.max_seeds ?? 0;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      this.positions = {};
      this.maxSeeds = 0;
    }
  }

  async save(path = "endgame_db.json"): Promise<void> {
    await writeFile(path, `${JSON.stringify({ max_seeds: this.maxSeeds, positions: this.positions }, null, 2)}\n`, "utf8");
  }

  lookup(board: readonly number[], player: 0 | 1): number | undefined {
    return this.positions[zobrist.computeHash(board, player)];
  }

  add(board: readonly number[], player: 0 | 1, score: number): void {
    this.positions[zobrist.computeHash(board, player)] = score;
    this.maxSeeds = Math.max(this.maxSeeds, board.reduce((sum, value) => sum + value, 0));
  }

  get size(): number { return Object.keys(this.positions).length; }
}
