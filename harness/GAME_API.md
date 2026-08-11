# Game Test API contract (`window.__GAME__`)

Every playable game bundle under `public/games/*` and `public/projects/js-demos/*`
**must** expose a single global object so the headless harness can drive it
without screen-scraping the DOM.

```js
window.__GAME__ = {
  id: "snake",            // stable slug, matches the harness registry id
  version: 1,             // contract version, always 1 for now
  ready: true,            // flip to true once assets are loaded and the loop can run
  meta: { name, players, mode },   // free-form, informational

  getState(): object,     // full serialisable snapshot (see below)
  reset(seed?: number): void,      // restart deterministically; same seed => same run
  step(n?: number): void, // advance the simulation n logical ticks (default 1)
  input(action: string, payload?: any): any,   // perform a player action
  actions(): string[],    // list of accepted `action` strings
};
```

## Rules

1. **Deterministic.** `reset(seed)` must seed every random source used by the
   game (a small PRNG, not `Math.random`). Two runs with the same seed and the
   same input sequence must produce identical `getState()` output.
2. **Headless-safe.** `step()` must advance game logic without waiting on
   `requestAnimationFrame`. The render loop may call the same tick function, but
   the harness must be able to drive the simulation synchronously.
3. **`getState()`** must always include:
   - `status`: one of `"idle" | "playing" | "won" | "lost" | "draw" | "over"`
   - `turn`: whose turn it is (`"player"`, `"ai"`, or `null` for realtime games)
   - `score`: number or object of numbers
   - plus the full game-specific board/entity state.
4. **`input()`** returns `{ ok: true, ... }` on a legal action and
   `{ ok: false, reason: "..." }` on an illegal one. It must never throw for
   illegal input — rejecting a bad move is a normal, tested code path.
5. **No network.** No CDN scripts, webfonts, or remote images. Everything is
   inline or a same-directory relative asset, otherwise the game breaks under
   the COOP/COEP headers and offline checks.
6. `window.__GAME__` must be assigned **before** the first paint so the harness
   can await `window.__GAME__?.ready`.

## Python (Pyodide) games

Games executed through `PyodideRunner` cannot expose a JS global from inside
Python. Instead the runner sets `window.__GAME__` itself with:

- `getState()` → `{ status, score, stdout, modules, error }`
- `step()` / `input()` → `{ ok: false, reason: "pyodide-batch" }`

Their Python entrypoint (`main.py`) must therefore be **non-interactive**: no
`input()` calls, it runs a scripted demo and prints results to stdout.

## Example (turn-based)

```js
const g = window.__GAME__;
g.reset(42);
g.getState().status;            // "playing"
g.input("place", { cell: 4 });  // { ok: true }
g.input("place", { cell: 4 });  // { ok: false, reason: "cell occupied" }
g.actions();                    // ["place", "restart", "undo"]
```

## Example (realtime)

```js
const g = window.__GAME__;
g.reset(7);
g.input("flap");
g.step(60);                     // 60 logical ticks, no rAF needed
g.getState();                   // { status: "playing", score: 0, bird: {...} }
```
