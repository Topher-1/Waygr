# Waygr — Patterns brief (Phase 1, thin)

**Status:** Course-correct 2026-09-24 — house refs + current framework docs first. BUILD is SoT.  
**Owner:** Head of Engineering  
**Repo:** https://github.com/Topher-1/Waygr (public; build in public)  
**Inputs:** `docs/BUILD-BRIEF.md` · HANDOFF · PRODUCT · Standfast + Harbor verified paths · live Next / Serwist / Supabase docs  
**Non-goals:** Inventing stack; Origin-only scaffold; paying BALLDONTLIE without Chris yes; whole-app Cursor; look-model on scaffold.

If this file disagrees with BUILD, **BUILD wins**.

---

## 1. Purpose

Cursor steals **proven** patterns — not invented ones. Primary refs are our own apps + current upstream docs. Score-feed OSS is secondary (Step 2 only).

**Token discipline (Chris / Argos):** Composer for locked execute steps; **one** Cloud Agent at a time; **max 2 CA / app / day**; fail-closed amend **same PR**. No look-model on scaffold.

---

## 2. Stack lock (BUILD · Locked decisions)

| Layer | Choice | Primary steal |
|-------|--------|---------------|
| App | **Next.js 15** App Router, TS, Tailwind, Vercel | BUILD; pin `next@15` (upstream docs may show 16 — do not bump) |
| Auth / DB | Supabase Postgres + Auth + RLS + Realtime + Storage + Edge Functions + Cron | Standfast `lib/supabase/*` + `drizzle/` |
| ORM | Drizzle + SQL migrations in-repo | Standfast `drizzle/` + `drizzle.config.ts` |
| PWA | Serwist (`@serwist/next`) | Standfast `next.config.ts` + `app/sw.ts`; Harbor `app/manifest.ts` |
| Tokens / copy | Brand brief tokens only; `APP_NAME` + `lib/copy.ts` | Harbor token test pattern; Standfast copy tests |
| Scores | `ScoreProvider`; BALLDONTLIE → SportsDataIO | §6 + pimento (Step 2) |
| Poll | Supabase Cron → Edge `poll-scores` every **30 s** | BUILD (not Vercel Hobby cron) |

Chris-only parks: challenge link domain, Apple Developer, BALLDONTLIE tier after live+period confirm for NFL **and** NCAAF.

---

## 3. House refs (best — cite these first)

### 3.1 [Topher-1/Standfast](https://github.com/Topher-1/Standfast) — Supabase / Drizzle / PWA / Auth

Verified on `main` (2026-09-24):

| Steal | Path | Waygr use |
|-------|------|-----------|
| Serwist wrap | `next.config.ts` (`withSerwistInit`, `swSrc: app/sw.ts`, `swDest: public/sw.js`, disable in dev) | Step 7 PWA wiring |
| Service worker | `app/sw.ts` (`Serwist`, `defaultCache`, BackgroundSync for offline writes) | Installable PWA; push handlers later |
| Cookie SSR clients | `lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `service.ts` | Auth + RLS; service role only for privileged jobs |
| Session middleware | `middleware.ts` → `updateSession` | Keep sessions fresh (Next 15 = `middleware.ts`, not `proxy.ts`) |
| Drizzle SQL migrations | `drizzle/*.sql`, `drizzle.config.ts` | BUILD schema → committed SQL |
| Copy + banned tests | `lib/copy/*` + `*.test.ts` | `lib/copy.ts` + whole-word ban on bet/wager/odds/payout |

**Do not steal from Standfast:** Vercel Cron as the 30 s score loop; Soft mode / streaks / workout_pings domain; email+password-only auth if BUILD asks Apple/Google/phone (Standfast pattern for **clients**, BUILD for **providers**).

### 3.2 [Topher-1/Harbor](https://github.com/Topher-1/Harbor) — Serwist surface + token discipline

Verified paths:

| Steal | Path | Waygr use |
|-------|------|-----------|
| Token module + CSS SoT | `lib/theme.ts` + `app/globals.css` | Map **Brand brief** tokens the same way (one module + CSS vars); dark default / system follow |
| Token regression test | `tests/theme-tokens.test.ts` | Fail build if CSS invents off-palette colors or drops required tokens |
| Web manifest | `app/manifest.ts` | Step 7 installability |

**Do not steal:** Harbor ember/OKLCH night palette, mixer/audio, or peach craft. Waygr colors = **BRAND-BRIEF only**.

---

## 4. Current framework docs (pull — never from memory)

Fetched 2026-09-24. Re-open before coding if links drift.

### 4.1 Next.js App Router (pin **15**)

- Install / App Router defaults: https://nextjs.org/docs/app/getting-started/installation  
- Upstream `create-next-app@latest` currently documents **Next 16** — for Waygr use `create-next-app@15` / `next@15` so BUILD lock holds.  
- Steal: App Router file conventions, Server Components + Route Handlers, `app/` layouts.  
- Do not invent Pages Router.

### 4.2 Serwist `@serwist/next`

- Getting started: https://serwist.pages.dev/docs/next/getting-started  
- Steal: `withSerwistInit({ swSrc, swDest, additionalPrecacheEntries })`, `app/sw.ts` with `Serwist` + `defaultCache` + `/~offline` document fallback, `app/manifest.json` (or `manifest.ts` like Harbor), layout metadata `appleWebApp` / themeColor.  
- Align wiring with Standfast’s already-working config rather than a second invent.

### 4.3 Supabase Auth + SSR (Next.js)

- Guide: https://supabase.com/docs/guides/auth/server-side/nextjs  
- Packages: `@supabase/supabase-js` + `@supabase/ssr`  
- Steal: browser + server clients; **middleware** on Next 15 to refresh cookies; protect with verified claims (`getClaims()` / equivalent) — never trust raw `getSession()` alone on the server for authz.  
- Env: project URL + publishable/anon key public; service role **server-only** (Edge Functions + privileged routes).  
- Waygr auth providers per BUILD Prompt (Apple / Google / phone) — still on the same SSR client shape as Standfast.

### 4.4 Supabase Edge Functions + Cron

- Use BUILD job table: `poll-scores` (30 s), `settle`, `sweep` (~1 m).  
- Do not put 30 s polling on Vercel Hobby cron.

---

## 5. Step 1 scaffold steals (Composer execute)

Order for Cursor Step 1 PR on **Topher-1/Waygr**:

1. Next 15 App Router + TS + Tailwind (pin versions).  
2. Brand tokens → CSS vars (+ Harbor-style “tokens only” test once tokens exist).  
3. `lib/copy.ts` + banned-words test (Standfast copy-test shape).  
4. Drizzle schema/migrations = BUILD data model; RLS policies = BUILD RLS.  
5. Supabase SSR client stubs + middleware (Standfast shape).  
6. Drop docs pack (`BUILD` / PRODUCT / GROWTH / BRAND / patterns / architecture / prd / preview) under `docs/`.  
7. Ship `lib/settle.ts` early or with Step 2 — **unchanged**; tests SoT = PDF.

No look-model. Fail-closed: amend the **same** PR.

---

## 6. Score feed (Step 2 — secondary OSS)

Keep settlement provider-swappable (BUILD interface):

```ts
interface ScoreProvider {
  listGames(league: League, from: Date, to: Date): Promise<GameUpsert[]>;
  getLive(providerGameIds: string[]): Promise<GameUpdate[]>;
}
```

| Ref | Steal | Don’t |
|-----|-------|-------|
| [jesssloss/pimento](https://github.com/jesssloss/pimento) `src/lib/scores/*`, `src/app/api/cron/scores/route.ts` | Provider interface + primary→fallback + cron secret + poll only active work | Golf ESPN as NFL primary; Vercel cron @ 30 s |
| BALLDONTLIE OpenAPI `https://www.balldontlie.io/openapi/{nfl\|ncaaf\|nba\|ncaab}.yml` | `/…/v1/games`; `status_state`; NFL `home_team_q1`…`ot` → `periodScores` (OT = period 5+) | Odds endpoints; invent field names |
| SportsDataIO | Fallback if live+period fail Chris gate | Dual-write conflicting `provider` rows |

Adapter: map statuses → `game_status`; at halftime/break set `period` to **next** period; poll only challenged games (+ 15 m pre-kickoff); schedule refresh every 10 m for next 7 days.

---

## 7. Explicit non-steals

- Origin-only private scaffold (canceled — home is public GitHub).  
- Prisma / Firebase / Expo / custom auth frameworks.  
- Money, payment links, sportsbook odds, stranger matching, groups (P2), native (P3).  
- Self-reported scores as referee.  
- Inventing Brand colors or copy voice.  
- Launching more than one CA, or a second CA the same day after two Waygr runs.

---

## 8. Handoff

1. This brief + `architecture.md` + Builder `prd.md` land in `Topher-1/Waygr`.  
2. Argos launches Step 1 **Composer** on that repo after Cursor GitHub App access.  
3. Engineer reviews each PR: RLS · settle · banned-words · schema drift.  
4. Quiet Chris unless blocked on BALLDONTLIE tier / domain / Apple.
