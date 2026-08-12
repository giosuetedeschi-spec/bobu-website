"""Zobrist hashing for Kalaha positions.

A Zobrist hash XORs one random 64-bit key per (pit, seed-count) pair plus a
side-to-move key.  Two positions collide only if their key sets XOR to zero,
which for 64-bit keys is astronomically unlikely, so the hash is a safe key
for the transposition table and the endgame database.

The key table is built from a *seeded* ``random.Random`` instance rather than
the global ``random`` module, so every run of the demo produces identical
hashes and therefore identical, reproducible search behaviour.
"""

import random
from typing import List

NUM_PITS = 14
# Seeds per pit are bounded by the 48 seeds in play, but a generous ceiling
# costs nothing and keeps the table valid for non-standard variants.
MAX_SEEDS = 64
DEFAULT_SEED = 20240607


class ZobristHasher:
    def __init__(self, seed: int = DEFAULT_SEED) -> None:
        self.seed = seed
        self.rng = random.Random(seed)
        self.turn_hash: int = self.rng.getrandbits(64)
        self.table: List[List[int]] = [
            [self.rng.getrandbits(64) for _ in range(MAX_SEEDS)]
            for _ in range(NUM_PITS)
        ]

    def compute_hash(self, board: List[int], current_player: int) -> int:
        """Zobrist hash of ``board`` with ``current_player`` to move."""
        h = self.turn_hash if current_player == 1 else 0
        table = self.table
        for idx, seeds in enumerate(board):
            if seeds >= MAX_SEEDS:
                seeds = MAX_SEEDS - 1
            h ^= table[idx][seeds]
        return h


# Global instance used by the search and the endgame database.
zobrist = ZobristHasher()
