"""Rules tests for Kalah(6, 4).

These pin the five rules that distinguish Kalah from a generic mancala, each
of which is easy to get subtly wrong:

  1. sowing runs anticlockwise, one seed per pit
  2. sowing passes your own store but SKIPS your opponent's
  3. landing your last seed in your own store earns another turn
  4. landing your last seed in an empty pit on your own side captures that
     seed plus everything in the pit directly opposite
  5. when one side empties, the other player sweeps their remaining seeds

Run with: python3 tests.py
"""

import unittest

from game_logic import (
    initial_state, legal_moves, is_terminal, evaluate, cleanup_board,
    apply_move, opposite_pit, seeds_in_play, winner,
    P1_PITS, P2_PITS, P1_STORE, P2_STORE, SEEDS_PER_PIT, TOTAL_SEEDS,
)


class TestBoard(unittest.TestCase):

    def test_initial_state(self):
        board = initial_state()
        self.assertEqual(len(board), 14)
        self.assertEqual(TOTAL_SEEDS, 48)
        for i in P1_PITS + P2_PITS:
            self.assertEqual(board[i], SEEDS_PER_PIT, f"pit {i}")
        self.assertEqual(board[P1_STORE], 0)
        self.assertEqual(board[P2_STORE], 0)
        self.assertEqual(sum(board), TOTAL_SEEDS)

    def test_opposite_pit_pairs_the_two_sides(self):
        # The standard pairing: pit i faces pit 12 - i.
        self.assertEqual(opposite_pit(0), 12)
        self.assertEqual(opposite_pit(5), 7)
        self.assertEqual(opposite_pit(7), 5)
        self.assertEqual(opposite_pit(12), 0)

    def test_legal_moves_are_non_empty_pits_on_your_side(self):
        board = initial_state()
        self.assertEqual(legal_moves(board, 0), [0, 1, 2, 3, 4, 5])
        self.assertEqual(legal_moves(board, 1), [7, 8, 9, 10, 11, 12])
        board[0] = 0
        self.assertEqual(legal_moves(board, 0), [1, 2, 3, 4, 5])


class TestSowing(unittest.TestCase):

    def test_sows_one_seed_per_pit_anticlockwise(self):
        board = initial_state()
        after, _ = apply_move(board, 0, 0)
        self.assertEqual(after[0], 0, "source emptied")
        for i in (1, 2, 3, 4):
            self.assertEqual(after[i], SEEDS_PER_PIT + 1, f"pit {i} got one seed")
        self.assertEqual(after[5], SEEDS_PER_PIT, "the fifth pit is out of reach of 4 seeds")
        self.assertEqual(after[P1_STORE], 0, "4 seeds from pit 0 never reach the store")
        self.assertEqual(sum(after), TOTAL_SEEDS, "no seed created or destroyed")

    def test_extra_turn_when_the_last_seed_lands_in_your_store(self):
        board = initial_state()
        # Pit 2 holds 4 seeds: they fall in pits 3, 4, 5 and then the store.
        after, again = apply_move(board, 2, 0)
        self.assertEqual(after[P1_STORE], 1)
        self.assertTrue(again, "landing in your own store earns another turn")

    def test_no_extra_turn_otherwise(self):
        board = initial_state()
        _, again = apply_move(board, 0, 0)
        self.assertFalse(again)

    def test_sowing_skips_the_opponent_store(self):
        board = [0] * 14
        board[5] = 9          # enough to wrap past P2's side and back round
        # Seed the two pits the lap ends in, so the last seed does not land in
        # an empty own pit and trigger a capture we are not testing here.
        board[0] = 1
        board[1] = 1
        after, _ = apply_move(board, 5, 0)
        self.assertEqual(after[P1_STORE], 1, "own store receives one seed")
        self.assertEqual(after[P2_STORE], 0, "opponent store is skipped")
        self.assertEqual(sum(after), 11)

    def test_player_two_skips_player_one_store(self):
        board = [0] * 14
        board[12] = 9
        board[7] = 1
        board[8] = 1
        after, _ = apply_move(board, 12, 1)
        self.assertEqual(after[P2_STORE], 1)
        self.assertEqual(after[P1_STORE], 0, "P1's store is skipped by P2")
        self.assertEqual(sum(after), 11)


class TestCapture(unittest.TestCase):

    def test_capture_from_an_empty_own_pit(self):
        board = [0] * 14
        board[0] = 1      # one seed, lands in pit 1
        board[1] = 0      # which is empty and on our own side
        board[11] = 5     # the pit opposite pit 1
        after, again = apply_move(board, 0, 0)
        self.assertEqual(after[1], 0, "landing pit emptied into the store")
        self.assertEqual(after[11], 0, "opposite pit captured")
        self.assertEqual(after[P1_STORE], 6, "1 landing seed + 5 captured")
        self.assertFalse(again)
        self.assertEqual(sum(after), 6)

    def test_no_capture_when_the_opposite_pit_is_empty(self):
        board = [0] * 14
        board[0] = 1
        board[1] = 0
        board[11] = 0
        after, _ = apply_move(board, 0, 0)
        self.assertEqual(after[P1_STORE], 0, "nothing to capture, so no capture")
        self.assertEqual(after[1], 1, "the seed just sits there")

    def test_no_capture_landing_on_the_opponent_side(self):
        board = [0] * 14
        board[5] = 3      # sows into the store, then pits 7 and 8
        board[8] = 0      # empty, but it is the opponent's pit
        board[opposite_pit(8)] = 4
        after, _ = apply_move(board, 5, 0)
        self.assertEqual(after[8], 1, "seed stays on the opponent's side")
        self.assertEqual(after[opposite_pit(8)], 4, "capturing only works on your own side")
        self.assertEqual(after[P1_STORE], 1, "just the one sown seed")

    def test_no_capture_when_the_landing_pit_was_occupied(self):
        board = [0] * 14
        board[0] = 1
        board[1] = 3      # not empty
        board[11] = 5
        after, _ = apply_move(board, 0, 0)
        self.assertEqual(after[1], 4)
        self.assertEqual(after[11], 5, "opposite pit untouched")
        self.assertEqual(after[P1_STORE], 0)


class TestEndgame(unittest.TestCase):

    def test_terminal_when_one_side_is_empty(self):
        board = [0] * 14
        board[7] = 3
        self.assertTrue(is_terminal(board), "P1 has no seeds left")
        board[0] = 1
        self.assertFalse(is_terminal(board))

    def test_cleanup_sweeps_the_remaining_seeds_to_their_owner(self):
        board = [0] * 14
        board[8] = 2
        board[9] = 3
        board[P1_STORE] = 10
        board[P2_STORE] = 1
        swept = cleanup_board(board)
        self.assertEqual(swept[P2_STORE], 6, "1 + 2 + 3 swept to P2")
        self.assertEqual(swept[P1_STORE], 10, "P1's store untouched")
        for i in P1_PITS + P2_PITS:
            self.assertEqual(swept[i], 0)
        self.assertEqual(sum(swept), sum(board))

    def test_winner_is_the_higher_store(self):
        board = [0] * 14
        board[P1_STORE] = 25
        board[P2_STORE] = 23
        self.assertEqual(winner(board), 0)
        board[P1_STORE], board[P2_STORE] = 23, 25
        self.assertEqual(winner(board), 1)
        board[P1_STORE], board[P2_STORE] = 24, 24
        self.assertIsNone(winner(board), "24-24 is a draw")

    def test_evaluate_is_the_store_difference(self):
        board = initial_state()
        self.assertEqual(evaluate(board), 0)
        board[P1_STORE] = 7
        self.assertEqual(evaluate(board), 7)

    def test_seed_conservation_over_a_full_random_game(self):
        import random
        rng = random.Random(12345)
        board = initial_state()
        player = 0
        for _ in range(500):
            if is_terminal(board):
                break
            moves = legal_moves(board, player)
            if not moves:
                break
            board, again = apply_move(board, rng.choice(moves), player)
            self.assertEqual(sum(board), TOTAL_SEEDS, "seeds conserved every ply")
            if not again:
                player = 1 - player
        final = cleanup_board(board)
        self.assertEqual(final[P1_STORE] + final[P2_STORE], TOTAL_SEEDS,
                         "every seed ends up in a store")
        self.assertEqual(seeds_in_play(final), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
