# Waygr — Architecture (Phase 1, thin)

**Status:** Docs for Cursor Steps 1–8. BUILD-BRIEF is SoT.  
**Owner:** Head of Engineering  
**Date:** 2026-09-24 (course-correct: public GitHub)  
**Repo:** https://github.com/Topher-1/Waygr  
**Inputs:** `docs/BUILD-BRIEF.md` · `docs/patterns-brief.md` · `docs/prd.md` · HANDOFF  
**Token discipline:** Composer for locked execute; one CA at a time; max 2/app/day; fail-closed amend same PR; no look-model on scaffold.  
**Non-goals:** App code; Phase 2/3; Origin-only scaffold; changing Locked decisions / Non-goals / color / voice without Argos → Chris.

If this file disagrees with BUILD, **BUILD wins**.

---

## 1. Purpose

Trace Phase 1 so Cursor can execute **one PR per step** (HANDOFF / BUILD Prompt to paste) without inventing stack, schema, or referee rules.

**Locked calls (BUILD · Locked decisions):**

| Call | Value |
|------|-------|
| Platform | Next 15 App Router, TS, Tailwind, Serwist, Vercel |
| Backend | Supabase (Postgres, Auth, Realtime, Storage, Edge Functions, Cron) + Drizzle migrations |
| Stakes | Forfeits only — no money / drinks / prizes / payment links |
| Lines | Creator sets spread/total in 0.5 steps; lock at kickoff |
| Leagues | NFL, NCAAF, NBA (NCAAB before March) |
| Referee | Score feed only; admin void |
| Scores | `ScoreProvider`; BALLDONTLIE → SportsDataIO fallback |
| Polling | Supabase Cron → `poll-scores` every 30 s |
| Copy / theme | `APP_NAME` + `lib/copy.ts`; Brand tokens; dark default |
| Analytics | PostHog |

Chris-only parks: challenge link domain, Apple Developer, BALLDONTLIE tier.

---

## 2. System shape

```
PWA (create / accept link / live / forfeit / rematch)
  → Route Handlers + SSR (service role only where BUILD says)
  → Supabase Postgres + RLS
  → Realtime (games + messages on live page)
  → Edge Functions (service role):
        poll-scores (30s) → ScoreProvider
        settle (after poll) → pure settle() + transactional write
        sweep (1m) → expire / void / proof / jersey
  → Web push + PostHog
```

Client never holds the service role. Client never writes `games`, post-accept challenge state, or forfeits.

---

## 3. Data model (Drizzle → SQL in `drizzle/`)

Implement BUILD · Data model as written. Enums:

`league` · `game_status` · `market` · `pick` · `challenge_state` · `outcome` · `forfeit_kind` · `forfeit_status`

Tables: `profiles`, `teams`, `games`, `challenges`, `forfeits`, `messages`, `push_subscriptions`, `notifications_sent`, `blocks`, `reports`.

View: `rivalries` (settled H2H).

**RLS (BUILD):** keys off `profiles.auth_user_id = auth.uid()`. Own profile / subscriptions / blocks. Challenges readable by creator + opponent; public landing uses **service role** and exposes display fields only. Messages: two parties; writable until 24h after settlement. **Only Edge Functions (service role)** write `games`, challenge state after acceptance, and forfeits.

**Storage:** private `proof` bucket; max 50 MB; images + video ≤30 s; signed URLs 1 h; delete 90 days after paid.

**Account delete:** remove auth user, messages, push, proofs; rename profile to `Deleted user`; keep settled challenges.

**Accept race:** one conditional update  
`where state = 'open' and kickoff > now() and creator_id <> :user` — exactly one winner.

**State machine (BUILD):**  
`open → accepted | canceled | expired` · `accepted → live | void` · `live → settled | void`.

Settlement rules (overtime counts for winner/spread/total; postponed/suspended/canceled → void; no final 12h after start → admin flag) live in BUILD · Definitions — do not re-invent in code comments.

---

## 4. Pure settle + jobs

| Piece | Rule |
|-------|------|
| `lib/settle.ts` | Pure. Returns `creator` \| `opponent` \| `push` \| `null`. **Never writes.** Ship as-is (reconstructed copy in workspace; prefer PDF if conflict). |
| `lib/settle.test.ts` | **SoT = PDF** (24 cases). Cursor restores from PDF; keep green. |
| Edge `settle` | On games that changed: move accepted→live at start; call `settle()` for accepted/live; write `outcome`, `state=settled`, `settled_at`, create forfeit (`due_at = settled + 7d`; jersey_swap → paid immediately + jersey frame) in **one transaction**; queue notifications. Replay = no duplicate forfeits/notifications. |
| Edge `poll-scores` | Cron 30 s. Update games live or starting ≤15 m with an accepted challenge. Every 10 m refresh next-7-day schedules. |
| Edge `sweep` | ~1 m: expire open past kickoff; void postponed/canceled; auto-confirm proof after 72 h; end jersey frames. |

`ScoreProvider` (BUILD):

```ts
interface ScoreProvider {
  listGames(league: League, from: Date, to: Date): Promise<GameUpsert[]>;
  getLive(providerGameIds: string[]): Promise<GameUpdate[]>;
}
```

Adapter rules: patterns-brief §4–6. Halftime/break: `period` = next period.

---

## 5. Routes (Phase 1)

| Route / job | Role |
|-------------|------|
| `GET /c/[slug]` | Challenge page SSR; state drives view; no sign-in to view |
| `GET /c/[slug]/opengraph-image` | 1200×630 preview; cache until state change |
| `GET /api/cards/[slug]?type=&format=` | Result cards PNG |
| `POST /api/challenges` | Create (reject if kickoff < 2 m) |
| `POST /api/challenges/[id]/accept` | Conditional accept; first accept sets `referred_by` |
| `POST /api/challenges/[id]/cancel` | Creator, open only |
| `POST /api/challenges/[id]/rematch` | Clone onto next game of either team |
| `POST /api/forfeits/[id]/paid` \| `/proof` \| `/confirm` \| `/reject` | Forfeit lifecycle |
| `GET /api/games?league=&from=&to=` | Next 7 days for create |
| `POST/DELETE /api/push/subscribe` | Web push |
| `POST /api/account/delete` | Soft-delete path above |
| Edge `poll-scores` / `settle` / `sweep` | As §4 |

Trash talk: messages via Supabase client + RLS; live page Realtime on `games` + `messages`.

---

## 6. File structure (Phase 1 target)

```
/
├── app/
│   ├── (auth)/…
│   ├── (app)/                 # Home, create, profile, rivalry, settings
│   ├── c/[slug]/              # challenge + opengraph-image
│   ├── api/…                  # challenges, forfeits, games, push, cards, account
│   └── sw.ts                  # Serwist
├── drizzle/                   # SQL migrations matching BUILD schema
├── supabase/functions/
│   ├── poll-scores/
│   ├── settle/
│   └── sweep/
├── lib/
│   ├── settle.ts              # unchanged
│   ├── settle.test.ts         # 24 cases from PDF
│   ├── copy.ts                # + banned-words test
│   ├── scores/                # ScoreProvider + balldontlie + sportsdataio
│   └── …
├── styles/tokens.css          # Brand brief tokens only
├── docs/                      # BUILD, PRODUCT, GROWTH, BRAND, patterns, architecture, prd, preview
└── .cursor/rules/waygr.mdc    # Locked decisions, Non-goals, color, voice
```

Env (BUILD): Supabase + `BALLDONTLIE_API_KEY` (+ SportsDataIO if flipped) + VAPID + `NEXT_PUBLIC_POSTHOG_*` + cron secrets. Document simplest defaults in README; do not invent domain.

---

## 7. Step order (locked — partner with Builder)

Identical to HANDOFF / BUILD Prompt to paste / `prd.md` slices. One PR each.

1. Scaffold, tokens, copy + banned-words, schema, migrations, RLS  
2. ScoreProvider / BALLDONTLIE, `poll-scores` / `settle` / `sweep`, settle + 24 tests + replay  
3. Auth + 18+ + challenge page views + link preview  
4. Games API, create sheet, Home, cancel, rematch  
5. Live + Realtime + meter + trash talk  
6. Forfeits + result cards + Profile + Rivalry *(Designer assets first)*  
7. PWA + push + analytics  
8. Settings, block/report, delete account, README  

Engineer review gate on each Cursor PR (when Argos launches): **RLS · settle purity/idempotency · banned-words · schema drift vs this doc / BUILD**.

---

## 8. Non-goals (BUILD — stay out)

Money in any form; stranger matching / public feed; groups/rooms/leaderboards/counter-offers (P2); native / iMessage / Live Activities (P3); Waygr texting/emailing people; chat outside a challenge; leagues beyond NFL/NCAAF/NBA in Phase 1.

---

## 9. Acceptance anchors (full list in BUILD)

Foundation: banned-words test; RLS; tokens only.  
Scores: 24 settle cases; NFL replay; ≤2 min settle; no duplicate forfeits; void/expire via sweep.  
Loop: accept ≤3 taps + provider; OG real matchup; create under timing bar; live update ≤60 s; forfeit flows; PWA + push caps; axe on core screens.
