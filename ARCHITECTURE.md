# Bobu Website Architecture

## Overview
This is a personal portfolio website built with **Next.js 15+ (App Router)**, **TypeScript**, and **Tailwind CSS**. It serves as a showcase for creative coding projects, game development experiments, and professional experience.

## Project Structure
```
bobu-website/
├── src/
│   ├── app/                 # App Router pages and layouts
│   │   ├── globals.css      # Global styles and CSS variables
│   │   ├── layout.tsx       # Root layout (Navbar, Footer, Fonts)
│   │   ├── page.tsx         # Home page
│   │   ├── cv/              # CV page
│   │   ├── portfolio/       # Portfolio page
│   │   └── projects/        # Individual project pages
│   ├── components/          # Reusable React components
│   │   ├── games/           # Game-specific components (GameIframe, PyodideRunner)
│   │   └── layout/          # Layout components (Navbar, Footer)
│   └── lib/                 # Utility functions
├── public/                  # Static assets (images, fonts, wasm)
└── package.json             # Dependencies and scripts
```

## Key Technologies
-   **Next.js**: Framework for React, used for routing and SSG/SSR.
-   **Tailwind CSS**: Utility-first CSS framework for styling.
-   **Framer Motion**: Library for animations.
-   **Pyodide**: Used to run Python code (Kalaha AI) in the browser.
-   **Rust/Wasm**: Experiments with Rust compiled to WebAssembly (Breakout).

## Key Components
### `Navbar` (`src/components/layout/Navbar.tsx`)
Responsive navigation bar with active state highlighting. Handles routing.

### `GameIframe` (`src/components/games/GameIframe.tsx`)
A wrapper component for embedding HTML5 games hosted in `public/games` or external URLs. It handles ensuring the game is responsive and fits within the page layout.

### `PyodideRunner` (`src/components/games/PyodideRunner.tsx`)
A complex component that initializes a Python environment in the browser using WebAssembly (Pyodide). It captures standard output to display a terminal-like interface for Python scripts.

## Styling System
Colors are defined in `src/app/globals.css` using CSS variables:
-   `--color-primary`: Blue (Action items)
-   `--color-secondary`: Purple (Creative elements)
-   `--color-accent`: Pink (Highlights)
-   `--color-success/warning/error`: Status indicators.

## Learner's Guide: How to Navigate this Code

### 1. Where do I find the pages?
Look in `src/app`. Each folder with a `page.tsx` represents a route.
-   `src/app/page.tsx` -> `/`
-   `src/app/about/page.tsx` -> `/about`

### 2. How do I add a new project?
1.  Create a folder in `src/app/projects/my-new-project`.
2.  Add a `page.tsx`.
3.  Use the `GameIframe` component if it's an HTML5 game, or build a custom UI.
4.  Add the project to the list in `src/app/portfolio/page.tsx` or `src/app/projects/page.tsx`.

### 3. How do the games work?
-   **JS Games**: Typically just an `iframe` pointing to a static HTML file in `public/`.
-   **Python Games**: Run directly in the browser using the `PyodideRunner` component which fetches the `.py` file and executes it.
-   **Rust Games**: Compiled to WASM and loaded via a custom loader or iframe.

### 4. Tips for debugging
-   Check the browser console (F12) for errors.
-   If a game isn't loading, check if the file path in `public/` is correct.
-   Verify that CSS variables are correctly defined if colors look wrong.
