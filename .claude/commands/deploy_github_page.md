Deploy this project's static frontend to GitHub Pages, and report the live URL.

Architecture reminder: GitHub Pages only serves static files — it cannot run `server/app.js` or reach Vercel Postgres. So this deploys the built frontend *only*; the Express API keeps running on Vercel (already live at `https://claudecodetreasuregame-wheat.vercel.app`) and the frontend calls it cross-origin. Three things make that work, already wired into the repo:

- `vite.config.ts` sets `base: '/claude_code_treasure_game/'` when built with `--mode gh-pages` (via `npm run build:gh-pages`), because a GitHub Pages project site is served from `https://<user>.github.io/<repo>/`, not `/`. Confirm this matches the actual repo name before deploying (`git remote get-url origin`) — if the repo is ever renamed, or Pages is set to a custom domain / user site instead, update this to `'/'`.
- `.env.gh-pages` (committed — it's a public URL, not a secret) sets `VITE_API_BASE_URL` to the Vercel deployment's `/api`. `src/lib/api.ts` reads it and falls back to the same-origin `/api` used by Vercel and local dev, so this file only affects the `gh-pages` build mode.
- `server/app.js` / `server/session.js` add CORS (via the `cors` package) and a `SameSite=None; Secure` session cookie in production, gated on an `ALLOWED_ORIGINS` env var on the **Vercel** project — required for the GitHub Pages origin to call the API with credentials (session cookie) at all. This is a one-time setup step (below), not something this command repeats each deploy.

Run these steps in order, stopping to ask the user (not guessing or working around it yourself) whenever a step needs something only they can do:

1. **One-time: confirm the Vercel API allows the GitHub Pages origin.** Run `npx vercel env ls` and look for `ALLOWED_ORIGINS`. If missing, the GitHub Pages frontend's sign-in/sign-up/score requests will fail CORS. Determine the Pages origin (`https://<owner>.github.io`, using the GitHub org/user under `git remote get-url origin`) and tell the user to run `npx vercel env add ALLOWED_ORIGINS production` with that value (comma-separate multiple origins if needed), then redeploy the API (`npx vercel deploy --prod`) so it picks up the new env var. Wait for confirmation before continuing — this touches the shared production API, not just this static deploy.

2. **Check the repo is public (or Pages is otherwise enabled).** GitHub Pages on the free plan requires a public repository. If unsure, ask the user rather than assuming.

3. **Check `gh-pages` is installed.** It's already a devDependency; run `npm install` if `node_modules/gh-pages` is missing.

4. **Sanity check the gh-pages build locally (optional but recommended).** `npm run build:gh-pages` and open `build/index.html` — check the asset `<script>`/`<link>` tags are prefixed with `/claude_code_treasure_game/` and that the bundled JS contains the Vercel API URL (`grep -o 'vercel.app/api' build/assets/*.js`). Clean up the `build/` directory afterward (it's gitignored, not part of the deploy branch's source, but no need to leave stray output lying around).

5. **Confirm before deploying.** `npm run deploy:gh-pages` force-pushes the built output to the `gh-pages` branch, which becomes a public live site immediately — a visible, external action. Summarize what will be deployed (current branch/commit, any uncommitted changes) and explicitly ask the user to confirm before running it. Do not deploy uncommitted or unreviewed changes without calling that out.

6. **Deploy.** Run `npm run deploy:gh-pages`. This builds with `--mode gh-pages` and uses the `gh-pages` npm package to push `build/` to the `gh-pages` branch on `origin` (creating the branch on first run).

7. **One-time: point GitHub Pages at the `gh-pages` branch.** The first time this is run, GitHub won't be serving the branch yet. Check `has_pages` at `https://api.github.com/repos/<owner>/<repo>` (or ask the user to check the repo's Settings → Pages tab). If it's not configured, tell the user to set Source → Deploy from a branch → `gh-pages` / `root` in Settings → Pages themselves (this can't be done from the CLI without a `gh` auth token) and wait for their confirmation. GitHub Pages can take a minute or two to publish after this is set.

8. **Report the URL** back to the user as the final message: `https://<owner>.github.io/<repo>/`. Include a one-line reminder that this is a frontend-only deploy — accounts/scores still live in the same Vercel Postgres database as the Vercel deployment, reached over CORS, and guest mode needs no backend at all.

If any step's command fails, show the user the actual error output rather than retrying blindly — most failures here (CORS rejections in the browser console, a 404 from Pages, auth/permission errors on push) need a human decision (fixing an env var, a repo setting, or git remote permissions), not a retry.
