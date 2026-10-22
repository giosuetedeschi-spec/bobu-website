# TypeScript project ports

This directory contains the maintained TypeScript implementations. The source files are runnable or checkable with Bun and use only dependencies already in the website.

- `kalaha/`: game rules, search AI, command-line match, environment, tabular self-play, and a pure TypeScript linear-policy PPO trainer. PPO presets `scaffold`, `v0`, `v1`, and `v2` retain their rollout and optimization settings; produced weights are JSON and are not compatible with Stable-Baselines3 checkpoints.
- `pygame_calculator/`: browser DOM calculator and a safe arithmetic parser.
- `sudoku-solver/`: parser, generator, backtracking, AC-3, and simulated annealing. Its solver visualizer is integrated into `/progetti/sudoku/`.
- `InterpolationEngine/` and `sorting_algo_visualizer.ts`: interpolation demos and sorting visualizer.

The former Pygame screens have browser implementations in `src/components/games/`. Preserved Python and JavaScript originals are under `projects/legacy-source-archive/`; they are reference material and are not published or used at runtime.
