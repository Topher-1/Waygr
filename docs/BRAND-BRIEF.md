Waygr — Brand brief

Positioning and voice
Waygr is the group chat's scoreboard. It should look like a premium sports broadcast and
sound like your funniest friend: confident, quick, a little cocky, never mean.

Voice rules:

   Short. Headlines run five words or fewer. No sentence in the app runs past 15.

   Talk trash, not trash about people. Jokes land on the call, never on someone's looks,
   money or intelligence.

   Say "call" and "challenge," never "bet," "wager," "odds" or "payout" in the UI. The
   name is the only wink. Sportsbook words make it read as gambling and pull it away from
   friends having fun.

   Losing is never red and never shamed. A loss gets a shrug and a rematch button.

   Numbers are exact. "KC covered by 3.5," never "KC covered easily."


  Moment                      Copy

                              Sam says Chiefs −3.5. Loser wears the other team's colors for a
  Challenge preview
                              week. You in?

  Accept button / decline     I'm in / Not this one

  Accepted                    You're on.

  Live, your side ahead /
                              You're up. / Jordan's up.
  behind

  Win                         Called it.

  Loss                        Not your night. Rematch?

  Push                        Push. Nobody owes.

  Game postponed or
                              Game's off. Challenge voided.
  canceled
  Forfeit owed                You owe Sam one.

  Forfeit paid                Paid in full.

  Rivalry nudge               Sam leads you 4–3. Chiefs play Sunday.

  Empty home                  No calls yet. Cowboys at Eagles, 7:20. Make one.

  Score feed down             Score's lagging. Retrying.



Color
Dark-first, because people use Waygr at night, next to a TV. Light mode is a full twin that
follows the system setting. Waygr Orange is you; Rival Blue is them. Orange and blue stay
easy to tell apart for the most common kinds of color blindness, and every side also carries
a name, so color is never the only signal.


  Token           Dark          Light         Use it for                Contrast (checked)

  bg              #0B0B0D       #FAFAF7       App background            —

  surface         #16161A       #FFFFFF       Cards, sheets             —

                                              Pressed states, inputs,
  raised          #202026       #F1F0EC                                 —
                                              meter track

  border          #2E2E36       #E2E0DA       Card edges, dividers      —

  text            #F5F3EF       #121214       Body and headlines        14.6:1 or better

                                              Labels, timestamps,
  muted           #A1A1AA       #5E5E66                                 5.6:1 or better
                                              secondary copy

                                              Your side, primary        Dark 5.3:1 or better
  orange          #FF5F1F       #FF5F1F       buttons, the              as text; ink on orange
                                              wordmark, LIVE            6.5:1

                  #FF5F1F                     Orange text, icons and
  orange-
                  (same as      #C2410C       thin marks in light       4.5:1 or better
  strong
                  orange)                     mode

  blue            #4D8DFF       #2563EB       Their side                4.5:1 or better

                                              Paid, accepted,
  green           #34D17D       #166534                                 6.2:1 or better
                                              confirmed
                                            Form errors and
  rose            #FF4D6D         #BE123C                             5.0:1 or better
                                            failures only

                                            Text on orange, blue
  on-                                       (dark) and green
                  #0B0B0D         #0B0B0D                             6.1:1 or better
 accent                                     (dark) fills



Every text pair was checked against WCAG 2.1 AA (4.5:1) on bg , surface and raised in
both modes, and all pass.

Rules the coding agents follow:

1. Text on orange is always ink (#0B0B0D), never white. White on this orange is 3.0:1
     and fails.

2. Orange means you and "do this." One orange button per screen.

3. Blue only ever means the other side. No blue links or blue buttons.

4. No red for losing. A loss is muted plus an orange Rematch button. Rose is for errors
     only.

5. Green only for done states: paid, accepted, settled in your favor.

6. The leader gets size and weight, not a new color. Sides keep their color the whole
     game.

7. The one gradient is an orange glow in the corner of share cards. Nowhere else.

 :root {
     --bg:#0B0B0D; --surface:#16161A; --raised:#202026; --border:#2E2E36;
     --text:#F5F3EF; --muted:#A1A1AA;
     --orange:#FF5F1F; --orange-strong:#FF5F1F; --blue:#4D8DFF;
     --green:#34D17D; --rose:#FF4D6D; --on-accent:#0B0B0D;
 }
 @media (prefers-color-scheme: light) {
     :root {
         --bg:#FAFAF7; --surface:#FFFFFF; --raised:#F1F0EC; --border:#E2E0DA;
         --text:#121214; --muted:#5E5E66;
         --orange:#FF5F1F; --orange-strong:#C2410C; --blue:#2563EB;
         --green:#166534; --rose:#BE123C; --on-accent:#0B0B0D;
     }
 }


In light mode, text on blue , green and rose fills is white (5.1:1 or better). Use --orange-
strong for any orange text or icon so one class works in both modes.



Type
Two free Google Fonts. Both have tabular figures (checked in the font files), so scores and
clocks never jitter as digits change.


  Role           Font                   Size / line height            Notes

                 Barlow                 Wordmark 22–28 px; about      The italic leans
  Wordmark,
                 Condensed              260 px on 1080-wide share     forward. Big moments
  "Called it."
                 ExtraBold Italic       cards                         only

                 Barlow
                                        64 / 64 on live, 40 / 40 in
  Scores         Condensed                                            tabular-nums always
                                        lists
                 ExtraBold

                 Barlow
  Headline       Condensed
                                        40 / 40                       Two lines max
  (the call)     ExtraBold,
                 uppercase

  Title          Inter SemiBold         20 / 26                       Screen and sheet titles

                                                                      16 px minimum so iOS
  Body           Inter Regular          16 / 24                       never zooms on input
                                                                      focus

                 Inter SemiBold,                                      Eyebrows: "SAM
  Label          uppercase, +6%         13 / 16                       CHALLENGED YOU,"
                 tracking                                             "LOSER"

  Caption        Inter Medium           13 / 18                       Timestamps, fine print


Text respects the phone's text-size setting up to 200% without breaking layouts.


Layout, components and motion
    Spacing: 4 px base. Use 4, 8, 12, 16, 24, 32, 48. Screen side padding is 20 px.

    Radius: cards 16, buttons 14, sheets 24 on top corners, pills and avatars fully round.

    Touch targets: 44 × 44 px minimum; primary buttons are 56 px tall, full width, pinned to
    the bottom within thumb reach.
    One primary action per screen, in orange. Secondary is text only in muted .

    Depth comes from surfaces and borders, not shadows. No drop shadows in dark
    mode.


  Component          Spec

  Primary button      orange fill, on-accent text, Inter Bold 17; pressed state scales to 0.98


                     Avatar (orange or blue ring) + name + the call ("KC −3.5"), in that side's
  Side chip
                     color

  Live pill          "● LIVE · Q3 4:12," orange text on 14% orange; the dot pulses every 2 s

  Challenge          8 px bar, your share in orange, theirs in blue, animates on each score
  meter              update

  Score strip        Team abbreviation label over a Barlow score, clock in the middle

  Rivalry line       "You lead Jordan 4–3" in muted , tappable to the head-to-head history

  Bottom sheet       Create-challenge flow; surface , 24 px top radius, drag handle

  Toast              Bottom, 4 s, one action max ("Undo")


Motion: 150 ms for taps, 250 ms for sheets and screen changes, ease-out. Settle gets one
moment: "Called it." scales in with a short orange burst. Nothing loops except the live dot.
With the system's reduced-motion setting on, every animation becomes a plain fade.


Wordmark, icon and share cards
Wordmark direction: "Waygr" in Barlow Condensed ExtraBold Italic, tracking −1%, Waygr
Orange on ink, ink on orange. The Designer bot should draw a custom version: tighten the
"yg" pair and cut the descenders so they sit cleanly on one baseline.

App icon direction: an orange square with a heavy italic ink "W," nothing else. It has to read
at 29 px on a home screen. No gradients, no ball, no dice.

Share card (1080 × 1350):

    Ink background with the orange corner glow, top right.

    Top: final score as a label ("CHIEFS 27 · BILLS 20 · FINAL").

    Center: "CALLED IT." at about 260 px in orange, Barlow ExtraBold Italic.
   Winner avatar, name, and the call with its margin ("KC −3.5 · covered by 3.5").

   Divider, then the forfeit in the loser's name and the rivalry record in muted .

   Bottom: wordmark left, "Tap to rematch" right. 64 px safe margin all around.

The story version (1080 × 1920) stacks the same parts with more air. The link preview (1200
× 630) puts the call on the left and both avatars on the right.

The preview below ( waygr-brand-preview.png , attached) shows the palette, the accept
screen in both modes, the live screen and the result card. Treat it as direction, not a pixel
spec.
