# Preserved legacy sources

This directory keeps original Python, superseded JavaScript, and an empty Rust scaffold for reference. The files were moved intact so the published site no longer includes Python scripts and the project has a clear TypeScript source of truth.

- `python-scripts/` contains the previous Python project files.
- `public-games/` contains Python copies that used to be under `public/games/`.
- `js-demos/` contains JavaScript copies replaced by TypeScript sources under `projects/browser-game-sources/`.
- `python-bytecode/` contains Python cache files, which are not used by the Bun build.
- `rust-app/` contains the previous Cargo manifest and empty Rust entrypoint; the web Breakout game is implemented in TypeScript.
- `pygame-calculator/` contains the retired Windows batch launcher for the Pygame app.
- `tool-config/` contains the previous JavaScript Jest config and setup; the active test setup is `jest.setup.ts`, with config stored in `package.json`.
- `tool-config/eslint.config.mjs` is the previous ESLint config; the active TypeScript config is `eslint.config.ts` and Bun loads it through ESLint's API.
- `tool-config/package-lock.json` is the preserved npm lockfile; `bun.lock` is the active lockfile used by local workflows and CI.

The site is built and checked with Bun. Browser JavaScript under `public/` is generated from TypeScript during the build.
