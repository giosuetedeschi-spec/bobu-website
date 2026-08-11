"""Endgame database for Kalaha.

Stores *exact* game-theoretic values (final store difference from Player 1's
point of view, under perfect play) for positions with few enough seeds left in
play that the search resolved them all the way to a terminal position.

Only genuinely proven values are inserted.  The search calls :meth:`add` after
a subtree has been explored with no depth cut-off **and** no alpha/beta window
cut-off, which is precisely the condition under which the returned value is the
true minimax value rather than a bound or a heuristic estimate.  Because those
values are strategy-independent, the database stays valid across searches that
use different evaluation heuristics — unlike the transposition table.

The database lives in memory.  ``dump``/``restore`` are provided for callers
that want to persist it (the browser demo never does, so nothing is read from
or written to disk at import time).
"""

from typing import Dict, List, Optional

try:
    from zobrist_hashing import zobrist
    from game_logic import seeds_in_play
except ImportError:  # pragma: no cover - package-style import fallback
    from kalaha.zobrist_hashing import zobrist
    from kalaha.game_logic import seeds_in_play

# Positions with more seeds than this are not worth memoising: they are rarely
# revisited and would bloat the table.
DEFAULT_MAX_SEEDS = 14


class EndgameDB:
    def __init__(self, max_seeds: int = DEFAULT_MAX_SEEDS) -> None:
        self.db: Dict[int, int] = {}
        self.max_seeds: int = max_seeds
        self.hits: int = 0
        self.stores: int = 0

    # --- queries ------------------------------------------------------------

    def covers(self, board: List[int]) -> bool:
        """Cheap gate: is this position small enough to possibly be stored?"""
        return seeds_in_play(board) <= self.max_seeds

    def lookup(self, board: List[int], player: int) -> Optional[int]:
        """Exact value for this position, or ``None`` if not solved yet."""
        value = self.db.get(zobrist.compute_hash(board, player))
        if value is not None:
            self.hits += 1
        return value

    def add(self, board: List[int], player: int, score: int) -> None:
        """Record a proven exact value."""
        if not self.covers(board):
            return
        key = zobrist.compute_hash(board, player)
        if key not in self.db:
            self.stores += 1
        self.db[key] = int(score)

    # --- maintenance --------------------------------------------------------

    def clear(self) -> None:
        self.db.clear()
        self.hits = 0
        self.stores = 0

    def __len__(self) -> int:
        return len(self.db)

    def dump(self) -> dict:
        """Serialisable snapshot (JSON needs string keys)."""
        return {
            "max_seeds": self.max_seeds,
            "positions": {str(k): v for k, v in self.db.items()},
        }

    def restore(self, data: dict) -> None:
        self.max_seeds = int(data.get("max_seeds", DEFAULT_MAX_SEEDS))
        self.db = {int(k): int(v) for k, v in data.get("positions", {}).items()}


# Global instance used by the search.
endgame_db = EndgameDB()
