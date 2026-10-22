# visualizer.py
import pygame
import asyncio
import sys
from config import *
from sudoku_utils import parse_fen, print_board
from solvers import SudokuSolver
from solvers.backtracking import BacktrackingSolver
from generator import generate_sudoku

class SudokuVisualizer:
    def __init__(self):
        pygame.init()
        self.width = COLS * CELL_SIZE + MARGIN * 2 + PANEL_WIDTH
        self.height = ROWS * CELL_SIZE + MARGIN * 2
        
        self.screen = pygame.display.set_mode((self.width, self.height))
        pygame.display.set_caption("Sudoku Solver")
        
        self.font = pygame.font.SysFont("Arial", 24)
        self.small_font = pygame.font.SysFont("Arial", 16)
        
        # State
        self.board, self.solution = generate_sudoku()
        self.initial_board = [r[:] for r in self.board]
        self.strategy = 'backtracking'
        self.speed_idx = 2
        self.running = True
        self.solving = False
        
        # Buttons
        self.buttons = [
            {"label": "New Game", "action": "new_game", "rect": pygame.Rect(self.width - PANEL_WIDTH + 20, 20, 200, 40)},
            {"label": "Solve", "action": "solve", "rect": pygame.Rect(self.width - PANEL_WIDTH + 20, 80, 200, 40)},
            {"label": "Backtracking", "action": "set_bm", "rect": pygame.Rect(self.width - PANEL_WIDTH + 20, 160, 200, 30)},
            {"label": "AC-3", "action": "set_ac3", "rect": pygame.Rect(self.width - PANEL_WIDTH + 20, 200, 200, 30)},
            {"label": "Sim. Annealing", "action": "set_sa", "rect": pygame.Rect(self.width - PANEL_WIDTH + 20, 240, 200, 30)},
            {"label": "Speed: Normal", "action": "toggle_speed", "rect": pygame.Rect(self.width - PANEL_WIDTH + 20, 320, 200, 30)},
        ]

    async def main_loop(self):
        while self.running:
            self.handle_events()
            self.draw()
            pygame.display.flip()
            await asyncio.sleep(0)  # Yield to browser event loop

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if not self.solving:
                    x, y = event.pos
                    self._check_buttons(x, y)

    def _check_buttons(self, x, y):
        for btn in self.buttons:
            if btn["rect"].collidepoint(x, y):
                action = btn["action"]
                if action == "new_game":
                    self.board, self.solution = generate_sudoku()
                    self.initial_board = [r[:] for r in self.board]
                elif action == "solve":
                    asyncio.create_task(self.animate_solve())
                elif action == "set_bm": self.strategy = 'backtracking'
                elif action == "set_ac3": self.strategy = 'ac3'
                elif action == "set_sa": self.strategy = 'simulated_annealing'
                elif action == "toggle_speed":
                    self.speed_idx = (self.speed_idx + 1) % len(SPEEDS)
                    btn["label"] = f"Speed: {SPEEDS[self.speed_idx]}s"

    async def animate_solve(self):
        self.solving = True
        
        if self.strategy == 'backtracking':
            solver = BacktrackingSolver(self.board)
            # Visualize step-by-step
            # We implemented a generator in BacktrackingSolver just for this
            for step_board in solver.solve_step_by_step():
                self.board = step_board
                self.draw()
                pygame.display.flip()
                delay = SPEEDS[self.speed_idx]
                if delay > 0:
                    await asyncio.sleep(delay)
                else:
                    await asyncio.sleep(0)
        
        elif self.strategy == 'simulated_annealing':
            # SA is hard to visualize step-by-step without rewriting the solver to yield
            # For now, just solve and show result (or implement yielding in SA solver later)
            # Let's show "Solving..." then result
            await asyncio.sleep(0.1)
            result = SudokuSolver(self.board).solve('simulated_annealing')
            if result:
                self.board = result
        
        else:
            # AC3 / Default
            result = SudokuSolver(self.board).solve(self.strategy)
            if result:
                self.board = result
                
        self.solving = False

    def draw(self):
        self.screen.fill(BG_COLOR)
        
        # Draw Grid
        for r in range(ROWS):
            for c in range(COLS):
                rect = pygame.Rect(MARGIN + c * CELL_SIZE, MARGIN + r * CELL_SIZE, CELL_SIZE, CELL_SIZE)
                
                # Check if it was part of initial board
                is_fixed = self.initial_board[r][c] != EMPTY
                
                # Draw cell bg
                color = (255, 255, 255)
                if not is_fixed and self.board[r][c] != EMPTY:
                    color = (240, 240, 255) # Filled by user/solver
                
                pygame.draw.rect(self.screen, color, rect)
                pygame.draw.rect(self.screen, GRID_COLOR, rect, 1)
                
                val = self.board[r][c]
                if val != EMPTY:
                    font = self.font if is_fixed else self.font # Could verify correctness here
                    # Check correctness if solution exists
                    txt_color = FONT_COLOR
                    if not is_fixed and self.solution:
                         if val != self.solution[r][c]:
                             txt_color = ERROR_COLOR
                    
                    self.draw_text_centered(val, rect.center, font, txt_color)

        # Draw Thicker Lines
        for i in range(0, ROWS + 1, BLOCK_H):
            y = MARGIN + i * CELL_SIZE
            pygame.draw.line(self.screen, GRID_COLOR, (MARGIN, y), (MARGIN + COLS * CELL_SIZE, y), 3)
        for i in range(0, COLS + 1, BLOCK_W):
            x = MARGIN + i * CELL_SIZE
            pygame.draw.line(self.screen, GRID_COLOR, (x, MARGIN), (x, MARGIN + ROWS * CELL_SIZE), 3)

        # Draw Buttons
        for btn in self.buttons:
            color = BTN_COLOR
            if btn["action"] == f"set_{self._get_strat_short()}": # Highlight active strategy
                color = HIGHLIGHT_COLOR
            elif btn["rect"].collidepoint(pygame.mouse.get_pos()):
                color = BTN_HOVER_COLOR
            
            pygame.draw.rect(self.screen, color, btn["rect"], border_radius=5)
            pygame.draw.rect(self.screen, GRID_COLOR, btn["rect"], 1, border_radius=5)
            self.draw_text_centered(btn["label"], btn["rect"].center, self.small_font)
            
    def _get_strat_short(self):
        if self.strategy == 'backtracking': return 'bm'
        if self.strategy == 'ac3': return 'ac3'
        if self.strategy == 'simulated_annealing': return 'sa'
        return ''

    def draw_text_centered(self, text, center, font, color=FONT_COLOR):
        surface = font.render(str(text), True, color)
        rect = surface.get_rect(center=center)
        self.screen.blit(surface, rect)

async def main():
    viz = SudokuVisualizer()
    await viz.main_loop()

if __name__ == "__main__":
    asyncio.run(main())
