"""Sudoku puzzle generation.

A Sudoku is only a Sudoku if it has *exactly one* solution. Punching random
holes in a solved grid does not give you that -- it usually leaves a puzzle
with many solutions, which is why a solver's answer then disagrees with the
grid it was carved from.

So removal here is guarded: a clue is only taken out if the puzzle still has a
unique completion, proven by counting solutions with an early exit as soon as a
second one turns up.
"""

import random

from config import ROWS, COLS, EMPTY, DIGITS, BLOCK_W, BLOCK_H
from solvers.backtracking import BacktrackingSolver


def _peers(r, c):
    """Every cell that shares a row, column or block with (r, c)."""
    out = set()
    for i in range(COLS):
        out.add((r, i))
    for i in range(ROWS):
        out.add((i, c))
    br = (r // BLOCK_H) * BLOCK_H
    bc = (c // BLOCK_W) * BLOCK_W
    for rr in range(br, br + BLOCK_H):
        for cc in range(bc, bc + BLOCK_W):
            out.add((rr, cc))
    out.discard((r, c))
    return out


PEERS = {(r, c): _peers(r, c) for r in range(ROWS) for c in range(COLS)}


def _candidates(board, r, c):
    used = {board[pr][pc] for pr, pc in PEERS[(r, c)]}
    return [d for d in DIGITS if d not in used]


def count_solutions(board, cap=2):
    """Number of solutions, counting no further than `cap`.

    Stopping at 2 is all the caller needs: 1 means unique, 2 means ambiguous.
    """
    grid = [row[:] for row in board]

    def search():
        # Most-constrained cell first -- it prunes the tree fastest.
        best = None
        best_opts = None
        for r in range(ROWS):
            for c in range(COLS):
                if grid[r][c] != EMPTY:
                    continue
                opts = _candidates(grid, r, c)
                if not opts:
                    return 0
                if best is None or len(opts) < len(best_opts):
                    best, best_opts = (r, c), opts
                    if len(opts) == 1:
                        break
            if best_opts is not None and len(best_opts) == 1:
                break

        if best is None:
            return 1  # every cell filled

        r, c = best
        total = 0
        for d in best_opts:
            grid[r][c] = d
            total += search()
            grid[r][c] = EMPTY
            if total >= cap:
                return total
        return total

    return search()


def has_unique_solution(board):
    return count_solutions(board, cap=2) == 1


def generate_sudoku(remove_count=45, seed=None):
    """Return (puzzle, solution, stats).

    `remove_count` is a target, not a promise: removal stops early when no
    remaining clue can be taken out without making the puzzle ambiguous.
    """
    rng = random.Random(seed)

    # A solved grid: seed the three independent diagonal blocks, then solve.
    board = [[EMPTY for _ in range(COLS)] for _ in range(ROWS)]
    for i in range(0, min(ROWS, COLS), BLOCK_H):
        digits = list(DIGITS)
        rng.shuffle(digits)
        idx = 0
        for rr in range(i, min(i + BLOCK_H, ROWS)):
            for cc in range(i, min(i + BLOCK_W, COLS)):
                board[rr][cc] = digits[idx]
                idx += 1

    solution = BacktrackingSolver(board).solve()
    if not solution:
        empty = [[EMPTY] * COLS for _ in range(ROWS)]
        return empty, empty, {"removed": 0, "clues": 0, "rejected": 0, "unique": False}

    # Carve holes, keeping the solution unique at every step.
    puzzle = [row[:] for row in solution]
    cells = [(r, c) for r in range(ROWS) for c in range(COLS)]
    rng.shuffle(cells)

    removed = 0
    rejected = 0
    for r, c in cells:
        if removed >= remove_count:
            break
        saved = puzzle[r][c]
        puzzle[r][c] = EMPTY
        if has_unique_solution(puzzle):
            removed += 1
        else:
            puzzle[r][c] = saved  # putting it back is what keeps the puzzle fair
            rejected += 1

    stats = {
        "removed": removed,
        "clues": ROWS * COLS - removed,
        "rejected": rejected,
        "unique": True,
        "seed": seed,
    }
    return puzzle, solution, stats
