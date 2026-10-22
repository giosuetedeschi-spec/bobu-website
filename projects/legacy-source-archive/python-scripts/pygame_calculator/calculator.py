import pygame
import sys
from constants import (
    WIDTH, HEIGHT, TITLE, BG_COLOR, DISPLAY_BG, TEXT_COLOR,
    BTN_NUM_COLOR, BTN_OP_COLOR, BTN_HOVER_COLOR, DISPLAY_FONT_SIZE,
    BTN_CLEAR_COLOR, BTN_CLEAR_HOVER, BTN_DEL_COLOR, BTN_DEL_HOVER
)
from ui import Button

class Calculator:
    def __init__(self):
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption(TITLE)
        self.clock = pygame.time.Clock()
        self.running = True
        self.current_input = ""
        self.buttons = []
        self.display_font = pygame.font.SysFont(None, DISPLAY_FONT_SIZE)
        self.create_buttons()

    def create_buttons(self):
        start_x, start_y = 20, 150
        gap = 10
        btn_w = (WIDTH - 2 * start_x - 3 * gap) // 4
        btn_h = 80

        # Layout mapping
        layout = [
            [("7", BTN_NUM_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("7")),
             ("8", BTN_NUM_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("8")),
             ("9", BTN_NUM_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("9")),
             ("/", BTN_OP_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("/"))],
            
            [("4", BTN_NUM_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("4")),
             ("5", BTN_NUM_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("5")),
             ("6", BTN_NUM_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("6")),
             ("*", BTN_OP_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("*"))],
            
            [("1", BTN_NUM_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("1")),
             ("2", BTN_NUM_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("2")),
             ("3", BTN_NUM_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("3")),
             ("-", BTN_OP_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("-"))],
            
            [("C", BTN_CLEAR_COLOR, BTN_CLEAR_HOVER, self.clear_input),
             ("0", BTN_NUM_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("0")),
             ("=", BTN_OP_COLOR, BTN_HOVER_COLOR, self.calculate),
             ("+", BTN_OP_COLOR, BTN_HOVER_COLOR, lambda: self.add_char("+"))]
        ]

        for row_idx, row in enumerate(layout):
            y = start_y + row_idx * (btn_h + gap)
            for col_idx, (text, color, hover, action) in enumerate(row):
                x = start_x + col_idx * (btn_w + gap)
                self.buttons.append(Button(x, y, btn_w, btn_h, text, color, hover, action))

        # Delete Button
        y = start_y + 4 * (btn_h + gap)
        self.buttons.append(Button(start_x, y, WIDTH - 2*start_x, 60, "DELETE", BTN_DEL_COLOR, BTN_DEL_HOVER, self.delete_last))

    def add_char(self, char):
        self.current_input += char

    def clear_input(self):
        self.current_input = ""

    def delete_last(self):
        self.current_input = self.current_input[:-1]

    def calculate(self):
        try:
            # Note: eval() is used for simplicity but should be handled with care in production
            result = str(eval(self.current_input))
            self.current_input = result
        except Exception:
            self.current_input = "Error"

    def run(self):
        while self.running:
            mouse_pos = pygame.mouse.get_pos()
            
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1:
                        for btn in self.buttons:
                            action = btn.check_click(mouse_pos)
                            if action:
                                action()
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_BACKSPACE:
                        self.delete_last()
                    elif event.key == pygame.K_RETURN or event.key == pygame.K_KP_ENTER:
                        self.calculate()
                    elif event.key == pygame.K_ESCAPE:
                        self.clear_input()
                    else:
                        if event.unicode in "0123456789+-*/.":
                            self.add_char(event.unicode)

            self.screen.fill(BG_COLOR)
            
            display_rect = pygame.Rect(20, 20, WIDTH - 40, 100)
            pygame.draw.rect(self.screen, DISPLAY_BG, display_rect, border_radius=10)
            
            text_surf = self.display_font.render(self.current_input, True, TEXT_COLOR)
            text_rect = text_surf.get_rect(midright=(display_rect.right - 10, display_rect.centery))
            
            self.screen.set_clip(display_rect) 
            self.screen.blit(text_surf, text_rect)
            self.screen.set_clip(None)

            for btn in self.buttons:
                btn.check_hover(mouse_pos)
                btn.draw(self.screen)

            pygame.display.flip()
            self.clock.tick(60)

        pygame.quit()
        sys.exit()
