# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A small "Treasure Hunt" game built with React + TypeScript + Vite on the frontend and a Node/Express + SQLite backend for accounts and score persistence. Players can sign up/sign in (scores are saved per user) or continue as a guest (nothing is persisted). Everything under `src/components/ui` is a shadcn/Radix component library that was generated (not hand-written) and is mostly unused boilerplate available for future features — only `Button` is currently used.

`README.md` is not project documentation — it's a step-by-step log of Claude Code commands/prompts used to build this repo (a tutorial artifact). Don't treat it as a source of truth about current app behavior.

## Commands

- `npm install` — install dependencies
- `npm run dev` — run the Vite dev server (`:3000`) and the API server (`:3001`) together via `concurrently`; Vite proxies `/api/*` to the API server (see `vite.config.ts`)
  - `npm run dev:client` / `npm run dev:server` — run just one half, if needed
- `npm run build` — production build of the frontend, output goes to `build/` (not `dist/`)
- `npm start` — run the API server against the built frontend (`server/index.js` serves `build/` as static files plus `/api/*`); run `npm run build` first

There is no test runner, linter, or type-check script configured in `package.json`. There are no tests in the repo. `npm run build` uses `@vitejs/plugin-react-swc`, which transpiles/strips TypeScript without type-checking — a successful build does not mean the code type-checks. The backend is likewise unchecked plain Node (CommonJS, no build step).

## Architecture

### Frontend (`src/`)

- **Entry point**: `src/main.tsx` mounts `App` from `src/App.tsx` into `#root`, importing `src/index.css` for global styles.
- **`src/App.tsx`**: thin shell — wraps everything in `AuthProvider` and switches between a loading state, `AuthScreen`, and `TreasureGame` based on `useAuth().mode` (`'loading' | 'signed-out' | 'guest' | 'signed-in'`).
- **`src/contexts/AuthContext.tsx`**: owns auth state. On mount it calls `GET /api/auth/me` to restore an existing session cookie. Exposes `signIn`/`signUp`/`signOut` (call the API and update state) and `continueAsGuest`/`exitGuest` (pure client-side mode switches — guest mode never calls the API).
- **`src/lib/api.ts`**: thin `fetch` wrapper for all `/api/*` calls (`credentials: 'include'` so the session cookie is sent).
- **`src/components/AuthScreen.tsx`**: sign in/sign up form + "Continue as Guest" link, shown when `mode === 'signed-out'`.
- **`src/components/TreasureGame.tsx`**: the actual game — 3 boxes are rendered, one is randomly assigned the treasure on `initializeGame()`. Opening the treasure box gives +$100 and ends the game; opening a non-treasure box gives -$50 and the game ends only once the treasure box is opened or all boxes are opened. Box-open/flip animation is done with `motion/react` (Framer Motion's `motion` package). Unopened boxes also get a custom cursor (`src/assets/key.png`) via an inline `cursor: url(...)` style. When `mode === 'signed-in'`, it POSTs the final score to `/api/scores` once per completed game (guarded by a ref, reset in `initializeGame`) and shows the player's best score + recent results fetched from `GET /api/scores`. Guest mode skips all of this.
- **Assets**: images in `src/assets/`, sound effects in `src/audios/` (e.g. `chest_open.mp3`, `chest_open_with_evil_laugh.mp3`), imported directly as ES module URLs. `src/results/key_hover.png` is a leftover dev screenshot, not an asset used by the app.
- **UI components** (`src/components/ui/*`): a standard shadcn/ui set (button, dialog, accordion, etc.) backed by Radix primitives, `class-variance-authority`, and `clsx`/`tailwind-merge` via `src/components/ui/utils.ts` (`cn()` helper).
- **`src/components/figma/ImageWithFallback.tsx`**: a Figma Make-generated helper for `<img>` fallback handling.

### Backend (`server/`, CommonJS)

- **`server/index.js`**: Express app entry. Mounts `/api/auth/*` and `/api/scores/*`; in production (when `build/` exists) also serves the built frontend as static files with an SPA fallback to `index.html` for non-`/api` routes. Listens on `PORT` env var, default `3001`.
- **`server/db.js`**: opens `server/data/app.db` using Node's **built-in `node:sqlite`** module (`DatabaseSync`, no native dependency) and creates the `users`, `sessions`, and `scores` tables on startup if missing. `server/data/` is gitignored — it's local runtime data, recreated automatically.
- **`server/crypto.js`**: password hashing via `crypto.scryptSync` with a per-user random salt (no bcrypt dependency); `createToken()` for opaque session tokens.
- **`server/session.js`**: session mechanics — an opaque random token stored in the `sessions` table, set as an httpOnly `session_token` cookie (7-day expiry). `attachUser` middleware resolves the cookie to `req.user` on every request; `requireAuth` middleware 401s if absent.
- **`server/routes/auth.js`**: `POST /signup`, `POST /signin`, `POST /signout`, `GET /me`.
- **`server/routes/scores.js`**: `POST /` (save a completed game's `{score, result}` for `req.user`) and `GET /` (that user's recent history + best score) — both behind `requireAuth`.

## Important quirks (Figma Make export artifacts)

- Imports in `src/components/ui/*` use **versioned package specifiers**, e.g. `import { Slot } from "@radix-ui/react-slot@1.1.2"`. These are *not* typos — they only resolve because `vite.config.ts` maps each versioned specifier to the real package name via `resolve.alias`. If you add a new Radix/shadcn component or a new dependency that follows this pattern, add a matching alias entry in `vite.config.ts`, or use the unversioned import form instead.
- `src/index.css` is the actual stylesheet imported by `main.tsx` — it's tailwind v4 generated/compiled output, not a source file you'd normally hand-edit utility-by-utility. **It only contains the specific utility classes the original Figma Make export happened to use — not the full Tailwind utility set**, and there is no Tailwind build step in `vite.config.ts` to regenerate it. A class you add in JSX that isn't already a selector in this file (e.g. `bg-white`, `max-w-sm`, `mb-6`, `bg-amber-100` were all missing when checked) will silently render unstyled. Before using a new utility class, `grep` for its exact selector (accounting for Tailwind's `\:`/`\/` escaping, e.g. `hover:bg-amber-700` → `.hover\:bg-amber-700:hover`) in `src/index.css`; if absent, either reuse an existing class/value already in the file or add the rule by hand.
- `src/styles/globals.css` defines the design-token CSS variables (`--background`, `--primary`, etc. via `oklch()`/hex, with a `.dark` variant) but is **not imported anywhere** currently — treat it as the canonical source of design tokens, but know it has no live effect until wired in.
- `src/guidelines/Guidelines.md` is an empty template for project-specific AI guidelines — currently has no actual rules filled in.
- There is no `tailwind.config.js`/`tsconfig.json` in the repo; Tailwind v4's CSS-based config lives inline in the CSS files, and Vite handles TS via `@vitejs/plugin-react-swc` without a separate tsconfig.
- The `@` path alias resolves to `src/` (configured in `vite.config.ts`) — it only works in frontend code bundled by Vite. `server/*` files run directly under plain Node and must use relative `require(...)` paths.
