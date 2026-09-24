# Waygr — Phase 1 PRD (thin)

**Status:** GREENLIT for Cursor (Argos · 2026-09-24). Chris: start cooking, MVP ASAP.  
**Repo:** https://github.com/Topher-1/Waygr (public).  
**SoT:** [`BUILD-BRIEF.md`](./BUILD-BRIEF.md) — if anything disagrees, BUILD wins.  
**Also:** [`PRODUCT-BRIEF.md`](./PRODUCT-BRIEF.md) (what/why), [`HANDOFF.md`](../HANDOFF.md) (roles).  
**Engineering cites:** [`patterns-brief.md`](./patterns-brief.md) (ScoreProvider / jobs), [`architecture.md`](./architecture.md) (data model, Edge jobs, file layout). Stack/schema decisions must cite BUILD or these two — never invent.  
**Rule:** No inventing features. Every major decision cites BUILD Locked decisions / Non-goals / Prompt to paste (or patterns-brief / architecture when they only restate BUILD).  
**Delivery:** One PR per vertical slice (steps 1–8). After each step, gate merge on the acceptance criteria listed under that slice. Drop this `prd.md` into the repo on the first PR if missing.

---

## Problem

Friends want to back a take on a live game against each other with something on the line. Today that is a text (“loser buys wings”), forgotten terms, an argument about the result, and nobody collecting. (PRODUCT-BRIEF · First principles; BUILD · Challenge / Call / Forfeit definitions.)

## User

Two friends in a 1:1 text or group chat. Creator sends a challenge link; opponent accepts from the link without installing. Phase 1 targets ~50 friends dogfooding NFL Sundays (BUILD · Phase 1).

## Scope (Phase 1 only)

Installable PWA (Next.js 15 App Router, TypeScript, Tailwind, Serwist on Vercel; Supabase + Drizzle) that runs the full **1v1 loop**: create → accept from link → live → settle from score feed → forfeit → rematch → rivalry record → web push → analytics. (BUILD · Phases, Locked decisions, Screens and flows.)

**Stack / locks (cite BUILD · Locked decisions):** forfeits including drinks, food, honor-system money (no payment rails); first signed-in non-creator takes the other side; creator sets lines in 0.5 steps; lock at kickoff; leagues NFL / NCAAF / NBA; referee = score feed only; ScoreProvider (BALLDONTLIE first); Supabase Cron poll; OG + result cards; PostHog; `APP_NAME` + `lib/copy.ts`; brand tokens, dark default.

## Non-goals (stay out — BUILD · Non-goals)

- Payment rails (Stripe, Venmo/Apple Pay linking, wallets, escrow) — honor-system money on the line is OK; settlement is outside the app
- Prizes or sportsbook odds
- Matching strangers or a public feed of challenges
- Group challenges, rooms, leaderboards, counter-offers (Phase 2)
- Native app, iMessage extension, Live Activities, widgets, haptics (Phase 3)
- Importing contacts, or Waygr sending texts/emails to anyone
- Chat outside a challenge
- Leagues beyond NFL, college football, NBA in Phase 1 (NCAAB later, before March)

## Done-when (Phase 1)

BUILD · Acceptance criteria all pass; dogfood NFL Sundays Nov 15 & 22; private beta ~Nov 26. Prefer MVP ASAP. Chris-only parks: challenge domain, Apple Developer account, BALLDONTLIE tier (HANDOFF).

## Designer gate

Designer assets (**wordmark SVG light+dark; app icon 1024 + PWA sizes; templates for link preview 1200×630, result card 1080×1350, story 1080×1920**) required **before step 6** (forfeits / result cards). Direction: BRAND-BRIEF + `waygr-brand-preview.png`. (HANDOFF.)

---

## Vertical slices = BUILD Prompt to paste (steps 1–8)

Order confirmed identical to BUILD-BRIEF “Prompt to paste” and HANDOFF steps. One PR each. Ship `lib/settle.ts` + `lib/settle.test.ts` unchanged when step 2 lands.

### Slice 1 — Scaffold

**Build:** Scaffold, `tokens.css`, `copy.ts` + banned-words test, schema, migrations, RLS policies.  
**Merge when these acceptance criteria start passing (foundation):**

- A test fails the build if any string in `lib/copy.ts` contains the whole words “bet,” “wager,” “odds,” or “payout.”
- Through the Supabase client, a signed-in person can’t read challenges or messages they’re not part of (RLS tested; expand as tables appear).
- Colors come only from Brand brief tokens (tokens wired; full axe pass later with UI).

### Slice 2 — Scores + settle jobs

**Build:** ScoreProvider adapter (BALLDONTLIE), Edge Functions `poll-scores`, `settle`, `sweep`; ship settle + 24 tests unchanged; replay fixture path.  
**Merge when:**

- `settle.test.ts` passes all 24 cases.
- A replay test runs a recorded full NFL game through poll-scores and settle and gets every market right.
- Challenges settle within 2 minutes of the feed reporting a final or finished period; running settle twice creates no duplicate forfeits or notifications.
- A postponed or canceled game voids its challenges; unaccepted challenges expire at kickoff (sweep).

### Slice 3 — Auth + challenge page + OG

**Build:** Auth (Apple, Google, phone), 21+ gate, challenge page all five views, link preview OG route.  
**Merge when:**

- Signed-out person can open a challenge link and reach “You’re on.” in ≤3 taps plus the provider screen (needs a seeded/open challenge; create UI may still be Slice 4).
- iMessage and WhatsApp link previews show the challenge image, not a generic card.
- Challenge page main content LCP < 2.0 s (Lighthouse mobile / mid-range 4G target).
- Nobody can accept their own challenge, accept after kickoff, or accept one already taken; two simultaneous accepts → exactly one opponent (tested).
- The 21+ checkbox is required before a person’s first create or accept.

### Slice 4 — Create + Home

**Build:** Games API, create sheet, Home, cancel, rematch.  
**Merge when:**

- Create flow works under the BUILD hard limit (returning user < ~20 s with defaults).
- Cancel (creator, open only) and rematch (clone onto next game, editable) work per routes table.
- Home ordering matches BUILD (live → owed forfeits → open waiting → tonight’s one-tap calls; orange Make a call pinned).

*(Full dogfood of accept-from-link + create now possible.)*

### Slice 5 — Live + trash talk

**Build:** Live view with Realtime scores, challenge meter, trash talk.  
**Merge when:**

- Live page updates score and meter within 60 s without refresh; trash-talk message shows for the other person within 2 s.
- If the feed is >2 minutes stale on a live game, show “Score’s lagging. Retrying.” (skeletons, never spinners, for the score strip).

### Slice 6 — Forfeits + cards + Profile + Rivalry

**Build:** Forfeits (concession share, jersey frame, custom proof), result cards, Profile, Rivalry. **Blocked on Designer assets.**  
**Merge when:**

- Concession card opens native share sheet with image on iOS/Android and marks forfeit paid when sharing completes; desktop → download.
- Jersey frame shows on loser’s avatar for 7 days, then disappears.
- Custom proof uploads; winner confirm/reject; auto-confirm after 72 hours.
- Custom forfeit screening allows drinks and honor-system money; blocks payment rails and dangerous terms.
- axe: no serious/critical on Challenge, Home, Create in both themes; layouts hold at 200% text size (with Profile/Rivalry as shipped).

### Slice 7 — PWA + push + analytics

**Build:** PWA install card, service worker, web push with caps and quiet hours, every analytics event.  
**Merge when:**

- Install prompt: never before first accept; after first settled challenge, one “Add to home screen” card (iPhone three-step Share instructions).
- Lighthouse installability passes; web push arrives on iPhone after adding to home screen.
- Push caps and quiet hours enforced (unit tested); BUILD notification table limits respected.
- Every listed analytics event fires once with listed properties in PostHog live events.

### Slice 8 — Settings + safety + README

**Build:** Settings, block and report, delete account, README.  
**Merge when:**

- Blocking: blocked people can’t take your open challenges; their messages hidden from you.
- Report option on every message and custom forfeit → `reports`.
- Deleting an account works as specified and leaves the other person’s record unchanged.
- README covers Supabase setup, auth providers, VAPID, Cron entries, replay script (BUILD · Delivery).

---

## Gate protocol (Builder + Argos)

After each Cursor PR:

1. Builder lists which BUILD acceptance criteria now pass (this table).
2. Fail-closed if Non-goals leak (money, groups/rooms, native, contact spam) or Locked decisions drift.
3. Argos merges only after that gate (and QR when Argos assigns).
4. One CloudAgent / one step at a time; resume same PR on fail-closed (fleet caps).

## Out of Builder invent

Do not add markets, leagues, stake types, notification channels, or screens not in BUILD. Park Chris questions 1–3 via Argos only.
