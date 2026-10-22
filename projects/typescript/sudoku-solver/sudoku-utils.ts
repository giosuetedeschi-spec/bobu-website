import { BLOCK_H, BLOCK_W, COLS, DIGITS, EMPTY, ROWS } from "./config";

export type Board = string[][];
export type Position = readonly [row: number, column: number];
export type Peers = Map<string, Set<string>>;

export const positionKey = ([row, column]: Position) => `${row},${column}`;
export const parsePosition = (key: string): Position => key.split(",").map(Number) as unknown as Position;

export function parseFen(fen: string): Board {
  const rows: string[][] = [];
  let row: string[] = [];
  for (const character of fen.replaceAll("\n", " ").trim()) {
    if (/\s/.test(character)) continue;
    if (character === "\\") {
      if (row.length) rows.push(row);
      row = [];
    } else if (DIGITS.includes(character)) row.push(character);
    else if (character === "." || character === "0") row.push(EMPTY);
  }
  if (row.length) rows.push(row);
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const value = rows[r]?.[c];
      return value && DIGITS.includes(value) ? value : EMPTY;
    }),
  );
}

export function formatBoard(board: Board): string {
  return board.map((row) => row.map((value) => value === EMPTY ? "." : value).join(" ")).join("\n");
}

export function blockIndex(row: number, column: number): Position {
  return [Math.floor(row / BLOCK_H), Math.floor(column / BLOCK_W)];
}

export function getPeers(): Peers {
  const peers: Peers = new Map();
  for (let row = 0; row < ROWS; row++) for (let column = 0; column < COLS; column++) {
    const cells = new Set<string>();
    for (let i = 0; i < COLS; i++) {
      if (i !== column) cells.add(positionKey([row, i]));
      if (i !== row) cells.add(positionKey([i, column]));
    }
    const [blockRow, blockColumn] = blockIndex(row, column);
    for (let r = blockRow * BLOCK_H; r < (blockRow + 1) * BLOCK_H; r++) {
      for (let c = blockColumn * BLOCK_W; c < (blockColumn + 1) * BLOCK_W; c++) {
        if (r !== row || c !== column) cells.add(positionKey([r, c]));
      }
    }
    peers.set(positionKey([row, column]), cells);
  }
  return peers;
}

export const PEERS = getPeers();
