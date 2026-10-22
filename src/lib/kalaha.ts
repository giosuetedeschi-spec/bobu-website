export type Player = 0 | 1;
export type KalahaBoard = number[];
export type Heuristic = "balanced" | "aggressive" | "defensive" | "basic";
export const P1_PITS = [0, 1, 2, 3, 4, 5] as const;
export const P1_STORE = 6;
export const P2_PITS = [7, 8, 9, 10, 11, 12] as const;
export const P2_STORE = 13;
export const BOARD_SIZE = 14;

export const pitsFor = (player: Player) => player === 0 ? P1_PITS : P2_PITS;
export const storeFor = (player: Player) => player === 0 ? P1_STORE : P2_STORE;
export const initialBoard = (seedsPerPit = 4): KalahaBoard => [seedsPerPit, seedsPerPit, seedsPerPit, seedsPerPit, seedsPerPit, seedsPerPit, 0, seedsPerPit, seedsPerPit, seedsPerPit, seedsPerPit, seedsPerPit, seedsPerPit, 0];

export function legalMoves(board: KalahaBoard, player: Player): number[] {
  return pitsFor(player).filter((pit) => board[pit] > 0);
}

export function isTerminal(board: KalahaBoard): boolean {
  return P1_PITS.every((pit) => board[pit] === 0) || P2_PITS.every((pit) => board[pit] === 0);
}

export function finishBoard(board: KalahaBoard): KalahaBoard {
  const result = [...board];
  for (const pit of P1_PITS) { result[P1_STORE] += result[pit]; result[pit] = 0; }
  for (const pit of P2_PITS) { result[P2_STORE] += result[pit]; result[pit] = 0; }
  return result;
}

export function applyMove(board: KalahaBoard, pit: number, player: Player): { board: KalahaBoard; extra: boolean } {
  if (!pitsFor(player).includes(pit as never) || board[pit] <= 0) throw new Error("Choose a non-empty pit on your side.");
  const result = [...board];
  let seeds = result[pit];
  result[pit] = 0;
  let position = pit;
  while (seeds > 0) {
    position = (position + 1) % BOARD_SIZE;
    if (position === storeFor(player === 0 ? 1 : 0)) continue;
    result[position]++;
    seeds--;
  }
  const extra = position === storeFor(player);
  if (!extra && pitsFor(player).includes(position as never) && result[position] === 1) {
    const opposite = 12 - position;
    if (result[opposite] > 0) {
      result[storeFor(player)] += result[opposite] + 1;
      result[position] = 0;
      result[opposite] = 0;
    }
  }
  return { board: result, extra };
}

export function evaluateBoard(board: KalahaBoard, strategy: Heuristic = "balanced"): number {
  const storeDifference = board[P1_STORE] - board[P2_STORE];
  if (strategy === "basic") return storeDifference;
  const sideDifference = P1_PITS.reduce<number>((sum, pit) => sum + board[pit], 0) - P2_PITS.reduce<number>((sum, pit) => sum + board[pit], 0);
  if (strategy === "defensive") return storeDifference + sideDifference * 0.8 - P1_PITS.filter((pit) => board[pit] === 0).length * 2;
  return storeDifference + sideDifference * (strategy === "aggressive" ? 0.3 : 0.5);
}

type Entry = { value: number; depth: number; bound: "exact" | "lower" | "upper" };

export function getBestMove(board: KalahaBoard, player: Player, depth = 6, strategy: Heuristic = "balanced"): { move: number | null; nodes: number } {
  const moves = legalMoves(board, player);
  if (!moves.length) return { move: null, nodes: 0 };
  const table = new Map<string, Entry>();
  let nodes = 0;
  const ordered = (position: KalahaBoard, turn: Player) => legalMoves(position, turn).map((pit) => {
    const next = applyMove(position, pit, turn);
    const storeGain = next.board[storeFor(turn)] - position[storeFor(turn)];
    const capture = storeGain > (position[pit] > 0 ? 0 : 1);
    return { pit, board: next.board, extra: next.extra, priority: (next.extra ? 1000 : 0) + (capture ? 500 : 0) + storeGain };
  }).sort((a, b) => b.priority - a.priority);

  const search = (position: KalahaBoard, turn: Player, remaining: number, alpha: number, beta: number): number => {
    nodes++;
    if (isTerminal(position)) {
      const final = finishBoard(position);
      return final[P1_STORE] - final[P2_STORE];
    }
    if (remaining <= 0) return evaluateBoard(position, strategy);
    const key = `${turn}:${position.join(",")}`;
    const originalAlpha = alpha;
    const originalBeta = beta;
    const cached = table.get(key);
    if (cached && cached.depth >= remaining) {
      if (cached.bound === "exact") return cached.value;
      if (cached.bound === "lower") alpha = Math.max(alpha, cached.value);
      if (cached.bound === "upper") beta = Math.min(beta, cached.value);
      if (alpha >= beta) return cached.value;
    }
    const maximizing = turn === 0;
    let value = maximizing ? -Infinity : Infinity;
    for (const candidate of ordered(position, turn)) {
      const nextTurn = candidate.extra ? turn : (1 - turn) as Player;
      const score = search(candidate.board, nextTurn, remaining - Number(!candidate.extra), alpha, beta);
      value = maximizing ? Math.max(value, score) : Math.min(value, score);
      if (maximizing) alpha = Math.max(alpha, value);
      else beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    const bound = value <= originalAlpha ? "upper" : value >= originalBeta ? "lower" : "exact";
    table.set(key, { value, depth: remaining, bound });
    return value;
  };

  let bestMove = moves[0];
  let bestValue = player === 0 ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;
  for (const candidate of ordered(board, player)) {
    const nextTurn = candidate.extra ? player : (1 - player) as Player;
    const score = search(candidate.board, nextTurn, depth - Number(!candidate.extra), alpha, beta);
    if ((player === 0 && score > bestValue) || (player === 1 && score < bestValue)) {
      bestValue = score;
      bestMove = candidate.pit;
    }
    if (player === 0) alpha = Math.max(alpha, bestValue);
    else beta = Math.min(beta, bestValue);
  }
  return { move: bestMove, nodes };
}
