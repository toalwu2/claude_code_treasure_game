# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A small single-page "Treasure Hunt" game built with React + TypeScript + Vite. The entire game logic and UI lives in `src/App.tsx`; everything else under `src/components/ui` is a shadcn/Radix component library that was generated (not hand-written) and is mostly unused boilerplate available for future features.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start Vite dev server on `http://localhost:3000` (auto-opens browser)
- `npm run build` — production build, output goes to `build/` (not `dist/`)

There is no test runner, linter, or type-check script configured in `package.json`. There are no tests in the repo.

## Architecture

- **Entry point**: `src/main.tsx` mounts `App` from `src/App.tsx` into `#root`, importing `src/index.css` for global styles.
- **Game logic**: All state (`boxes`, `score`, `gameEnded`) and logic lives in `src/App.tsx` as a single component. The game: 3 boxes are rendered, one is randomly assigned the treasure on `initializeGame()`. Opening the treasure box gives +$100 and ends the game; opening a non-treasure box gives -$50 and the game ends only once the treasure box is opened or all boxes are opened. Box-open/flip animation is done with `motion/react` (Framer Motion's `motion` package).
- **Assets**: images in `src/assets/`, sound effects in `src/audios/` (e.g. `chest_open.mp3`, `chest_open_with_evil_laugh.mp3`), imported directly as ES module URLs in `App.tsx`.
- **UI components** (`src/components/ui/*`): a standard shadcn/ui set (button, dialog, accordion, etc.) backed by Radix primitives, `class-variance-authority`, and `clsx`/`tailwind-merge` via `src/components/ui/utils.ts` (`cn()` helper). Only `Button` is currently used by the game.
- **`src/components/figma/ImageWithFallback.tsx`**: a Figma Make-generated helper for `<img>` fallback handling.

## Important quirks (Figma Make export artifacts)

- Imports in `src/components/ui/*` use **versioned package specifiers**, e.g. `import { Slot } from "@radix-ui/react-slot@1.1.2"`. These are *not* typos — they only resolve because `vite.config.ts` maps each versioned specifier to the real package name via `resolve.alias`. If you add a new Radix/shadcn component or a new dependency that follows this pattern, add a matching alias entry in `vite.config.ts`, or use the unversioned import form instead.
- `src/index.css` is the actual stylesheet imported by `main.tsx` — it's tailwind v4 generated/compiled output containing the full utility set already expanded, not a source file you'd normally hand-edit utility-by-utility.
- `src/styles/globals.css` defines the design-token CSS variables (`--background`, `--primary`, etc. via `oklch()`/hex, with a `.dark` variant) but is **not imported anywhere** currently — treat it as the canonical source of design tokens, but know it has no live effect until wired in.
- `src/guidelines/Guidelines.md` is an empty template for project-specific AI guidelines — currently has no actual rules filled in.
- There is no `tailwind.config.js`/`tsconfig.json` in the repo; Tailwind v4's CSS-based config lives inline in the CSS files, and Vite handles TS via `@vitejs/plugin-react-swc` without a separate tsconfig.
- The `@` path alias resolves to `src/` (configured in `vite.config.ts`).
