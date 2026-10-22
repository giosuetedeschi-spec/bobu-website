import { COLS, DIGITS, EMPTY, ROWS } from "../config";
import { Board, PEERS, parsePosition, positionKey } from "../sudoku-utils";

type Domains = Map<string, Set<string>>;

export class BacktrackingSolver {
  readonly board: Board;
  domains: Domains;

  constructor(board: Board) {
    this.board = board.map((row) => [...row]);
    this.domains = new Map();
    for (let row = 0; row < ROWS; row++) for (let column = 0; column < COLS; column++) {
      const value = this.board[row][column];
      this.domains.set(positionKey([row, column]), new Set(value === EMPTY ? DIGITS : [value]));
    }
    for (const [key, domain] of this.domains) {
      if (domain.size !== 1) continue;
      const value = [...domain][0];
      for (const peer of PEERS.get(key) ?? []) {
        if (this.domains.get(peer)?.size === 1 && this.domains.get(peer)?.has(value)) this.domains.get(peer)?.clear();
        else this.domains.get(peer)?.delete(value);
      }
    }
  }

  solve(): Board | null {
    const domains = this.cloneDomains(this.domains);
    return this.search(domains);
  }

  solveStepByStep(): Board[] {
    const steps: Board[] = [];
    const solution = this.search(this.cloneDomains(this.domains), steps);
    if (solution) steps.push(solution);
    return steps;
  }

  private search(domains: Domains, steps?: Board[]): Board | null {
    const unresolved = [...domains].filter(([, values]) => values.size > 1).sort((a, b) => a[1].size - b[1].size)[0];
    if (!unresolved) {
      if ([...domains.values()].some((values) => values.size !== 1)) return null;
      return Array.from({ length: ROWS }, (_, row) => Array.from({ length: COLS }, (_, column) =>
        [...domains.get(positionKey([row, column]))!][0],
      ));
    }
    const [key, values] = unresolved;
    const ordered = [...values].sort((a, b) => this.conflicts(domains, key, a) - this.conflicts(domains, key, b));
    for (const value of ordered) {
      const branch = this.cloneDomains(domains);
      branch.set(key, new Set([value]));
      if (this.propagate(branch, key, value)) {
        if (steps) steps.push(this.partialBoard(branch));
        const solution = this.search(branch, steps);
        if (solution) return solution;
      }
    }
    return null;
  }

  private propagate(domains: Domains, key: string, value: string): boolean {
    const queue: Array<[string, string]> = [[key, value]];
    while (queue.length) {
      const [position, assigned] = queue.pop()!;
      for (const peer of PEERS.get(position) ?? []) {
        const peerDomain = domains.get(peer)!;
        if (!peerDomain.has(assigned)) continue;
        peerDomain.delete(assigned);
        if (peerDomain.size === 0) return false;
        if (peerDomain.size === 1) queue.push([peer, [...peerDomain][0]]);
      }
    }
    return true;
  }

  private conflicts(domains: Domains, key: string, value: string): number {
    return [...(PEERS.get(key) ?? [])].filter((peer) => domains.get(peer)?.has(value)).length;
  }

  private partialBoard(domains: Domains): Board {
    return Array.from({ length: ROWS }, (_, row) => Array.from({ length: COLS }, (_, column) => {
      const values = domains.get(positionKey([row, column]))!;
      return values.size === 1 ? [...values][0] : EMPTY;
    }));
  }

  private cloneDomains(domains: Domains): Domains {
    return new Map([...domains].map(([key, values]) => [key, new Set(values)]));
  }
}
