"""Kalah / Kalaha rules engine.

Implements the standard Kalah(6, 4) ruleset:

  * Each player owns 6 pits plus one store ("kalah"); every pit starts with
    4 seeds, so 48 seeds are in play.
  * Sowing runs anticlockwise, one seed per pit, INCLUDING the sower's own
    store but SKIPPING the opponent's store.
  * Landing the last seed in your own store grants an extra turn.
  * Landing the last seed in a previously empty pit on your own side captures
    that seed plus every seed in the directly opposite pit, into your store.
  * The game ends as soon as one player's six pits are all empty; the opponent
    sweeps every seed still on their own side into their own store.  The higher
    total wins.

Board layout (a flat list of 14 ints)::

    index :  0  1  2  3  4  5   6   7  8  9 10 11 12   13
    owner : <----- P1 ----->  P1st <----- P2 ----->  P2st

Player 0 == "P1" (indices 0-5, store 6), player 1 == "P2" (indices 7-12,
store 13).  Sowing order is simply increasing index modulo 14, which is
anticlockwise on a physical board.
"""

from typing import List, Optional, Tuple

# --- Constants ---------------------------------------------------------------

P1_PITS = list(range(0, 6))
P1_STORE = 6
P2_PITS = list(range(7, 13))
P2_STORE = 13
TOTAL_PITS = 14

PITS_PER_PLAYER = 6
SEEDS_PER_PIT = 4          # standard Kalah(6, 4)
TOTAL_SEEDS = 2 * PITS_PER_PLAYER * SEEDS_PER_PIT

STORES = (P1_STORE, P2_STORE)


def pits_of(player: int) -> List[int]:
    """Pit indices owned by ``player`` (0 == P1, 1 == P2)."""
    return P1_PITS if player == 0 else P2_PITS


def store_of(player: int) -> int:
    """Store index owned by ``player``."""
    return P1_STORE if player == 0 else P2_STORE


def opposite_pit(idx: int) -> int:
    """The pit directly across the board from pit ``idx``.

    Pit 0 faces pit 12, pit 1 faces 11, ... pit 5 faces 7.  Stores have no
    opposite and must never be passed in.
    """
    if idx in STORES:
        raise ValueError("stores have no opposite pit")
    return 12 - idx


def initial_state() -> List[int]:
    """The standard Kalah(6, 4) opening position."""
    board = [0] * TOTAL_PITS
    for i in P1_PITS + P2_PITS:
        board[i] = SEEDS_PER_PIT
    return board


def legal_moves(board: List[int], player: int) -> List[int]:
    """Pit indices ``player`` may legally sow from (i.e. non-empty own pits)."""
    return [i for i in pits_of(player) if board[i] > 0]


def side_is_empty(board: List[int], player: int) -> bool:
    return all(board[i] == 0 for i in pits_of(player))


def is_terminal(board: List[int]) -> bool:
    """True once either player's six pits are all empty."""
    return side_is_empty(board, 0) or side_is_empty(board, 1)


def seeds_in_play(board: List[int]) -> int:
    """Seeds still sitting in pits (i.e. not yet banked in a store)."""
    return sum(board[i] for i in P1_PITS) + sum(board[i] for i in P2_PITS)


def evaluate(board: List[int]) -> int:
    """Raw store difference, from Player 1's point of view."""
    return board[P1_STORE] - board[P2_STORE]


def cleanup_board(board: List[int]) -> List[int]:
    """Apply the end-of-game sweep.

    Whichever side still holds seeds rakes them into that player's own store.
    Sweeping both sides is equivalent to sweeping only the non-empty one,
    because a terminal position always has at least one empty side.
    """
    new_board = list(board)
    for i in P1_PITS:
        new_board[P1_STORE] += new_board[i]
        new_board[i] = 0
    for i in P2_PITS:
        new_board[P2_STORE] += new_board[i]
        new_board[i] = 0
    return new_board


def winner(board: List[int]) -> Optional[int]:
    """0 if P1 wins, 1 if P2 wins, None on a draw.  Sweeps first."""
    final = cleanup_board(board)
    if final[P1_STORE] > final[P2_STORE]:
        return 0
    if final[P2_STORE] > final[P1_STORE]:
        return 1
    return None


def get_sowing_path(board: List[int], move: int, player: int) -> List[int]:
    """The ordered list of pits/stores that receive a seed for this move.

    Skips the opponent's store, so ``len(path) == board[move]`` always holds.
    """
    path: List[int] = []
    remaining = board[move]
    idx = move
    opponent_store = store_of(1 - player)

    while remaining > 0:
        idx = (idx + 1) % TOTAL_PITS
        if idx == opponent_store:
            continue
        path.append(idx)
        remaining -= 1

    return path


def apply_move(board: List[int], move: int, player: int) -> Tuple[List[int], bool]:
    """Sow the seeds from pit ``move`` for ``player``.

    Returns ``(new_board, extra_turn)``.  The input board is not mutated.
    """
    if move not in pits_of(player):
        raise ValueError(f"pit {move} is not owned by player {player}")
    if board[move] == 0:
        raise ValueError(f"pit {move} is empty; not a legal move")

    new_board = list(board)
    seeds = new_board[move]
    new_board[move] = 0

    own_store = store_of(player)
    opponent_store = store_of(1 - player)

    idx = move
    while seeds > 0:
        idx = (idx + 1) % TOTAL_PITS
        if idx == opponent_store:      # never sow into the opponent's store
            continue
        new_board[idx] += 1
        seeds -= 1

    # Rule: last seed in your own store -> play again.
    if idx == own_store:
        return new_board, True

    # Rule: last seed into a previously empty pit on your own side captures
    # that seed plus everything in the pit directly opposite.
    if idx in pits_of(player) and new_board[idx] == 1:
        facing = opposite_pit(idx)
        if new_board[facing] > 0:
            new_board[own_store] += new_board[facing] + 1
            new_board[facing] = 0
            new_board[idx] = 0

    return new_board, False


def move_report(board: List[int], move: int, player: int) -> dict:
    """Describe what a move does, without needing to diff two boards.

    Returns a dict with keys ``seeds``, ``path``, ``last``, ``extra_turn``,
    ``captured`` (0 when no capture) and ``capture_from``.
    """
    seeds = board[move]
    path = get_sowing_path(board, move, player)
    after, extra = apply_move(board, move, player)
    last = path[-1]

    # A capture happened iff the last seed landed on our own side in a pit that
    # was empty beforehand and the facing pit held something.
    captured = 0
    capture_from = None
    if not extra and last in pits_of(player):
        landed_in_empty = (board[last] + path.count(last)) == 1
        if landed_in_empty:
            facing = opposite_pit(last)
            seeds_facing = board[facing] + path.count(facing)
            if seeds_facing > 0:
                captured = seeds_facing + 1
                capture_from = facing

    return {
        "seeds": seeds,
        "path": path,
        "last": last,
        "extra_turn": extra,
        "captured": captured,
        "capture_from": capture_from,
        "board": after,
        "own_store_seeded": store_of(player) in path,
    }
