/**
 * Single source of truth for everything the headless harness can exercise:
 * routes, game bundles, and BobuOS desktop functionality.
 *
 * The HTTP API (harness/server.mjs) and the CLI (harness/cli.mjs) both build
 * their endpoint list from this file, so adding a game here is enough to give
 * it a `/api/games/<id>` endpoint.
 */

/** Next.js routes rendered by the static export. */
export const PAGES = [
  {
    id: "home",
    route: "/",
    title: "BobuOS desktop",
    // On desktop viewports the fake OS renders; on mobile the business card does.
    expect: { anyOf: ["[data-testid='bobuos-desktop']", "[data-testid='mobile-card']"] },
  },
  { id: "portfolio", route: "/portfolio", title: "Portfolio", expect: { text: "Selected Works" } },
  { id: "cv", route: "/cv", title: "CV", expect: { text: "CV" } },
  { id: "progetti", route: "/progetti", title: "Progetti", expect: { text: "Passion Projects" } },
  { id: "ecommerce", route: "/ecommerce", title: "Ecommerce", expect: { text: "Shop" } },
  { id: "ecommerce-collection", route: "/ecommerce/collection", title: "Collection", expect: { selector: ".MuiContainer-root" } },
  { id: "progetti-abalone", route: "/progetti/abalone", title: "Abalone page", expect: { selector: "iframe" } },
  { id: "progetti-azul", route: "/progetti/azul", title: "Azul page", expect: { selector: "iframe" } },
  { id: "progetti-bitwise", route: "/progetti/bitwise", title: "Bitwise page", expect: { selector: "iframe" } },
  { id: "progetti-breakout", route: "/progetti/breakout", title: "Breakout page", expect: { selector: "iframe" } },
  { id: "progetti-flappy-bird", route: "/progetti/flappy-bird", title: "Flappy Bird page", expect: { selector: "iframe" } },
  { id: "progetti-flip-7", route: "/progetti/flip-7", title: "Flip 7 page", expect: { selector: "iframe" } },
  { id: "progetti-kalaha", route: "/progetti/kalaha", title: "Kalaha page", expect: { text: "Kalaha" }, needsNetwork: true },
  { id: "progetti-mastermind", route: "/progetti/mastermind", title: "Mastermind page", expect: { selector: "iframe" } },
  { id: "progetti-maze-generator", route: "/progetti/maze-generator", title: "Maze Generator page", expect: { selector: "iframe" } },
  { id: "progetti-maze-solver", route: "/progetti/maze-solver", title: "Maze Solver page", expect: { selector: "iframe" } },
  { id: "progetti-pong", route: "/progetti/pong", title: "Pong page", expect: { selector: "iframe" } },
  { id: "progetti-snake", route: "/progetti/snake", title: "Snake page", expect: { selector: "iframe" } },
  { id: "progetti-sudoku", route: "/progetti/sudoku", title: "Sudoku page", expect: { text: "Sudoku" }, needsNetwork: true },
  { id: "progetti-tris", route: "/progetti/tris", title: "Tris page", expect: { selector: "iframe" } },
  { id: "progetti-mirror-drift", route: "/progetti/mirror-drift", title: "Mirror Drift page", expect: { selector: "iframe" } },
  { id: "progetti-twins", route: "/progetti/twins", title: "Twins page", expect: { selector: "iframe" } },
];

/**
 * Game bundles. `url` is the standalone HTML that BobuOS iframes.
 * `kind`:
 *   "js"      – exposes window.__GAME__, driven directly
 *   "pyodide" – runs Python in the browser, only checked for a clean stdout run
 */
export const GAMES = [
  { id: "abalone", name: "Abalone", url: "/games/abalone/index.html", kind: "js", folder: "Board", probe: "abalone" },
  { id: "azul", name: "Azul", url: "/games/azul/index.html", kind: "js", folder: "Board", probe: "azul" },
  { id: "tris", name: "Tris", url: "/games/tris/index.html", kind: "js", folder: "Board", probe: "tris" },
  { id: "mastermind", name: "Mastermind", url: "/games/mastermind/index.html", kind: "js", folder: "Puzzle", probe: "mastermind" },
  { id: "snake", name: "Snake", url: "/games/snake/index.html", kind: "js", folder: "Arcade", probe: "snake" },
  { id: "pong", name: "Pong", url: "/games/pong/index.html", kind: "js", folder: "Arcade", probe: "pong" },
  { id: "flappy-bird", name: "Flappy Bird", url: "/games/flappy-bird/index.html", kind: "js", folder: "Arcade", probe: "flappy" },
  { id: "breakout", name: "Breakout", url: "/games/breakout/index.html", kind: "js", folder: "Arcade", probe: "breakout" },
  { id: "mirror-drift", name: "Mirror Drift", url: "/games/mirror-drift/index.html", kind: "js", folder: "Arcade", probe: "mirrordrift" },
  { id: "twins", name: "Twins", url: "/games/twins/index.html", kind: "js", folder: "Arcade", probe: "twins" },
  { id: "flip-7", name: "Flip 7", url: "/projects/js-demos/flip-7/index.html", kind: "js", folder: "Arcade", probe: "flip7" },
  { id: "bitwise-ops", name: "Bitwise Ops", url: "/projects/js-demos/bitwise-ops/index.html", kind: "js", folder: "Puzzle", probe: "bitwise" },
  { id: "maze-generator", name: "Maze Generator", url: "/projects/js-demos/maze-generator/index.html", kind: "js", folder: "Visual", probe: "mazegen" },
  { id: "maze-solver", name: "Maze Solver", url: "/projects/js-demos/maze-solver/index.html", kind: "js", folder: "Visual", probe: "mazesolver" },
  { id: "kalaha", name: "Kalaha", url: "/progetti/kalaha", kind: "pyodide", folder: "Board", probe: "pyodide" },
  { id: "sudoku", name: "Sudoku Solver", url: "/progetti/sudoku", kind: "pyodide", folder: "Puzzle", probe: "pyodide" },
];

/** BobuOS desktop behaviours checked on the `/` route. */
export const FEATURES = [
  { id: "boot", name: "Desktop boots and paints icons" },
  { id: "open-window", name: "Double-clicking an icon opens a window" },
  { id: "window-focus", name: "Clicking a background window raises it" },
  { id: "window-move", name: "Dragging a titlebar moves the window" },
  { id: "window-maximize", name: "Maximize / restore toggles size" },
  { id: "window-minimize", name: "Minimize hides the window, taskbar restores it" },
  { id: "window-close", name: "Close removes the window" },
  { id: "start-menu", name: "Start menu opens and launches an app" },
  { id: "terminal", name: "Terminal runs help/ls/cd/games/neofetch" },
  { id: "terminal-open", name: "Terminal `open <app>` launches a game window" },
  { id: "files", name: "File explorer lists folders and drills into one" },
  { id: "wallpaper", name: "Right-click switches the wallpaper" },
  { id: "game-iframe", name: "A game opened from the desktop actually loads" },
  { id: "mobile-card", name: "Mobile viewport renders the business card" },
];

export const CATALOG = { pages: PAGES, games: GAMES, features: FEATURES };

export function findPage(id) {
  return PAGES.find((p) => p.id === id);
}
export function findGame(id) {
  return GAMES.find((g) => g.id === id);
}
export function findFeature(id) {
  return FEATURES.find((f) => f.id === id);
}
