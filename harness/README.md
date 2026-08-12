# Headless test API

A Playwright-driven API for exercising the whole site without a browser window:
every route, every game, and every BobuOS desktop behaviour.

It runs against the **real static export** in `out/`, served by a tiny static
server that reproduces the two behaviours the production host provides —
extensionless routes resolving to `<route>.html`, and the COOP/COEP headers on
`/games/*` that `next.config.ts` declares but a static export cannot apply. So
what the harness checks is exactly what gets deployed.

```bash
npm run build          # the harness needs out/ to exist
node harness/cli.mjs   # everything: 22 pages, 16 games, 14 features
```

## Layout

| File | Purpose |
| --- | --- |
| `GAME_API.md` | The `window.__GAME__` contract every game bundle implements |
| `registry.mjs` | Single source of truth: every page, game and feature |
| `api.mjs` | `SiteHarness` — the programmatic API |
| `probes/index.mjs` | Per-game behavioural probes |
| `features.mjs` | BobuOS desktop checks (windows, terminal, files, wallpaper) |
| `cli.mjs` | Command-line runner |
| `server.mjs` | The same checks exposed over HTTP |
| `quickcheck.mjs` | Drive **one** game bundle, no Next build needed |
| `selftest.mjs` | Run one game's in-bundle rules selftest |
| `eval.mjs` | Evaluate an arbitrary expression inside a loaded game |
| `server-static.mjs` | The static file server the others share |

## CLI

```bash
node harness/cli.mjs                    # full sweep, exits non-zero on failure
node harness/cli.mjs pages
node harness/cli.mjs games
node harness/cli.mjs features
node harness/cli.mjs game snake
node harness/cli.mjs page portfolio
node harness/cli.mjs feature terminal
node harness/cli.mjs catalog            # dump the registry as JSON
node harness/cli.mjs --json             # machine-readable report
node harness/cli.mjs --verbose          # show passing checks too
node harness/cli.mjs --no-screenshots
```

Every run writes `harness/reports/last-run.json` and a screenshot per target
under `harness/reports/screenshots/`.

## Iterating on a single game

`quickcheck.mjs` serves `public/` directly, so it needs no Next build and turns
around in about a second:

```bash
node harness/quickcheck.mjs /games/snake/index.html
node harness/quickcheck.mjs /games/twins/index.html --shot /tmp/twins.png --play 200
node harness/selftest.mjs   /games/abalone/index.html
node harness/eval.mjs       /games/tris/index.html "window.__GAME__.getState().board"
```

`--play N` advances the game N ticks before the screenshot, so the image shows a
game in progress rather than its opening frame.

## HTTP API

```bash
node harness/server.mjs      # :7331
PORT=8080 node harness/server.mjs
```

| Method | Endpoint | Returns |
| --- | --- | --- |
| GET | `/health` | liveness and the URL under test |
| GET | `/api/catalog` | every page, game and feature, each with its endpoints |
| GET | `/api/pages` | list pages |
| GET | `/api/pages/:id` | check one page |
| POST | `/api/pages/check` | check all pages |
| GET | `/api/games` | list games |
| GET | `/api/games/:id` | check one game |
| GET | `/api/games/:id/state` | load the game, return `getState()` |
| POST | `/api/games/:id/drive` | `{seed, inputs, ticks}` → resulting state |
| POST | `/api/games/:id/selftest` | run the game's in-bundle rules selftest |
| POST | `/api/games/check` | check all games |
| GET | `/api/features` | list BobuOS features |
| GET | `/api/features/:id` | check one feature |
| POST | `/api/features/check` | check all features |
| POST | `/api/check-all` | full sweep |
| GET | `/api/screenshots/:name` | PNG from the last check |

Driving a game over HTTP:

```bash
curl -s localhost:7331/api/games/snake/drive \
  -H 'content-type: application/json' \
  -d '{"seed":42,"inputs":["right","down"],"ticks":40}' | jq .state.score
```

Every check responds with the same shape:

```jsonc
{
  "id": "snake",
  "kind": "game",
  "ok": true,
  "checks": [{ "name": "…", "ok": true, "detail": null }],
  "consoleErrors": [],
  "failedRequests": [],
  "screenshot": "harness/reports/screenshots/game-snake.png",
  "ms": 924
}
```

A failing check returns HTTP 422 with the same body, so `ok` and the status code
agree.

## Programmatic

```js
import { SiteHarness } from "./harness/api.mjs";

const site = await SiteHarness.launch();
const report = await site.checkAll();
console.log(report.summary);           // { total, passed, failed }

// Escape hatch: run anything against a loaded game.
const score = await site.driveGame("flappy-bird", () => {
  const g = window.__GAME__;
  g.reset(7);
  for (let i = 0; i < 300; i++) { g.input("flap"); g.step(5); }
  return g.getState().score;
});

await site.close();
```

## What gets checked

**Pages** — the expected selector or copy is present, the page rendered
content, there is no Next.js error overlay, and there were no console errors or
failed requests.

**Games** — `window.__GAME__` reaches `ready`; the contract is complete;
`reset(seed)` is deterministic; an unknown action is rejected rather than
thrown; a canvas actually paints pixels; the game's own rules selftest passes;
plus a per-game behavioural probe. The two Python games are checked for a clean
Pyodide run instead, and tolerate the CDN being unreachable on an offline
runner.

**Features** — boot, opening/focusing/moving/maximising/minimising/closing
windows, the start menu and its search, the terminal (`help`, `ls`, `cd`,
`games`, `neofetch`, unknown commands, `open <app>`), the file explorer, the
wallpaper switcher and its persistence, a game actually loading inside a desktop
window, and the mobile card replacing the desktop on a phone viewport.

## Adding a game

1. Implement `window.__GAME__` per `GAME_API.md`, including an `input("selftest")`
   that returns `{ ok, passed, failed, total, results }`.
2. Add a row to `GAMES` in `registry.mjs` with a `probe` name.
3. Add that probe to `probes/index.mjs`.

It then has a CLI target and an HTTP endpoint automatically.
