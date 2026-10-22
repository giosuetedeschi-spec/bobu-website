import { COLS, DIGITS, EMPTY, ROWS } from "../config";
import { Board, PEERS, positionKey } from "../sudoku-utils";
import { BacktrackingSolver } from "./backtracking";

export class AC3Solver {
  readonly board: Board;
  readonly domains = new Map<string, Set<string>>();

  constructor(board: Board) {
    this.board = board.map((row) => [...row]);
    for (let row = 0; row < ROWS; row++) for (let column = 0; column < COLS; column++) {
      const value = this.board[row][column];
      this.domains.set(positionKey([row, column]), new Set(value === EMPTY ? DIGITS : [value]));
    }
  }

  solve(): Board | null {
    const queue = [...this.domains.keys()].flatMap((cell) => [...(PEERS.get(cell) ?? [])].map((peer) => [cell, peer] as const));
    while (queue.length) {
      const [left, right] = queue.shift()!;
      const a = this.domains.get(left)!;
      const b = this.domains.get(right)!;
      const unsupported = [...a].filter((value) => ![...b].some((other) => other !== value));
      if (!unsupported.length) continue;
      for (const value of unsupported) a.delete(value);
      if (!a.size) return null;
      for (const peer of PEERS.get(left) ?? []) if (peer !== right) queue.push([peer, left]);
    }

    const solver = new BacktrackingSolver(this.board);
    solver.domains = new Map([...this.domains].map(([key, values]) => [key, new Set(values)]));
    return solver.solve();
  }
}
