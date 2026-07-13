# bobu-website

A Next.js (App Router) site featuring "BobuOS" — a fake desktop OS homepage — plus a portfolio, CV, projects, and ecommerce section built with Material UI.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

```bash
npm run dev      # Start the Next.js dev server (localhost:3000)
npm run build    # Create a production build
npm run start    # Serve the production build
npm run lint     # Run ESLint
npm test         # Run the Jest test suite
```

Run a single test file or a matching test name:

```bash
npx jest tests/HomePage.test.tsx
npx jest -t "renders navbar"
```

There is no dedicated typecheck script; run `npx tsc --noEmit` if needed.

## Deployment

Changes pushed to `main` are picked up by the configured deployment workflow (see `.github/workflows/`). Confirm the active deployment target (GitHub Pages vs. Vercel) before changing `next.config.ts` or the workflow files — see `.claude/CLAUDE.md` for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
