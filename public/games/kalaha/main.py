"""Kalaha (Kalah 6,4) - non-interactive AI vs AI demo.

Runs entirely on the Python standard library plus the sibling modules
``game_logic``, ``ai_engine``, ``zobrist_hashing`` and ``endgame_db``, so it
works unchanged under Pyodide in the browser.  There is no input(), no
pygame/tkinter, and nothing is read from or written to disk.

Search bounds were chosen for the browser: Pyodide runs roughly 3-10x slower
than CPython, so both engines search to depth 7 (with extra turns costing no
depth, which effectively deepens the tree further).  That keeps a whole game
well under a second natively and comfortably inside the ~10s browser budget.
"""

import time

from game_logic import (
    initial_state, legal_moves, apply_move, is_terminal, cleanup_board,
    move_report, side_is_empty, seeds_in_play, winner,
    P1_PITS, P2_PITS, P1_STORE, P2_STORE,
    SEEDS_PER_PIT, PITS_PER_PLAYER, TOTAL_SEEDS,
)
from ai_engine import search, set_seed, reset_tables, tt_size, TT_HITS
from endgame_db import endgame_db
import ai_engine

# --- demo configuration ------------------------------------------------------

SEED = 20260811          # fixed so every visitor sees the identical game
DEPTH = 7                # plies of lookahead for both engines
MAX_PLIES = 250          # hard safety bound; real games finish far sooner

PLAYERS = (
    {"name": "ARES", "label": "P1", "strategy": "aggressive", "depth": DEPTH},
    {"name": "ATHENA", "label": "P2", "strategy": "defensive", "depth": DEPTH},
)

WIDTH = 62


# --- presentation ------------------------------------------------------------

def banner(text: str) -> None:
    print("╔" + "═" * (WIDTH - 2) + "╗")
    print("║" + text.center(WIDTH - 2) + "║")
    print("╚" + "═" * (WIDTH - 2) + "╝")


def section(text: str) -> None:
    print()
    print("── " + text + " " + "─" * max(0, WIDTH - 5 - len(text)))


def render(board, highlight=None):
    """Draw the board with box-drawing characters.

    P2's pits run right-to-left along the top row, P1's left-to-right along the
    bottom, which is how the seeds actually travel (anticlockwise).
    """
    def cell(idx):
        mark = "*" if highlight is not None and idx == highlight else " "
        return "%s%2d " % (mark, board[idx])

    top = [cell(i) for i in reversed(P2_PITS)]
    bottom = [cell(i) for i in P1_PITS]

    pad = " " * 7
    print(pad + "     " + "   ".join("%d" % n for n in range(PITS_PER_PLAYER, 0, -1)) + "        P2 pits")
    print(pad + "┌────┬────┬────┬────┬────┬────┐")
    print("  ┌────┤" + "│".join(top) + "├────┐")
    print("  │%3d ├────┼────┼────┼────┼────┼────┤%3d │" % (board[P2_STORE], board[P1_STORE]))
    print("  └────┤" + "│".join(bottom) + "├────┘")
    print(pad + "└────┴────┴────┴────┴────┴────┘")
    print(pad + "     " + "   ".join("%d" % n for n in range(1, PITS_PER_PLAYER + 1)) + "        P1 pits")
    print("  P2 store                                      P1 store")


def pit_label(idx):
    """Human pit name: each player numbers their own pits 1..6."""
    return (idx + 1) if idx in P1_PITS else (idx - 6)


def show_rules():
    section("RULES (standard Kalah 6,4)")
    print("  · %d pits per player plus one store each; %d seeds per pit (%d total)."
          % (PITS_PER_PLAYER, SEEDS_PER_PIT, TOTAL_SEEDS))
    print("  · Sow anticlockwise, one seed per pit, INCLUDING your own store")
    print("    but SKIPPING your opponent's store.")
    print("  · Last seed in your own store  -> you move again.")
    print("  · Last seed in an empty pit on YOUR side -> you capture it plus")
    print("    every seed in the pit directly opposite.")
    print("  · When one side runs empty the opponent sweeps their remaining")
    print("    seeds into their own store.  Most seeds wins.")


def show_setup():
    section("ENGINES")
    print("  Random seed ......... %d  (fixed: this game replays identically)" % SEED)
    for cfg in PLAYERS:
        print("  %-6s (%s) ....... alpha-beta, depth %d, '%s' evaluation"
              % (cfg["name"], cfg["label"], cfg["depth"], cfg["strategy"]))
    print("  Extra turns do not consume a ply, so lines with chained free")
    print("  moves are searched deeper than %d." % DEPTH)


# --- the game ----------------------------------------------------------------

def play():
    set_seed(SEED)
    reset_tables()

    board = initial_state()
    player = 0
    ply = 0
    total_nodes = 0
    captures = [0, 0]
    extra_turns = [0, 0]
    started = time.time()

    section("OPENING POSITION")
    render(board)

    section("GAME")
    while not is_terminal(board) and ply < MAX_PLIES:
        cfg = PLAYERS[player]
        move, nodes, value = search(board, player, cfg["depth"], cfg["strategy"])
        total_nodes += nodes

        if move is None:                       # unreachable: side_is_empty is terminal
            print("  %s has no legal move." % cfg["name"])
            break

        report = move_report(board, move, player)
        ply += 1

        print()
        print("  Move %-3d %s (%s) sows pit %d  (%d seed%s)"
              % (ply, cfg["name"], cfg["label"], pit_label(move),
                 report["seeds"], "" if report["seeds"] == 1 else "s"))
        print("           searched %s nodes, eval %+0.1f for P1" % (f"{nodes:,}", value))

        notes = []
        if report["own_store_seeded"]:
            notes.append("banks a seed in its store")
        if report["captured"]:
            notes.append("CAPTURES %d seeds from pit %d opposite"
                         % (report["captured"], pit_label(report["capture_from"])))
            captures[player] += report["captured"]
        if report["extra_turn"]:
            notes.append("lands in its own store -> FREE MOVE")
            extra_turns[player] += 1
        if notes:
            print("           -> " + "; ".join(notes) + ".")

        board = report["board"]
        render(board, highlight=report["last"])

        if not report["extra_turn"]:
            player = 1 - player

    elapsed = time.time() - started

    # --- end of game: the sweep ---
    section("END OF GAME")
    empty_side = 0 if side_is_empty(board, 0) else 1
    remaining = seeds_in_play(board)
    if remaining:
        print("  %s's pits are empty, so %s sweeps the %d remaining seed%s into"
              % (PLAYERS[empty_side]["name"], PLAYERS[1 - empty_side]["name"],
                 remaining, "" if remaining == 1 else "s"))
        print("  their own store.")
    else:
        print("  Every seed is already banked.")

    final = cleanup_board(board)
    render(final)

    p1, p2 = final[P1_STORE], final[P2_STORE]
    section("RESULT")
    print("  %-8s (P1)  %2d seeds   %d captures, %d free moves"
          % (PLAYERS[0]["name"], p1, captures[0], extra_turns[0]))
    print("  %-8s (P2)  %2d seeds   %d captures, %d free moves"
          % (PLAYERS[1]["name"], p2, captures[1], extra_turns[1]))
    print("  " + "-" * 52)
    won = winner(final)
    if won is None:
        print("  DRAW at %d-%d." % (p1, p2))
    else:
        print("  %s (%s) WINS %d-%d by %d seeds."
              % (PLAYERS[won]["name"], PLAYERS[won]["label"],
                 max(p1, p2), min(p1, p2), abs(p1 - p2)))
    assert p1 + p2 == TOTAL_SEEDS, "seed conservation violated"
    print("  All %d seeds accounted for." % TOTAL_SEEDS)

    section("SEARCH STATISTICS")
    print("  Plies played ................. %d" % ply)
    print("  Positions evaluated .......... %s" % f"{total_nodes:,}")
    print("  Transposition table entries .. %s" % f"{tt_size():,}")
    print("  Exact endgame positions solved %s (<= %d seeds in play)"
          % (f"{len(endgame_db):,}", endgame_db.max_seeds))
    print("  Endgame database hits ........ %s" % f"{endgame_db.hits:,}")
    print("  Wall clock ................... %.2fs" % elapsed)


def main():
    banner("KALAHA  ·  ALPHA-BETA AI vs AI")
    print("  A complete game of Kalah(6,4) played out by two search engines,")
    print("  move by move.  Everything below is computed live in your browser.")
    show_rules()
    show_setup()
    play()
    print()
    print("  Deterministic: the same seed always produces this exact game.")
    print("  Press 'Run Again' to replay it.")


main()
