# Flip 7 solo score challenge

This folder contains the HTML/CSS shell for the website's solo score challenge. Its rules and card distribution follow the Flip 7 deck; play is adapted for one player aiming for 200 points, while the original tabletop game is multiplayer.

## Run from this website

From the repository root, run `bun run dev`, then open `/progetti/flip-7`. The site build compiles the TypeScript game modules into browser JavaScript under `public/`; no dependencies are needed for this game.

## Rules in this version

- Number cards 0 through 12 are included with a count matching their value (one zero).
- Flip or bank your hand. A duplicate number busts and banks zero, unless Second Chance discards both duplicate copies.
- Seven distinct number cards immediately end the hand and add 15 points.
- Freeze banks the hand. Flip Three makes three further draws. Only one Second Chance can be held.
- Plus cards add points after x2 is applied; x2 doubles number points only.
- Bank hands across turns to reach 200 points. This solo version adapts the multiplayer rules for a single player.

## Source

- `index.html`, `style.css`: standalone game view and styling.
- `../../browser-game-sources/external/projects/js-demos/flip-7/`: active TypeScript source compiled by `scripts/build-browser-games.ts`.
- `public/projects/js-demos/flip-7/`: generated browser files. Edit TypeScript sources, not generated files.
