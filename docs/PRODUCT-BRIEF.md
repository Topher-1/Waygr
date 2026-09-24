Waygr — Product brief
Sep 24, 2026 · Part of the Waygr doc set: PRODUCT-BRIEF, GROWTH-LOOP, BRAND-BRIEF,
BUILD-BRIEF


Summary
Waygr is a free app for calling your shot against a friend on a live game. You drop a
challenge into the group chat, your friend accepts from the link without installing anything,
the score feed settles it, and the loser owes a forfeit the app puts on display. No money
moves through the app.

Marketing is built into the product, not bolted on after. Every challenge needs a second
person, so every challenge sent to someone new is an invite, and every result is a card
made to be shared. The Growth loop doc specs that loop and how to measure it.

The doc set, pressure-tested against what a small agent team needs to ship a viral app:


  Doc             Who uses it         Why it's needed

  Product
                  You, anyone
  brief (this                         Locks what Waygr is and isn't, so agents don't drift
                  who joins
  doc)

                                      Virality is the goal, so the loop gets designed and
  Growth loop     You and Argos
                                      measured like a feature

                                      The share cards are the marketing; they need a look
  Brand brief     Designer bot
                                      before they get built

                  Argos and the       Standfast format: phases, locked decisions, data model,
  Build brief
                  coding agents       acceptance criteria, prompt to paste


Left out on purpose: business plan, market sizing, pitch deck and financial model. None of
them changes what gets built for a hobby launch, and the numbers that matter (invite
conversion, rematch rate) won't exist until beta. Legal is cut to four product guardrails.

Three calls for you are at the bottom under Open decisions.


First principles
The job hasn't changed since 2016: friends want to back their take on a game against each
other, with something on the line, and win the argument in front of the group. Today that's a
text ("loser buys wings"), then forgotten terms, an argument about the result, and nobody
collecting.

What changed is everything around the job:


  Then (2016)               Now (2026)                             What it means for Waygr

  Both people had to        A link opens a fast web app            Accept from the link, no
  install a native app      straight from the group chat           install; native comes later

                                                                   Scope is limited by
  Building well took a      An agent team ships a PWA in
                                                                   judgment, not engineering
  funded team months        weeks
                                                                   cost

  Live scores meant
                            Hobby-tier feeds run free to about     Every challenge settles
  scraping or pricey
                            $40 a month                            itself; nobody self-reports
  feeds

  Sports betting was
                            Legal in 39 states and D.C.;           People already speak
  illegal almost
                            prediction markets are mainstream      spreads, overs and props
  everywhere

  Marketing meant ads       Growth comes from things shared        The product has to make
  and PR                    in group chats and short video         things worth sharing


Product principles, used to break ties:

1. The challenge is the product. Everything else serves making, accepting or settling one.

2. Nothing stands between the link and "You're on." No install, no profile setup, one-tap
    sign-in.

3. The feed is the referee. No disputes, no self-reporting.

4. Stakes are social, not financial. Losers owe a forfeit the app enforces in public.

5. Every result makes something shareable.

6. Rivalries, not streaks. The running head-to-head record is what brings people back.

From the 2016 wireframe, the challenge itself and most of the prop menu survive (quarter
winner, halftime leader, spread), joined by game winner and total. "Points at X minutes" is
cut because feeds don't reliably timestamp scores. Charging the loser, drinks as stakes,
bar-side redemption, scanner hardware and the business dashboard are gone.
Core loop and v1 scope
v1 is one loop done well: make a challenge, get it accepted from a link, watch it live, settle it,
pay the forfeit, rematch.


 flowchart LR
    A[Pick a game<br/>and your call] --> B[Pick a forfeit]
    B --> C[Share the link<br/>to a friend or chat]
    C --> D[Friend accepts<br/>no install]
    D --> E[Live page<br/>both watch]
    E --> F[Feed settles it]
    F --> G[Result card<br/>and forfeit]
    G --> H[Rematch]
    H --> A


The forfeit replaces "loser is charged" as the enforcement. Three kinds ship in v1:

   Concession card. The loser sends a pre-written card to the chat ("I was wrong about
   the Cowboys. —Jordan"). One tap from the result screen.

   Jersey swap. The loser's avatar wears the winner's team frame for 7 days. Automatic; it
   can't be skipped.

   Custom. The challenger writes it ("wear his jersey to the next watch party"). The loser
   posts a photo or video as proof and the winner confirms.

Unpaid forfeits show as "Owes 1" on the loser's profile, and everyone's paid rate is public.
Welching costs reputation, which is the only currency Waygr has.


  Feature                                                                                Phase

  1v1 challenge by link: game winner, spread, total, halftime leader, quarter winner     1

  Accept in the browser with Sign in with Apple, Google or a phone code                  1

  Auto-settle from the feed, ties included; void on postponed or canceled games          1

  Live challenge page: score, both calls, time left, trash-talk thread                   1

  Forfeits: concession card, jersey swap, custom with proof                              1

  Result cards as images, rematch in one tap, rivalry record per pair                    1

  Web push once the PWA is on the home screen                                            1

  Group challenges ("who's in?") and group leaderboards                                  2
 Rooms: a QR on the TV or a table card puts everyone into one live board                 2

 Native iOS app: iMessage extension, Live Activities on the lock screen, widgets         3

 Money, drinks or anything with cash value as a stake                                    Never



What's out there
Nobody owns the fast one-on-one challenge between friends that settles itself and makes
the loser pay up in public. The closest products need real money, a bar, or a season-long
league.


 Product         What it is                              Why it doesn't do Waygr's job

                 Real-money betting with friends;        Shut its app in late 2022, then sold to
 Wagr            licensed in Tennessee, about $16M       Yahoo. Money meant licenses state
                 raised                                  by state

                 Free friend-betting app out of
                                                         Both sides install an app; tracking, no
 WagerLab        Houston, plus white-label games for
                                                         enforced stakes
                 sports bars

                 Live sports trivia with a leaderboard   Trivia against the room, not calls
 Sports-IQ
                 for your bar, QR check-in               against a friend

                 Free live prop game at participating
 BarSharp                                                Bar-bound; you against a leaderboard
                 bars, with prizes

                 The original bar game network,          Sold for $2M in 2020; runs on venue
 Buzztime
                 since 1985                              sales

 BeTeam,
                 Season-long pick'em pools for a         One pick a week; no head-to-head
 Gamby,
                 group                                   moment
 Trofeo

 Kalshi,
                 Real-money prediction markets,          Money against strangers, the
 Polymarket,
                 available in Texas                      opposite of a friendly stake
 Novig


The lesson from Wagr: a bet nobody takes goes unmatched, and a dead end kills the loop. A
Waygr challenge lands in a chat that's already talking about the game, and anyone in that
chat can take the other side.
Guardrails
Four product rules. They cost nothing on a hobby build and are painful to retrofit later.

   No money, drinks or anything with cash value as a stake, and nothing moves
   through the app. In Texas, recording more than five bets on something of value in a day
   meets the statutory definition of bookmaking, and bars can lose their permit over
   gambling on premises. Social stakes keep rooms in bars possible.

   Forfeits never involve alcohol, money or risk of injury. The built-in set is curated;
   custom forfeits are screened (rules in the build brief).

   18+ to sign up.

   No prizes in v1. If a bar or brand wants to put up prizes later, that's a separate free-to-
   play contest, and it gets an hour of legal review first.


Open decisions
   Clear the name with your friend who ran the first Waygr: his OK to reuse it, and who
   holds waygr.com and the @waygr_app handles. Yahoo owns Wagr, a sound-alike in the
   same category; fine for a hobby, worth a trademark search before any public launch.

   Pick three to five seed group chats for the private beta (criteria in Growth loop).

   Confirm the beta target: the Thanksgiving NFL slate, Nov 26, 2026.

Risks to watch from week one:

   Seasonality. Use will spike on NFL Sundays and in March, then sag in summer. NBA and
   MLB coverage plus the rivalry record have to carry the gaps.

   Welching. If losers ignore forfeits, stakes feel fake. Track the paid rate; if it drops below
   half, make forfeits more automatic.

   iOS push. Web push only works after someone adds the PWA to their home screen, so
   the first accept can't depend on it. The link and the chat carry Phase 1.


Sources
   Tex. Penal Code §47.01, definitions

   TABC public safety and enforcement FAQs

   RotoWire: Texas sports betting status, July 2026
Sports Illustrated: Texas prediction markets, September 2026

Sports Handle: Yahoo acquires Wagr

BettingUSA: Wagr review

Crunchbase: WagerLab · Crunchbase: Waygr (closed)

Sports-IQ on the App Store · BarSharp on the App Store

Buzztime · Buzztime asset sale, 2020

BeTeam · Gamby · Trofeo

BALLDONTLIE · SharpAPI provider comparison

Format borrowed from Standfast — Viability & Build Spec
