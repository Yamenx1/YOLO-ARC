# YOLO ARC — real website edition

Life is the main quest. Gemini writes every arc; Vercel hosts it, Convex stores
saves, Clerk handles sign-in. Works fully offline/local too.

## Run locally (2 minutes, no accounts)

1. Install Node 18+ (`node --version`).
2. `node server.js` (or `npm start`), open http://localhost:3000.
3. No keys needed: everything falls back to the on-device engine.
   Add `GEMINI_API_KEY` env to enable server AI.

## Go live: Vercel + Convex + Clerk (15 minutes, your 3 keys)

**1. Clerk (sign-in) — dashboard.clerk.com**
- Create application → copy the **Publishable key** (`pk_...`).
- Left menu → JWT Templates → New template → **Convex** → Save.
  Copy the **Issuer URL**.

**2. Convex (database) — terminal in this folder**
- `npm install convex` then `npx convex dev` (log in, create project).
- Convex dashboard → Settings → Environment Variables → add
  `CLERK_JWT_ISSUER_DOMAIN` = the Issuer URL from step 1.
- `npx convex deploy` → copy the **Deployment URL**
  (`https://....convex.cloud`).

**3. Wire the frontend — `config.js`**
- Put the Clerk publishable key in `CLERK_KEY`, Convex URL in `CONVEX_URL`.
- Both are public by design — safe to commit.

**4. Vercel (hosting) — vercel.com**
- Push this folder to GitHub (never commit `.env`).
- Vercel → Add New → Project → import the repo (auto-detected, no build step).
- Project → Settings → Environment Variables → add `GEMINI_API_KEY`
  (a **fresh** key — revoke any key ever pasted in chat) and optionally
  `GEMINI_MODEL` (default `gemini-3.5-flash-lite`, auto-fallbacks on 404).
- Deploy → open your `https://...vercel.app` → SIGN IN → play on any device,
  saves sync to Convex.

## How the pieces fit

- Browser → same-origin `/api/gemini` (Vercel function `api/gemini.js`,
  or `server.js` locally) → Google. Secret key never reaches the page.
- No backend reachable (opened as file)? The app uses a personal key from the
  `key` button, else the local engine. Game never breaks.
- Signed in? Every save pushes (debounced) to Convex; on login the newer of
  local vs cloud wins. Signed out? Pure localStorage.

## Security notes

- `config.js` values are public-safe. `GEMINI_API_KEY` is server-env-only.
- `/api/gemini` is rate-limited (40/min/IP), validates shape/roles/size,
  forces JSON output, and retries newer models on 404.
- Costs: flash-lite is the cheapest tier; one small JSON call per arc/judge/
  coach/daily/taunt. Watch usage in Google AI Studio.

## Roadmap

- Per-goal response caching to cut AI costs.
- Streak recovery emails / push (later).
