"""Sudoku solver demo (runs under Pyodide, stdout only).

Generates a puzzle with a guaranteed-unique solution, then puts three
different solving strategies on the same puzzle and compares them.
"""

import random
import time

from config import ROWS, COLS, EMPTY
from generator import generate_sudoku, count_solutions
from sudoku_utils import print_board
from solvers.backtracking import BacktrackingSolver
from solvers.ac3 import AC3Solver
from solvers.simulated_annealing import SimulatedAnnealingSolver

RULE = "─" * 62


def header(text):
    print()
    print(f"── {text} " + "─" * max(0, 58 - len(text)))


def clue_count(board):
    return sum(1 for r in range(ROWS) for c in range(COLS) if board[r][c] != EMPTY)


def run_demo(seed=None):
    if seed is None:
        seed = random.randrange(1, 10_000)

    print("╔" + "═" * 60 + "╗")
    print("║" + "SUDOKU — GENERATE, THEN SOLVE THREE WAYS".center(60) + "║")
    print("╚" + "═" * 60 + "╝")
    print(f"\n  seed {seed} — the same seed always produces this exact puzzle.")

    # ---------------------------------------------------------------- generate
    header("GENERATING")
    start = time.time()
    puzzle, solution, stats = generate_sudoku(remove_count=45, seed=seed)
    gen_time = time.time() - start

    print(f"  Removed {stats['removed']} cells, leaving {clue_count(puzzle)} clues.")
    print(f"  Rejected {stats['rejected']} removals that would have made the puzzle ambiguous.")
    print(f"  Generated in {gen_time:.2f}s.")

    print()
    print_board(puzzle)

    header("UNIQUENESS")
    n = count_solutions(puzzle, cap=2)
    print(f"  Solutions found (counting up to 2): {n}")
    print(f"  Unique solution: {n == 1}")
    print("  A puzzle with more than one solution is not a valid Sudoku —")
    print("  every clue above was only removed because the answer stayed unique.")

    # ------------------------------------------------------------------ solvers
    results = []

    header("SOLVER 1 — BACKTRACKING (MRV + LCV + propagation)")
    start = time.time()
    solved = BacktrackingSolver(puzzle).solve()
    elapsed = time.time() - start
    ok = solved == solution
    results.append(("Backtracking", elapsed, ok))
    print(f"  Solved in {elapsed:.3f}s — matches the generator's grid: {ok}")

    header("SOLVER 2 — AC-3 CONSTRAINT PROPAGATION (+ search fallback)")
    start = time.time()
    solved_ac3 = AC3Solver(puzzle).solve()
    elapsed = time.time() - start
    ok3 = solved_ac3 == solution
    results.append(("AC-3", elapsed, ok3))
    print(f"  Solved in {elapsed:.3f}s — matches the generator's grid: {ok3}")

    header("SOLVER 3 — SIMULATED ANNEALING (stochastic)")
    start = time.time()
    try:
        solved_sa = SimulatedAnnealingSolver(puzzle, seed=seed).solve()
    except TypeError:
        solved_sa = SimulatedAnnealingSolver(puzzle).solve()
    elapsed = time.time() - start
    okSA = solved_sa == solution
    results.append(("Simulated annealing", elapsed, okSA))
    if solved_sa:
        print(f"  Finished in {elapsed:.3f}s — matches the generator's grid: {okSA}")
    else:
        print(f"  Gave up after {elapsed:.3f}s — annealing is not complete;")
        print("  it can settle into a local minimum and never reach the answer.")

    # ------------------------------------------------------------------ result
    header("SOLUTION")
    print_board(solution)

    header("SCOREBOARD")
    print(f"  {'solver':<24}{'time':>10}   correct")
    print("  " + RULE[:44])
    for name, elapsed, correct in results:
        print(f"  {name:<24}{elapsed:>9.3f}s   {'yes' if correct else 'no'}")

    agree = [name for name, _, correct in results if correct]
    print()
    print(f"  {len(agree)} of {len(results)} solvers reproduced the unique solution.")
    print("\n  Press 'Run Again' for a new puzzle.")


run_demo()
