# solvers/__init__.py
from solvers.backtracking import BacktrackingSolver
from solvers.ac3 import AC3Solver
from solvers.simulated_annealing import SimulatedAnnealingSolver

class SudokuSolver:
    def __init__(self, board):
        self.board = board
        
    def solve(self, strategy='backtracking'):
        if strategy == 'backtracking':
            return BacktrackingSolver(self.board).solve()
        elif strategy == 'ac3':
            return AC3Solver(self.board).solve()
        elif strategy == 'simulated_annealing':
            return SimulatedAnnealingSolver(self.board).solve()
        else:
            raise ValueError(f"Unknown strategy: {strategy}")
