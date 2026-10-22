# solvers/simulated_annealing.py
import random
import math
from config import ROWS, COLS, DIGITS, EMPTY, BLOCK_H, BLOCK_W
from sudoku_utils import block_index

class SimulatedAnnealingSolver:
    def __init__(self, board):
        self.original_board = [row[:] for row in board]
        self.answer_board = None
        
    def solve(self):
        # Initialize: fill blocks with random permutations of missing numbers
        current_board = self._init_random_blocks(self.original_board)
        score = self._calculate_score(current_board)
        best_score = score
        self.answer_board = [r[:] for r in current_board]
        
        temperature = 1.0
        cooling_rate = 0.99
        steps = 0
        max_steps = 100000

        while score > 0 and steps < max_steps:
            steps += 1
            temperature *= cooling_rate
            
            # Propose neighbor
            prev_board = [r[:] for r in current_board]
            
            # Pick a random block
            br = random.randint(0, (ROWS // BLOCK_H) - 1)
            bc = random.randint(0, (COLS // BLOCK_W) - 1)
            
            # Try to swap two mutable cells in that block
            self._swap_in_block(current_board, br, bc)
            
            new_score = self._calculate_score(current_board)
            delta = new_score - score
            
            # Acceptance probability
            if delta < 0 or math.exp(-delta / temperature) > random.random():
                score = new_score
                if score < best_score:
                    best_score = score
                    self.answer_board = [r[:] for r in current_board]
                    # print(f"New best score: {score}")
            else:
                # Revert
                current_board = prev_board
                
            # Random restart if stuck
            if steps % 2000 == 0:
                 temperature += 0.5 

        if score == 0:
            return current_board
        return None # Failed to converge

    def _init_random_blocks(self, board):
        new_board = [row[:] for row in board]
        for br in range(ROWS // BLOCK_H):
            for bc in range(COLS // BLOCK_W):
                # Gather missing numbers in this block
                needed = set(DIGITS)
                fixed = []
                mutable_pos = []
                
                r0, c0 = br * BLOCK_H, bc * BLOCK_W
                for r in range(r0, r0 + BLOCK_H):
                    for c in range(c0, c0 + BLOCK_W):
                        val = board[r][c]
                        if val != EMPTY:
                            if val in needed: needed.remove(val)
                            fixed.append((r,c))
                        else:
                            mutable_pos.append((r,c))
                
                # Fill mutable with random shuffle of needed
                needed_list = list(needed)
                random.shuffle(needed_list)
                for i, (r, c) in enumerate(mutable_pos):
                    new_board[r][c] = needed_list[i]
        return new_board

    def _swap_in_block(self, board, br, bc):
        # Identify mutable positions (those that were EMPTY in original)
        mutable = []
        r0, c0 = br * BLOCK_H, bc * BLOCK_W
        for r in range(r0, r0 + BLOCK_H):
            for c in range(c0, c0 + BLOCK_W):
                if self.original_board[r][c] == EMPTY:
                    mutable.append((r,c))
        
        if len(mutable) < 2: return
        
        a, b = random.sample(mutable, 2)
        # Swap
        board[a[0]][a[1]], board[b[0]][b[1]] = board[b[0]][b[1]], board[a[0]][a[1]]

    def _calculate_score(self, board):
        # Score = number of duplicates in rows + cols
        # Because we ensure blocks are correct by construction, we only check rows/cols
        errors = 0
        
        # Rows
        for r in range(ROWS):
            seen = set()
            for c in range(COLS):
                v = board[r][c]
                if v in seen: errors += 1
                seen.add(v)
                
        # Cols
        for c in range(COLS):
            seen = set()
            for r in range(ROWS):
                v = board[r][c]
                if v in seen: errors += 1
                seen.add(v)
                
        return errors
