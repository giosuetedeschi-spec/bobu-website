export const BLOCK_W = 3;
export const BLOCK_H = 3;
export const ROWS = BLOCK_H * 3;
export const COLS = BLOCK_W * 3;
export const DIGITS = Array.from({ length: Math.max(ROWS, COLS) }, (_, i) => String(i + 1));
export const EMPTY = ".";

export const CELL_SIZE = 50;
export const MARGIN = 20;
export const PANEL_WIDTH = 250;
export const SPEEDS = [0, 0.05, 0.1, 0.25, 0.5] as const;
