# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js dev server (localhost:3000)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint (eslint-config-next core-web-vitals + typescript)
npm test         # Jest (all tests)
npx jest tests/HomePage.test.tsx        # Run a single test file
npx jest -t "renders navbar"            # Run tests matching a name
```

There is no typecheck script; use `npx tsc --noEmit` if needed. `postbuild` runs `touch out/.nojekyll` (only meaningful when a static export exists in `out/`).

## Architecture

Next.js 16 (canary) App Router + TypeScript (strict) + React 19. Path alias `@/*` → `src/*`.

### The site is two different UIs bolted together

- **`src/app/page.tsx`** (the `/` route) is a single ~800-line self-contained client component: a fake desktop OS ("BobuOS") with its own window manager, draggable/resizable windows, a terminal emulator with a tiny fake shell (`help`, `ls`, `cd`, `open <app>`, etc.), a file explorer, and a start menu — all built with plain inline `style={{}}` objects, no CSS framework. Games are opened as windows containing an `<iframe src={payload}>` pointing straight at static HTML in `public/`.
- **`src/app/{portfolio,cv,progetti,ecommerce}/page.tsx`** are conventional pages styled with **Material UI** (`@mui/material`), reached either by direct navigation or via the "Files" app / desktop icons inside BobuOS. Individual game pages under `src/app/progetti/<game>/page.tsx` embed games via the `GameIframe` or `PyodideRunner` components instead of raw iframes.

When asked to change "the OS" or "the desktop," it's almost always `src/app/page.tsx`, not the files below.

### Dead / unwired code — do not assume these are live

Several pieces exist in `src/` but are **not imported by any route** (verified: nothing outside the group references them). Don't spend time "fixing" them assuming they affect the deployed site, and don't assume the design docs in `BobuOS_Design/` describe the current state — they describe this abandoned direction:

- `src/components/os/{Desktop,Taskbar,WindowFrame}.tsx` + `src/context/BobuOSContext.tsx` — a more modular, Tailwind-classed rewrite of the window manager that was never wired into `page.tsx`.
- `src/components/games/PygameRunner.tsx` — unused (the live equivalent is `PyodideRunner.tsx`).
- `src/styles/{base,components,os,variables}.css` — not imported anywhere; the only stylesheet actually loaded is `src/app/globals.css` (via `layout.tsx`), which just pulls in Tailwind and a few resets.
- Tailwind CSS v4 is configured (`postcss.config.mjs`, `@import "tailwindcss"` in `globals.css`) but Tailwind utility classes only appear in the dead code above — no live page uses them. Live styling is MUI (`portfolio`/`cv`/`progetti`/`ecommerce`) or inline styles (the BobuOS homepage).

### Games and WASM runtimes

- `public/games/*` and `public/projects/js-demos/*` hold standalone, pre-built game bundles (static HTML/JS, or Python sources) served as static assets and loaded via iframe.
- Python games (Kalaha, Sudoku) run in-browser via **Pyodide** — `PyodideRunner` fetches the raw `.py` and executes it, capturing stdout into a terminal-like UI.
- Rust games (Breakout) compile to WASM via Bevy.
- `next.config.ts` sets COOP/COEP headers on `/games/:path*` — required for WASM threading/`SharedArrayBuffer`; don't remove them without checking whether a game depends on them. It also sets `images.unoptimized: true`.
- Top-level `projects/` (js-demos, python-scripts, rust-app) and `_references/` are source/reference material, excluded from the TS build in `tsconfig.json`. There's no automated sync script found between `projects/` and the built bundles in `public/` — treat `public/` as the deployed source of truth and `projects/` as drafts/history.

### Deployment — two workflows, possibly inconsistent

- `.github/workflows/deploy.yml` runs `npm run build` and publishes `out/` to GitHub Pages — this requires Next's static export (`output: 'export'`).
- `.github/workflows/vercel-deploy.yml` deploys to Vercel instead.
- Recent history (`revert: remove static export for Vercel deploy`) shows `output: 'export'` was added then removed from `next.config.ts` to make Vercel deploys work. Since static export is currently off, `npm run build` will not produce an `out/` directory, meaning the GitHub Pages workflow is presently non-functional. Confirm which target is actually the live site before changing `next.config.ts` or either workflow.

### Testing

- Jest + `ts-jest` + `jsdom`, tests live flat in `tests/*.test.tsx` (not colocated with source), matched via `testMatch: ['**/tests/**/*.test.tsx']` in `jest.config.js`.
- `next/navigation` and `globals.css` are globally mocked (`jest.setup.js`, `__mocks__/`) — no need to mock them per-test.
