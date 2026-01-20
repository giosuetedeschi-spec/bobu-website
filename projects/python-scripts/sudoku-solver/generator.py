# generator.py
import random
from config import ROWS, COLS, EMPTY, DIGITS
from solvers.backtracking import BacktrackingSolver

def generate_sudoku(remove_count=40):
    # 1. Start with empty board
    board = [[EMPTY for _ in range(COLS)] for _ in range(ROWS)]
    
    # 2. Fill diagonal blocks randomly (independent, so valid)
    # This speeds up solving significantly
    # Only works for Standard square blocks, assuming ROWS=9, BLOCK=3
    from config import BLOCK_W, BLOCK_H
    
    for i in range(0, ROWS, BLOCK_H):
        # We only do this if diagonal blocks don't overlap rows/cols with each other
        # For standard 9x9 (3x3 blocks), blocks at (0,0), (3,3), (6,6) are independent
        r, c = i, i
        if r < ROWS and c < COLS:
            digits = list(DIGITS)
            random.shuffle(digits)
            idx = 0
            for rr in range(r, r + BLOCK_H):
                for cc in range(c, c + BLOCK_W):
                    board[rr][cc] = digits[idx]
                    idx += 1
                    
    # 3. Solve to fill the rest
    solver = BacktrackingSolver(board)
    solution = solver.solve()
    
    if not solution:
        # Fallback if config is weird
        return [[EMPTY]*COLS]*ROWS, [[EMPTY]*COLS]*ROWS

    # 4. Remove elements
    puzzle = [row[:] for row in solution]
    
    attempts = remove_count
    while attempts > 0:
        r = random.randint(0, ROWS-1)
        c = random.randint(0, COLS-1)
        if puzzle[r][c] != EMPTY:
            puzzle[r][c] = EMPTY
            attempts -= 1
            
    return puzzle, solution
