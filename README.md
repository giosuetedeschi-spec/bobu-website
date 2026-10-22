# Bobu Website

A static Next.js portfolio with BobuOS, a collection of playable games, a CV, and an ecommerce concept preview. The app and build tooling use TypeScript and Bun.

## Development

```sh
bun install
bun run dev
```

Useful checks:

```sh
bun run lint
bun run check
bun run check:projects
bun run check:browser-games
bun run check:ports
bun run check:assets
bun run test
bun run build
bun run start
```

`bun run build` exports the site to `out/`. `bun run start` serves that static export locally on port 3000. For GitHub Pages, the deployment workflow builds with `NEXT_PUBLIC_BASE_PATH=/bobu-website`.

TypeScript project sources under `projects/typescript/` are typechecked with `bun run check:projects`; `bun run check:ports` runs dependency-free smoke checks. Kalaha Q-learning can be run with `bun run train:kalaha -- 1000`, or PPO with `bun run train:kalaha:ppo -- v2 1` (profile, iterations, optional output path).

Historical Python, superseded JavaScript, Python bytecode, and the empty Rust scaffold are preserved under `projects/legacy-source-archive/` and are not included in the published site. Browser game JavaScript in `public/` is generated from TypeScript sources with Bun.
