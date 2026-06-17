"""
Sudoku Solver Demo (Pyodide compatible)
Generates and solves a puzzle, prints the result.
"""
import sys
import os
import time

sys.path.insert(0, os.path.dirname(__file__))

from generator import generate_puzzle
from sudoku_utils import print_grid, grid_to_string, is_valid
from solvers.backtracking import solve as backtrack_solve
from solvers.ac3 import solve as ac3_solve

def run_demo():
    print("=== Sudoku Solver Demo ===\n")
    
    # Generate a puzzle
    print("Generating puzzle...")
    puzzle = generate_puzzle(difficulty="medium")
    
    print("\n--- Puzzle ---")
    print_grid(puzzle)
    
    # Solve with backtracking
    print("\nSolving with Backtracking...")
    board = [row[:] for row in puzzle]
    start = time.time()
    solved = backtrack_solve(board)
    elapsed = time.time() - start
    
    if solved:
        print(f"\n--- Solved (in {elapsed:.3f}s) ---")
        print_grid(board)
        
        # Verify
        if is_valid(board):
            print("\nSolution verified: VALID")
        else:
            print("\nSolution verified: INVALID")
    else:
        print("No solution found!")
    
    # Also demo AC3
    print("\n--- AC3 Solver ---")
    board2 = [row[:] for row in puzzle]
    start = time.time()
    solved2 = ac3_solve(board2)
    elapsed2 = time.time() - start
    
    if solved2:
        print(f"AC3 solved in {elapsed2:.3f}s")
        print_grid(board2)
    else:
        print("AC3 could not fully solve (may need backtracking)")

run_demo()
