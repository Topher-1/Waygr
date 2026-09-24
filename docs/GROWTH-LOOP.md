Waygr — Growth loop

The loop
Waygr grows when one person's challenge puts the app in front of someone new, and that
person sends their own challenge within a week. Everything in this doc exists to raise those
two numbers.


 flowchart TD
    A[Sam sends a challenge<br/>to the group chat] --> B[Jordan opens the link]
    B --> C[Jordan accepts<br/>no install]
    C --> D[Game settles<br/>result card lands in chat]
    D --> E[Rest of the chat sees it]
    D --> F[Rematch]
    E --> G[Someone new sends<br/>their own challenge]
    G --> A
    F --> A


Four loops, in order of importance:


 Loop         Trigger                           What spreads

              A challenge sent to someone not
 Invite                                         The app itself, through the link
              on Waygr

                                                Result cards and forfeit proof, into chats and
 Content      Every settled challenge
                                                onto Instagram and TikTok

              The next game involving a team    A nudge: "Sam leads you 4–3. Chiefs play
 Rivalry
              either person picked              Sunday."

              A QR code on the TV at a watch
 Room                                           Everyone in the room joins with one scan
              party


Rules that make the invite loop work:

1. The link preview does the selling. It renders the real matchup, the call and the forfeit,
   never a generic app card.

2. Tap to "You're on" in under 15 seconds. Sign in with Apple or Google, or a phone
   code. Name and avatar come from the sign-in.
3. Challenges read in the sender's voice. "Sam says the Chiefs cover −3.5. Loser wears
    the other team's colors for a week. You in?"

4. The next challenge is ready before the first one ends. After accepting, show "Your
    turn" with three pre-built calls on tonight's games.

5. No contact spam. Waygr never messages anyone on its own; people share through the
    native share sheet. Spammy invites burn the chat's trust in every future link.


Share cards
The cards are the ad budget. Each is an image plus a link, rendered server-side the moment
it's needed. Link previews render at 1200×630, the Open Graph size chat apps expect;
result cards export at 1080×1350 for chats and feeds and 1080×1920 for stories.


  Card           When           What it shows                            Where it goes

                                                                         Link preview in
                                Both avatars, the matchup, the call,
  Challenge      On send                                                 iMessage, WhatsApp,
                                the forfeit, "You in?"
                                                                         Slack

                 Lead
                                Score, who's winning the challenge,      Optional share from
  Live           change on
                                time left                                the live page
                 the call

                 Settle, to     "Called it." Winner, final score,
  Called it                                                              Chat or story
                 the winner     record against this rival

                 Settle,        "I was wrong about the Cowboys."         The chat; sending it
  Concession
                 loser pays     Loser's avatar in the winner's colors    is the forfeit

                 Custom
                                The loser's photo or video framed        Chat, Instagram,
  Proof          forfeit
                                with the terms and the score             TikTok (9:16 video)
                 done


Card rules: people and score big, one line of copy, wordmark small in one corner. Every card
has to read at thumbnail size, because that's how most people first see it.


Rooms
A room is a live board for everyone watching the same game in the same place: a watch
party, a tailgate, an office, a bar. Bars are one kind of room, not the channel.

Phase 2 flow: the host taps "Start a room" and puts its QR on the TV or a printed card.
Anyone who scans joins that game's board, can take open challenges from anyone in the
room, and sees the room's standings. The night ends with a room card ("Sunday at Maya's:
Dev went 5–1").

One host can turn a party into 10 to 30 new users in an evening, and they go home with
rivals they'll challenge from the couch. Rooms in bars follow the same guardrails: forfeits
only, no prizes, no drinks as stakes.


Launch calendar and seed groups
Launch into a moment, not a date. A new app gets tried when the group chat is already
loud.


  When            Moment                                Goal

  Nov 26,         Thanksgiving NFL slate: three         Private beta: 3 to 5 seed chats, about
  2026            games, everyone off work              50 people

  Dec 2026 –      Bowl season, College Football         Fix what beta broke; reach 300 people
  Jan 2027        Playoff, NFL playoffs                 through invites alone

                                                        First public push: one game, everyone
  Feb 2027        Super Bowl LXI
                                                        watching, endless props

                                                        The big swing: weeks of games, office
  Mar 2027        March Madness
                                                        pools, loud chats


What makes a good seed chat:

   8 to 30 people who already talk sports most days.

   Mixed loyalties. A chat of all Longhorns fans has nobody to take the other side.

   At least two people who argue about games for fun.

   One member who posts the first challenge on day one, ideally you.

Your McCombs cohort chats fit this profile well. Hold off on paid marketing until k-factor
clears 0.5. After that, the content is forfeit proof people already film: repost the best ones
(with permission) from a Waygr account on TikTok and Instagram.


Metrics and targets
These are our targets, not industry benchmarks. Setting them now gives beta a pass/fail
line. Every metric comes from the analytics events in the build brief, instrumented from day
one.


                                                                       Beta        March
  Metric            Definition
                                                                       target      target

  Link accept       Challenges accepted ÷ challenge links opened
                                                                       30%         40%
  rate              by non-users

  Time to           Median seconds from link open to accept, new       Under       Under 15
  "You're on"       users                                              20 s        s

                    New users who send their own challenge within
  Activation                                                           35%         45%
                    7 days

                    New accepting users per weekly active
  k-factor                                                             0.5         1.0
                    challenger, per week

                    Settled challenges followed by a rematch within
  Rematch rate                                                         30%         40%
                    7 days

                    Settled challenges where a result card gets
  Share rate                                                           25%         35%
                    shared

  Forfeit paid
                    Forfeits paid ÷ forfeits owed                      60%         70%
  rate

  Week-4
                    New users still active in their fourth week        20%         25%
  retention


If k-factor sits under 0.3 after four weeks of beta, stop adding features and fix the path from
link to accept. That path is the whole business.
