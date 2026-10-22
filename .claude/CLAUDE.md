# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run check
bun run test
```

`bun run build` exports static pages to `out/`; `bun run start` serves that export locally.

## Architecture

Next.js 16 (canary) App Router + TypeScript (strict) + React 19. Path alias `@/*` → `src/*`.

### The site is two different UIs bolted together

- **`src/app/page.tsx`** (the `/` route) is a single ~800-line self-contained client component: a fake desktop OS ("BobuOS") with its own window manager, draggable/resizable windows, a terminal emulator with a tiny fake shell (`help`, `ls`, `cd`, `open <app>`, etc.), a file explorer, and a start menu — styled via `src/app/page.module.css` (a CSS Module), no CSS framework. The only inline `style={{}}` left is on `OSWindow`, setting the live drag/resize/maximize position — genuinely per-instance runtime state that can't live in static CSS. Games are opened as windows containing an `<iframe src={payload}>` pointing straight at static HTML in `public/`.
- **`src/app/{portfolio,cv,progetti,ecommerce}/page.tsx`** are conventional pages styled with **Material UI** (`@mui/material`), reached either by direct navigation or via the "Files" app / desktop icons inside BobuOS. Individual game pages under `src/app/progetti/<game>/page.tsx` embed games via the `GameIframe` or `PyodideRunner` components instead of raw iframes.

When asked to change "the OS" or "the desktop," it's almost always `src/app/page.tsx`, not the files below.

Tailwind has been removed (no `postcss.config.mjs`, no `tailwindcss`/`@tailwindcss/postcss` deps). Live styling is MUI (`portfolio`/`cv`/`progetti`/`ecommerce`) or a CSS Module (`src/app/page.module.css`, the BobuOS homepage). The only stylesheet loaded globally is `src/app/globals.css` (via `layout.tsx`), which just has box-sizing/scroll resets. An earlier, more modular rewrite of the window manager (`src/components/os/`, `src/context/BobuOSContext.tsx`), an unused `PygameRunner.tsx`, and unimported `src/styles/*.css` were all removed as dead code — if you see references to them elsewhere (docs, old branches), they're stale.

### Games and WASM runtimes

- `public/games/*` and `public/projects/js-demos/*` hold standalone, pre-built game bundles (static HTML/JS, or Python sources) served as static assets and loaded via iframe.
- Kalaha and Sudoku now run as interactive TypeScript games on their Next.js routes; the older Python demos remain as reference sources.
- Breakout is a TypeScript Canvas game. The old Rust/Bevy source remains under `projects/rust-app`.
- Static export does not support response headers, and deployed game code does not use `SharedArrayBuffer`. `next.config.ts` emits trailing-slash routes for GitHub Pages and keeps `images.unoptimized: true`.
- Top-level `projects/` (js-demos, python-scripts, rust-app) and `_references/` are source/reference material, excluded from the TS build in `tsconfig.json`. There's no automated sync script found between `projects/` and the built bundles in `public/` — treat `public/` as the deployed source of truth and `projects/` as drafts/history.

### Deployment — two workflows, possibly inconsistent

- `.github/workflows/deploy.yml` builds with Bun and publishes the static export to GitHub Pages.
- `.github/workflows/ci.yml` runs lint, typecheck, tests, and the static export build with Bun.

### Testing

- Jest + `ts-jest` + `jsdom`, tests live flat in `tests/*.test.tsx` (not colocated with source), matched via `testMatch: ['**/tests/**/*.test.tsx']` in `jest.config.js`.
- `next/navigation`, `next/font/google`, and all `.css` imports are globally mocked (`jest.setup.js`, `__mocks__/`) — no need to mock them per-test.
