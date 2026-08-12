"""Kalaha search engine: negamax-style alpha-beta with a transposition table
and an exact endgame database.

Design notes
------------
*Extra turns.*  In Kalah a move that ends in your own store lets you move
again, so the side to move does not alternate on every ply.  The search
therefore recurses with the *same* maximising flag and the *same* remaining
depth after an extra turn: the position is still the same player's decision,
just further along.  This terminates because every extra turn banks at least
one seed into a store and seeds never leave a store, bounding any chain of
extra turns by the 48 seeds in play.

*Transposition table.*  Entries store (value, depth, flag) where the flag
records whether the value is exact or only a bound, determined by comparing the
final value against the *original* alpha/beta window.  Getting that wrong (for
example by always writing ``EXACT``) makes the table return fail-high/fail-low
values as if they were true scores and silently corrupts the search — the bug
this version fixes.

Heuristic leaf values depend on the evaluation strategy, so the table is keyed
per strategy.  Two AIs with different personalities can share a process without
poisoning each other's cached scores.

*Endgame database.*  Values proven all the way to a terminal position with no
depth cut-off and no window cut-off are strategy-independent and permanently
true, so they go into a separate, shared, never-invalidated table.
"""

import random
from typing import Dict, List, Optional, Tuple

try:
    from game_logic import (
        legal_moves, apply_move, is_terminal, evaluate, cleanup_board,
        seeds_in_play, pits_of, store_of,
        P1_PITS, P2_PITS, P1_STORE, P2_STORE,
    )
    from zobrist_hashing import zobrist
    from endgame_db import endgame_db
except ImportError:  # pragma: no cover - package-style import fallback
    from kalaha.game_logic import (
        legal_moves, apply_move, is_terminal, evaluate, cleanup_board,
        seeds_in_play, pits_of, store_of,
        P1_PITS, P2_PITS, P1_STORE, P2_STORE,
    )
    from kalaha.zobrist_hashing import zobrist
    from kalaha.endgame_db import endgame_db

MAX_DEPTH = 6
INF = float("inf")
DEFAULT_SEED = 12345

# strategy -> {hash: (value, depth, flag)}
TT: Dict[str, Dict[int, Tuple[float, int, str]]] = {}

NODES_VISITED = 0
TT_HITS = 0

_RNG = random.Random(DEFAULT_SEED)


def set_seed(seed: int) -> None:
    """Reseed the tie-breaking RNG so a game is exactly reproducible."""
    global _RNG
    _RNG = random.Random(seed)


def reset_tables() -> None:
    """Drop every cached score (used between independent demos)."""
    TT.clear()
    endgame_db.clear()


def _tt_for(strategy: str) -> Dict[int, Tuple[float, int, str]]:
    table = TT.get(strategy)
    if table is None:
        table = {}
        TT[strategy] = table
    return table


def tt_size() -> int:
    return sum(len(t) for t in TT.values())


# --- evaluation --------------------------------------------------------------

def evaluate_heuristic(board: List[int], player: int = 0, strategy: str = "balanced") -> float:
    """Static evaluation, always from Player 1's (the maximiser's) point of view.

    ``player`` is accepted for backwards compatibility and ignored: returning a
    side-relative score here while the search treats the value as absolute was
    a sign-flip waiting to happen.
    """
    store_diff = board[P1_STORE] - board[P2_STORE]
    if strategy == "basic":
        return float(store_diff)

    p1_side = sum(board[i] for i in P1_PITS)
    p2_side = sum(board[i] for i in P2_PITS)
    side_diff = p1_side - p2_side

    score = float(store_diff)
    if strategy == "balanced":
        score += 0.5 * side_diff
    elif strategy == "defensive":
        score += 0.8 * side_diff
        empty_p1 = sum(1 for i in P1_PITS if board[i] == 0)
        score -= 2.0 * empty_p1
    elif strategy == "aggressive":
        score += 0.3 * side_diff
        # Reward seeds parked close to our own store: they are the ones we can
        # bank quickly and the hardest for the opponent to take.
        score += 0.2 * sum(board[i] * (i + 1) for i in P1_PITS) / 6.0
        score -= 0.2 * sum(board[i] * (i - 6) for i in P2_PITS) / 6.0
    return score


def order_moves(board: List[int], moves: List[int], player: int) -> List[int]:
    """Order moves best-first so alpha-beta prunes more.

    Extra turns first, then captures, then bigger immediate store gains.  A
    small seeded jitter breaks ties so repeated games are varied but still
    perfectly reproducible for a given seed.
    """
    own_store = store_of(player)
    scored = []
    for move in moves:
        after, extra = apply_move(board, move, player)
        gain = after[own_store] - board[own_store]
        priority = float(gain)
        if extra:
            priority += 1000.0
        # A capture banks strictly more than the single seed a pass over our
        # own store would contribute.
        if gain > 1 and not extra:
            priority += 500.0
        priority += _RNG.random() * 0.01
        scored.append((priority, move))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [m for _, m in scored]


# --- search ------------------------------------------------------------------

def _terminal_value(board: List[int]) -> float:
    final = cleanup_board(board)
    return float(final[P1_STORE] - final[P2_STORE])


def alphabeta(board: List[int], depth: int, alpha: float, beta: float,
              maximizing_player: bool, strategy: str = "balanced") -> Tuple[float, bool]:
    """Alpha-beta search.

    Returns ``(value, exact)`` where ``exact`` is True only when the value is
    the true minimax value of the position under perfect play: no depth
    cut-off and no window cut-off anywhere in the subtree.  Only such values
    are safe to file in the endgame database.
    """
    global NODES_VISITED, TT_HITS
    NODES_VISITED += 1

    player = 0 if maximizing_player else 1

    # 1. Exact endgame database: cheap gate first, hash only if it can hit.
    small = endgame_db.covers(board)
    if small:
        proven = endgame_db.lookup(board, player)
        if proven is not None:
            return float(proven), True

    table = _tt_for(strategy)
    key = zobrist.compute_hash(board, player)

    # 2. Transposition table.
    entry = table.get(key)
    if entry is not None:
        value, entry_depth, flag = entry
        if entry_depth >= depth:
            if flag == "EXACT":
                TT_HITS += 1
                return value, entry_depth >= 100
            if flag == "LOWERBOUND" and value >= beta:
                TT_HITS += 1
                return value, False
            if flag == "UPPERBOUND" and value <= alpha:
                TT_HITS += 1
                return value, False

    # 3. Terminal position: exact by definition, whatever the depth left.
    if is_terminal(board):
        value = _terminal_value(board)
        endgame_db.add(board, player, int(value))
        table[key] = (value, 100, "EXACT")
        return value, True

    # 4. Depth limit: a heuristic guess, never exact.
    if depth <= 0:
        value = evaluate_heuristic(board, 0, strategy)
        table[key] = (value, 0, "EXACT")
        return value, False

    alpha_orig, beta_orig = alpha, beta
    moves = order_moves(board, legal_moves(board, player), player)

    exact = True          # cleared by any cut-off or inexact child
    cut = False

    if maximizing_player:
        value = -INF
        for move in moves:
            child, extra = apply_move(board, move, 0)
            # An extra turn keeps the move with the same player at the same
            # depth; a normal move passes the turn and costs a ply.
            if extra:
                score, child_exact = alphabeta(child, depth, alpha, beta, True, strategy)
            else:
                score, child_exact = alphabeta(child, depth - 1, alpha, beta, False, strategy)
            exact = exact and child_exact
            if score > value:
                value = score
            if value > alpha:
                alpha = value
            if alpha >= beta:
                cut = True
                break
    else:
        value = INF
        for move in moves:
            child, extra = apply_move(board, move, 1)
            if extra:
                score, child_exact = alphabeta(child, depth, alpha, beta, False, strategy)
            else:
                score, child_exact = alphabeta(child, depth - 1, alpha, beta, True, strategy)
            exact = exact and child_exact
            if score < value:
                value = score
            if value < beta:
                beta = value
            if beta <= alpha:
                cut = True
                break

    # Classify the result against the ORIGINAL window.  This is what makes the
    # table safe to reuse.
    if value <= alpha_orig:
        flag = "UPPERBOUND"
    elif value >= beta_orig:
        flag = "LOWERBOUND"
    else:
        flag = "EXACT"

    exact = exact and not cut and flag == "EXACT"

    if exact:
        table[key] = (value, 100, "EXACT")
        if small:
            endgame_db.add(board, player, int(value))
    else:
        table[key] = (value, depth, flag)

    return value, flag == "EXACT" and exact


# Backwards-compatible alias for the older name.
def alphabeta_tt_db(board, depth, alpha, beta, maximizing_player, strategy="balanced"):
    return alphabeta(board, depth, alpha, beta, maximizing_player, strategy)[0]


def get_best_move(board: List[int], player: int, depth: int = MAX_DEPTH,
                  strategy: str = "balanced") -> Tuple[Optional[int], int]:
    """Pick a move for ``player``.  Returns ``(move, nodes_analysed)``."""
    move, nodes, _ = search(board, player, depth, strategy)
    return move, nodes


def search(board: List[int], player: int, depth: int = MAX_DEPTH,
           strategy: str = "balanced") -> Tuple[Optional[int], int, float]:
    """Root search.  Returns ``(best_move, nodes_analysed, best_value)``.

    ``best_value`` is always from Player 1's point of view, so P1 maximises it
    and P2 minimises it.
    """
    global NODES_VISITED, TT_HITS
    NODES_VISITED = 0
    TT_HITS = 0

    moves = order_moves(board, legal_moves(board, player), player)
    if not moves:
        return None, 0, evaluate_heuristic(board, 0, strategy)

    best_move = moves[0]
    best_value = -INF if player == 0 else INF
    alpha, beta = -INF, INF

    for move in moves:
        child, extra = apply_move(board, move, player)
        if extra:
            score, _ = alphabeta(child, depth, alpha, beta, player == 0, strategy)
        else:
            score, _ = alphabeta(child, depth - 1, alpha, beta, player != 0, strategy)

        if player == 0:
            if score > best_value:
                best_value, best_move = score, move
            alpha = max(alpha, best_value)
        else:
            if score < best_value:
                best_value, best_move = score, move
            beta = min(beta, best_value)

    return best_move, NODES_VISITED, best_value
