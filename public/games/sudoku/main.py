"""
Sudoku Solver Demo (Pyodide compatible)
Generates a puzzle, solves it with two different solvers, prints the results.
"""
import time

from generator import generate_sudoku
from sudoku_utils import print_board
from solvers.backtracking import BacktrackingSolver
from solvers.ac3 import AC3Solver


def run_demo():
    print("=== Sudoku Solver Demo ===\n")

    print("Generating puzzle...")
    puzzle, solution = generate_sudoku(remove_count=45)

    print("\n--- Puzzle ---")
    print_board(puzzle)

    print("\nSolving with Backtracking (MRV + LCV + propagation)...")
    start = time.time()
    solved = BacktrackingSolver(puzzle).solve()
    elapsed = time.time() - start

    if solved:
        print(f"\n--- Solved in {elapsed:.3f}s ---")
        print_board(solved)
        print("\nMatches generator solution:", solved == solution)
    else:
        print("Backtracking failed to solve the puzzle!")

    print("\nSolving with AC-3 (+ backtracking fallback)...")
    start = time.time()
    solved_ac3 = AC3Solver(puzzle).solve()
    elapsed = time.time() - start

    if solved_ac3:
        print(f"AC-3 solved it in {elapsed:.3f}s")
    else:
        print("AC-3 could not fully solve the puzzle.")

    print("\nDemo complete. Press 'Run Again' for a new puzzle.")


run_demo()
