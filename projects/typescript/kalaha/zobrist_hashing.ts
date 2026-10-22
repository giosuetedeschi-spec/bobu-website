const NUM_PITS = 14;
const MAX_SEEDS = 100;

function seededRandom(seed: bigint) {
  let state = seed & ((1n << 64n) - 1n);
  return () => {
    state ^= state << 13n;
    state ^= state >> 7n;
    state ^= state << 17n;
    return state & ((1n << 64n) - 1n);
  };
}

export class ZobristHasher {
  private readonly table: bigint[][];
  private readonly turnHash: bigint;

  constructor(seed = 0x4b414c414841n) {
    const random = seededRandom(seed);
    this.table = Array.from({ length: NUM_PITS }, () => Array.from({ length: MAX_SEEDS }, random));
    this.turnHash = random();
  }

  computeHash(board: readonly number[], currentPlayer: 0 | 1): string {
    if (board.length !== NUM_PITS) throw new Error("Kalaha boards must have 14 pits.");
    let hash = currentPlayer === 1 ? this.turnHash : 0n;
    for (let index = 0; index < NUM_PITS; index++) {
      const seeds = Math.max(0, Math.min(MAX_SEEDS - 1, board[index]));
      hash ^= this.table[index][seeds];
    }
    return hash.toString(16);
  }
}

export const zobrist = new ZobristHasher();
