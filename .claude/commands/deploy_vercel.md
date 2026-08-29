Deploy this project (Vite frontend + Express API as a Vercel serverless function, backed by Vercel Postgres) to Vercel, and report the live URL.

Architecture reminder: `api/[...path].js` exports the Express app from `server/app.js` as a single catch-all serverless function; `vercel.json` sets the build command/output dir; the database is Vercel Postgres via `@vercel/postgres`, which only speaks Neon's proxy protocol — it does **not** work against an arbitrary local Postgres. Local dev/testing against the real database requires `.env.local` (see step 4).

Run these steps in order, stopping to ask the user (not guessing or working around it yourself) whenever a step needs something only they can do:

1. **Check the CLI is usable.** Run `npx vercel --version`. If it fails to resolve, run `npm install` first (it's already a devDependency).

2. **Check login.** Run `npx vercel whoami`. If it reports not logged in, tell the user to run `! vercel login` themselves (it opens a browser OAuth flow you cannot complete) and wait — do not attempt to log in on their behalf.

3. **Check the project is linked.** Look for `.vercel/project.json`. If absent, run `npx vercel link` and follow its prompts (or `npx vercel link --yes` to accept the default scope/name). This associates the local repo with a Vercel project.

4. **Check Vercel Postgres is attached.** Run `npx vercel env ls` and look for `POSTGRES_URL`. If it's missing, stop and tell the user: open the project in the Vercel dashboard → Storage tab → Create Database → Postgres → Connect to this project. This step can't be done from the CLI/non-interactively — wait for the user to confirm it's done before continuing.

5. **Sync env vars locally.** Run `npx vercel env pull .env.local`. This writes `POSTGRES_URL` (and friends) into `.env.local` (already gitignored), which `npm run dev:server` / `npm start` pick up automatically via `--env-file-if-exists`. This is also what makes local sign-up/sign-in testing work against the real database.

6. **Sanity check locally (optional but recommended).** `npm run dev` and confirm sign-up, sign-in, and score submission work against the pulled `POSTGRES_URL` before deploying.

7. **Confirm before deploying.** Deploying pushes a new production build to a public URL — a visible, external action. Summarize what will be deployed (current branch/commit, any uncommitted changes) and explicitly ask the user to confirm before running `npx vercel deploy --prod`. Do not deploy uncommitted or unreviewed changes without calling that out.

8. **Deploy.** Run `npx vercel deploy --prod`. Capture the production URL printed in its output (the `https://*.vercel.app` line, not the inspect/logs URL).

9. **Report the URL** back to the user as the final message, along with a one-line reminder that scores/accounts now live in the linked Vercel Postgres database (not the old local SQLite file).

If any step's command fails, show the user the actual error output rather than retrying blindly — most failures here (auth, missing storage, bad env vars) need a human decision, not a retry.
