# sudoku_utils.py
from typing import List, Tuple, Dict, Set
from config import ROWS, COLS, DIGITS, BLOCK_H, BLOCK_W, EMPTY

def parse_fen(fen: str) -> List[List[str]]:
    """Parse a fen-like string into a board."""
    tokens = []
    fen = fen.replace('\n', ' ').strip()
    row = []
    for ch in fen:
        if ch.isspace():
            continue
        if ch == '\\':
            if row:
                tokens.append(row)
                row = []
            continue
        if ch in DIGITS:
            row.append(ch)
        elif ch in '.0':
            row.append(EMPTY)
    if row:
        tokens.append(row)
    
    # Pad or trim to fit standard size if necessary (basic robustness)
    board = []
    for r in range(ROWS):
        if r < len(tokens):
            row_data = tokens[r]
            current_row = [c if c in DIGITS else EMPTY for c in row_data]
            # pad row
            while len(current_row) < COLS:
                current_row.append(EMPTY)
            board.append(current_row[:COLS])
        else:
            board.append([EMPTY] * COLS)
    return board

def print_board(board: List[List[str]]) -> None:
    w = 2
    sep_h = '+'.join(['-' * (BLOCK_W * (w + 1))] * (COLS // BLOCK_W))
    for r in range(ROWS):
        if r > 0 and r % BLOCK_H == 0:
            print(sep_h)
        row_str = []
        for c in range(COLS):
            if c > 0 and c % BLOCK_W == 0:
                row_str.append('|')
            val = board[r][c]
            row_str.append(f"{val if val != EMPTY else '.':>{w}}")
        print(' '.join(row_str))

def block_index(r: int, c: int) -> Tuple[int, int]:
    return (r // BLOCK_H, c // BLOCK_W)

def get_peers() -> Dict[Tuple[int,int], Set[Tuple[int,int]]]:
    peers = {}
    for r in range(ROWS):
        for c in range(COLS):
            s = set()
            for cc in range(COLS):
                if cc != c: s.add((r, cc))
            for rr in range(ROWS):
                if rr != r: s.add((rr, c))
            
            br, bc = block_index(r, c)
            r0, c0 = br * BLOCK_H, bc * BLOCK_W
            for rr in range(r0, r0 + BLOCK_H):
                for cc in range(c0, c0 + BLOCK_W):
                    if (rr, cc) != (r, c):
                        s.add((rr, cc))
            peers[(r,c)] = s
    return peers

PEERS = get_peers()
