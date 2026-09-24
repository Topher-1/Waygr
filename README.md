# Waygr

Call your shot against a friend on a live game. The score feed settles it. The loser owes a forfeit — not money.

**Build in public.** Phase 1 = installable PWA (Next.js 15 · Supabase · Vercel). Source of truth: [`docs/BUILD-BRIEF.md`](docs/BUILD-BRIEF.md).

Status: **Step 3 of 8** — Auth, 18+ gate, challenge page (five views), link preview OG.

## Docs

| Doc | Purpose |
|-----|---------|
| [`BUILD-BRIEF.md`](docs/BUILD-BRIEF.md) | Source of truth — phases, schema, acceptance criteria |
| [`architecture.md`](docs/architecture.md) | Engineering map for Steps 1–8 |
| [`patterns-brief.md`](docs/patterns-brief.md) | Patterns to steal (Standfast, Harbor) |
| [`BRAND-BRIEF.md`](docs/BRAND-BRIEF.md) | Tokens, voice, typography |
| [`PRODUCT-BRIEF.md`](docs/PRODUCT-BRIEF.md) | What and why |
| [`GROWTH-LOOP.md`](docs/GROWTH-LOOP.md) | Virality metrics |
| [`prd.md`](docs/prd.md) | Phase 1 PRD slices |
| [`HANDOFF.md`](docs/HANDOFF.md) | Roles and timeline |

## Stack

- **Next.js 15** App Router, TypeScript, Tailwind CSS 4
- **Serwist** PWA wiring (`app/sw.ts`, disabled in dev)
- **Supabase** Postgres, Auth, Realtime, Edge Functions
- **Drizzle** schema + SQL migrations in `drizzle/`

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + keys
npm run dev
```

## Scripts

| Command | What |
|---------|------|
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Vitest — settle (24 cases), replay, idempotency, sweep, banned-words, RLS |
| `npm run test:replay` | Settle unit tests + NFL full-game replay |
| `npm run db:migrate` | Apply Drizzle migrations |

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_APP_URL` | Yes | e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Publishable anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Edge Functions + privileged routes |
| `DATABASE_URL` | Migrations | Postgres connection string |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Step 7 | Web push |
| `VAPID_PRIVATE_KEY` | Step 7 | Web push |
| `SCORE_PROVIDER` | Step 2 | `balldontlie` (default) |
| `BALLDONTLIE_API_KEY` | Step 2 | Score feed (tests use fixtures; no live key required) |
| `CRON_SECRET` | Step 2 | **Required** — Edge Function cron auth; requests rejected if unset |
| `NEXT_PUBLIC_POSTHOG_KEY` | Step 7 | Analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | Step 7 | Analytics host |

## Supabase setup

1. Create dev and prod Supabase projects.
2. Enable Auth providers in Supabase Dashboard → Authentication → Providers:
   - **Google** and **Phone** (required for Step 3)
   - **Apple** optional until `NEXT_PUBLIC_APPLE_SIGN_IN_ENABLED=true` and Apple Developer account is wired
3. Run migrations: `npm run db:migrate` (or apply `drizzle/*.sql` via Supabase SQL editor).
4. Apply migrations through `drizzle/0004_accept_challenge_atomic.sql` (includes Step 2 settle RPC)
5. Set `CRON_SECRET` in Supabase Edge Function secrets (required — jobs reject requests without a matching `x-cron-secret` header)
6. Deploy Edge Functions: `poll-scores`, `settle`, `sweep` (`verify_jwt = false`; auth is `CRON_SECRET` only)
7. Configure Supabase Cron (Dashboard → Integrations → Cron) with header `x-cron-secret: <CRON_SECRET>`:
   - `poll-scores` — `*/30 * * * * *` (every 30 s) → POST `/functions/v1/poll-scores`
   - `sweep` — `*/1 * * * *` (every 1 m) → POST `/functions/v1/sweep`
   - `settle` is invoked by `poll-scores` after games change (also callable directly)

### Step 2 tests

```bash
npm test                  # all tests including 24 settle cases + replay
npm run test:replay       # settle.test.ts + replay-nfl.test.ts only
```

Replay fixture: `fixtures/nfl-full-game.json` (KC 27, BUF 20). Vitest replays each timeline step through `runPollScores` + `settleGames` without a live BALLDONTLIE key.

## Chris-only parks (Step 3 decisions)

1. **Challenge link domain** — use `NEXT_PUBLIC_APP_URL` (and Vercel preview URLs per deploy). No custom domain yet.
2. **Apple Developer account** — Google + phone ship first; Apple button is stubbed until `NEXT_PUBLIC_APPLE_SIGN_IN_ENABLED=true` and Supabase Apple provider are configured ($99/yr).
3. **BALLDONTLIE tier** — out of scope for Step 3 (Step 2 uses fixtures in tests).

## Non-goals (Phase 1)

No money, payment links, stranger matching, groups/rooms, native app, or contact spam.

---

Topher-1 · free · forfeits only
