"""
Kalaha - Bot vs Bot Demo (Pyodide compatible)
Runs a quick AI vs AI game and prints the result.
"""
from game_logic import (
    initial_state, legal_moves, apply_move, is_terminal,
    evaluate, cleanup_board, P1_PITS, P2_PITS, P1_STORE, P2_STORE
)
from ai_engine import get_best_move

def print_board(board):
    print()
    print("=" * 40)
    p2_row = [board[i] for i in reversed(P2_PITS)]
    p1_row = [board[i] for i in P1_PITS]
    print(f"      {'  '.join(f'{x:2d}' for x in p2_row)}")
    print(f"({board[P2_STORE]:2d})                        ({board[P1_STORE]:2d})")
    print(f"      {'  '.join(f'{x:2d}' for x in p1_row)}")
    print("=" * 40)

def run_demo():
    print("=== Kalaha AI vs AI Demo ===")
    print("Running a bot-vs-bot game...\n")
    
    board = initial_state()
    current_player = 0
    move_count = 0
    max_moves = 200
    
    print("Initial state:")
    print_board(board)
    
    while not is_terminal(board) and move_count < max_moves:
        move, nodes = get_best_move(board, current_player, depth=4, strategy='balanced')
        
        if move is None:
            print(f"Player {current_player + 1} has no legal moves!")
            break
        
        rel_move = move + 1 if current_player == 0 else move - 7 + 1
        print(f"Move {move_count + 1}: Player {current_player + 1} -> pit {rel_move} (analyzed {nodes} nodes)")
        
        board, extra_turn = apply_move(board, move, current_player)
        print_board(board)
        
        if extra_turn:
            print(f"  -> Extra turn for Player {current_player + 1}!")
        else:
            current_player = 1 - current_player
        
        move_count += 1
    
    # Game over
    board = cleanup_board(board)
    print("\n=== GAME OVER ===")
    print_board(board)
    
    score_p1 = board[P1_STORE]
    score_p2 = board[P2_STORE]
    
    print(f"Final Score - P1: {score_p1}, P2: {score_p2}")
    print(f"Total moves: {move_count}")
    
    if score_p1 > score_p2:
        print("Player 1 (AI) Wins!")
    elif score_p2 > score_p1:
        print("Player 2 (AI) Wins!")
    else:
        print("It's a Draw!")

run_demo()
