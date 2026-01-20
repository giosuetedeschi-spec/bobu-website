# solvers/ac3.py
from collections import deque
from sudoku_utils import PEERS
from config import ROWS, COLS, DIGITS, EMPTY

class AC3Solver:
    def __init__(self, board):
        self.board = [row[:] for row in board]
        self.domains = {}
        for r in range(ROWS):
            for c in range(COLS):
                v = self.board[r][c]
                self.domains[(r,c)] = {v} if v != EMPTY else set(DIGITS)

    def solve(self):
        # Initial Arc Consistency
        queue = deque()
        for pos in self.domains:
            for peer in PEERS[pos]:
                queue.append((pos, peer))
        
        while queue:
            xi, xj = queue.popleft()
            if self._revise(xi, xj):
                if not self.domains[xi]:
                    return None # Contradiction
                for xk in PEERS[xi]:
                    if xk != xj:
                        queue.append((xk, xi))
        
        # After AC3, if not solved, usually we fall back to backtracking on reduced domains.
        # But for this specific 'AC3' strategy demo, we return the reduced board or fail if not unique.
        # Ideally, we chain it with backtracking.
        
        # Check if solved
        if all(len(self.domains[pos]) == 1 for pos in self.domains):
             return [[next(iter(self.domains[(r,c)])) for c in range(COLS)] for r in range(ROWS)]
        
        # If not fully solved, try to return partially solved or run backtracking on remaining
        from solvers.backtracking import BacktrackingSolver
        bt = BacktrackingSolver(self.board)
        bt.domains = self.domains # Inject reduced domains
        return bt.solve()

    def _revise(self, xi, xj):
        revised = False
        to_remove = set()
        for x in self.domains[xi]:
            # If no value y in dom(xj) allows (x,y) to satisfy constraint (x != y)
            if not any(y != x for y in self.domains[xj]):
                to_remove.add(x)
        if to_remove:
            self.domains[xi] -= to_remove
            revised = True
        return revised
