import { evaluateBoard, getBestMove, type Heuristic, type KalahaBoard, type Player } from "../../../src/lib/kalaha";

export const MAX_DEPTH = 6;
export const evaluateHeuristic = (board: KalahaBoard, _player: Player, strategy: Heuristic = "balanced") => evaluateBoard(board, strategy);

export function getBestKalahaMove(board: KalahaBoard, player: Player, depth = MAX_DEPTH, strategy: Heuristic = "balanced"): [number | null, number] {
  const result = getBestMove(board, player, depth, strategy);
  return [result.move, result.nodes];
}
