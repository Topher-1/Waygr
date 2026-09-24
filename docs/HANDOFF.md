# Waygr handoff (Argos · 2026-09-24)

**Source of truth:** `docs/BUILD-BRIEF.md` (PDF originals also in docs/). If docs disagree, BUILD wins.
**Locked:** Locked decisions, Non-goals, color rules, voice rules — fixed. Any proposed change → Argos → Chris before acting.

## Assignments
- **Designer:** From BRAND-BRIEF + `docs/waygr-brand-preview.png` (direction, not pixel spec). Deliver: wordmark SVG light+dark; app icon 1024 + PWA sizes; templates for link preview 1200×630, result card 1080×1350, story card 1080×1920. **Due before build step 6.**
- **Engineer + The Builder:** Phase 1 in Cursor, **one PR per step**, using "Prompt to paste" in BUILD-BRIEF. Put four docs + preview in `docs/`; put `settle.ts` + `settle.test.ts` in `lib/` **unchanged**.
- **Argos:** Track acceptance criteria; weekly update to Chris (steps merged, criteria passing, blocks). Only escalate: link domain, Apple Developer account, BALLDONTLIE tier.

## Timeline (loose)
Code complete ~Nov 13 · NFL Sunday dogfood Nov 15 & 22 · Private beta Thanksgiving Nov 26. Prefer MVP ASAP.

## Steps (one PR each)
1. Scaffold, tokens, copy+banned-words, schema, migrations, RLS
2. ScoreProvider / BALLDONTLIE, poll-scores / settle / sweep Edge Functions
3. Auth + 21+ + challenge page views + link preview
4. Games API, create sheet, Home, cancel, rematch
5. Live + Realtime + meter + trash talk
6. Forfeits + result cards + Profile + Rivalry *(needs Designer assets)*
7. PWA + push + analytics
8. Settings, block/report, delete account, README

## Chris-only questions (parked until needed)
1. Challenge link domain
2. Apple Developer account?
3. BALLDONTLIE tier after confirming what each returns
