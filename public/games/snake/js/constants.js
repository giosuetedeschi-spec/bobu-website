<<<<<<< HEAD
/**
 * Snake — constants & tuning.
 * Pure data: no DOM, no side effects, safe to import from a headless context.
 */

/* ---- Board ------------------------------------------------------------- */
export const GRID_W = 28;
export const GRID_H = 20;

/* ---- Snake ------------------------------------------------------------- */
export const INITIAL_LENGTH = 4;
export const GROWTH_PER_FOOD = 1;

/* ---- Scoring ----------------------------------------------------------- */
export const POINTS_PER_FOOD = 10;
export const BONUS_POINTS = 50;

/* ---- Pace (milliseconds per logical tick) ------------------------------ */
export const TICK_MS_START = 145;
export const TICK_MS_MIN = 68;
export const TICK_MS_PER_SEGMENT = 3.2;

/* ---- Bonus food -------------------------------------------------------- */
export const BONUS_EVERY = 4; // spawn a bonus after every N normal foods
export const BONUS_TTL_TICKS = 55; // it expires if you dawdle

/* ---- Obstacles --------------------------------------------------------- */
export const OBSTACLE_CLUSTERS = 7;
export const OBSTACLE_SPAWN_GUARD = 5; // keep this many cells clear around spawn

/* ---- Directions -------------------------------------------------------- */
export const UP = Object.freeze({ x: 0, y: -1 });
export const DOWN = Object.freeze({ x: 0, y: 1 });
export const LEFT = Object.freeze({ x: -1, y: 0 });
export const RIGHT = Object.freeze({ x: 1, y: 0 });

export const DIRECTIONS = Object.freeze({ up: UP, down: DOWN, left: LEFT, right: RIGHT });

export function dirName(d) {
  if (!d) return null;
  if (d.x === 0 && d.y === -1) return 'up';
  if (d.x === 0 && d.y === 1) return 'down';
  if (d.x === -1 && d.y === 0) return 'left';
  if (d.x === 1 && d.y === 0) return 'right';
  return null;
}

export const isOpposite = (a, b) => !!a && !!b && a.x + b.x === 0 && a.y + b.y === 0;

/* ---- Palette (shared by canvas renderer and CSS) ----------------------- */
export const PALETTE = Object.freeze({
  boardTop: '#0d1220',
  boardBottom: '#080b14',
  gridLine: 'rgba(148, 163, 184, 0.07)',
  gridLineStrong: 'rgba(148, 163, 184, 0.12)',
  checker: 'rgba(148, 163, 184, 0.025)',
  border: 'rgba(168, 85, 247, 0.38)',
  snakeBody: '#10b981',
  snakeBodyLight: '#6ee7b7',
  snakeGlow: 'rgba(16, 185, 129, 0.55)',
  snakeHead: '#34d399',
  food: '#f43f5e',
  foodLight: '#fda4af',
  foodGlow: 'rgba(244, 63, 94, 0.55)',
  bonus: '#fbbf24',
  bonusLight: '#fef3c7',
  bonusGlow: 'rgba(251, 191, 36, 0.6)',
  obstacle: '#334155',
  obstacleLight: '#64748b',
  danger: '#ef4444',
});

export const STORAGE_KEY = 'bobu.snake.highscore.v2';
export const SETTINGS_KEY = 'bobu.snake.settings.v2';
=======
export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;
export const FPS = 10;
export const GRID_SIZE = 20;
export const GRID_WIDTH = SCREEN_WIDTH / GRID_SIZE;
export const GRID_HEIGHT = SCREEN_HEIGHT / GRID_SIZE;
export const BLACK = "#000000";
export const WHITE = "#FFFFFF";
export const PURPLE = "#9333ea";
export const PURPLE_LIGHT = "#a855f7";
export const GOLD = "#daa520";
export const GOLD_LIGHT = "#eeb934";
export const GREEN = "#059669";
export const GREEN_LIGHT = "#10b981";
export const RED = "#dc2626";
export const UP = { x: 0, y: -1 };
export const DOWN = { x: 0, y: 1 };
export const LEFT = { x: -1, y: 0 };
export const RIGHT = { x: 1, y: 0 };
export const INITIAL_SNAKE_LENGTH = 3;
export const GROWTH_PER_FOOD = 1;
export const POINTS_PER_FOOD = 10;
>>>>>>> 54630ec (fix: complete browser game implementations and ports)
