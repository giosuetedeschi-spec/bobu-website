import { applyMove, finishBoard, initialBoard, isTerminal, legalMoves, type KalahaBoard, type Player } from "../../../src/lib/kalaha";
export type { KalahaBoard, Player } from "../../../src/lib/kalaha";

export const P1_PITS = [0, 1, 2, 3, 4, 5] as const;
export const P1_STORE = 6;
export const P2_PITS = [7, 8, 9, 10, 11, 12] as const;
export const P2_STORE = 13;
export const TOTAL_PITS = 14;
export const SEEDS_PER_PIT = 6;

export const initialState = (): KalahaBoard => initialBoard(SEEDS_PER_PIT);
export const legalMovesFor = legalMoves;
export const isGameOver = isTerminal;
export const evaluate = (board: KalahaBoard) => board[P1_STORE] - board[P2_STORE];
export const cleanupBoard = finishBoard;
export const applySowingMove = applyMove;

export function getSowingPath(board: KalahaBoard, move: number, player: Player): number[] {
  const path: number[] = [];
  for (let seeds = board[move], position = move; seeds > 0; seeds--) {
    position = (position + 1) % TOTAL_PITS;
    if (position === (player === 0 ? P2_STORE : P1_STORE)) { seeds++; continue; }
    path.push(position);
  }
  return path;
}
