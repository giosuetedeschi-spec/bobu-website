# config.py

# Board Configuration
BLOCK_W = 3
BLOCK_H = 3  # Standard 9x9 Sudoku
ROWS = BLOCK_H * 3
COLS = BLOCK_W * 3
DIGITS = [str(i) for i in range(1, max(ROWS, COLS) + 1)]
EMPTY = '.'

# Pygame Configuration
CELL_SIZE = 50
MARGIN = 20
PANEL_WIDTH = 250
BG_COLOR = (245, 245, 245)
GRID_COLOR = (40, 40, 40)
FONT_COLOR = (20, 20, 20)
HIGHLIGHT_COLOR = (100, 200, 255)
ERROR_COLOR = (255, 100, 100)
SUCCESS_COLOR = (100, 255, 100)
BTN_COLOR = (220, 220, 220)
BTN_HOVER_COLOR = (200, 200, 200)

SPEEDS = [0.0, 0.05, 0.1, 0.25, 0.5]
