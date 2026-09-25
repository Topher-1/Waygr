/**
 * Every user-facing string in the app lives here.
 * @see docs/BRAND-BRIEF.md
 */
import { APP_NAME } from "@/lib/constants";

export const copy = {
  appName: APP_NAME,

  challenge: {
    preview: (name: string, call: string, forfeit: string) =>
      `${name} says ${call}. Loser ${forfeit}. You in?`,
    previewForfeit: (forfeit: string) => `Loser ${forfeit}. You in?`,
    challengedYou: (name: string) => `${name} challenged you`,
    accept: "I'm in",
    accepting: "Working…",
    decline: "Not this one",
    waitingStatus: "Waiting on someone",
    waitingHint: "Share the link — someone takes the other side.",
    waitingYourCall: (call: string) => `You say ${call}.`,
    waitingStakes: (forfeit: string) => `Loser ${forfeit}.`,
    accepted: "You're on.",
    tooSlow: (name: string) => `Too slow. ${name} took it.`,
    makeYourOwn: "Make your own call",
  },

  live: {
    youUp: "You're up.",
    theyUp: (name: string) => `${name}'s up.`,
    tied: "Dead even.",
    backHome: "Back home",
    lagging: "Score's lagging. Retrying.",
    trashTitle: "Trash talk",
    trashEmpty: "Say something.",
    trashDemoEmpty: "Messages show up here in a live challenge.",
    trashPlaceholder: "Talk trash…",
    trashSend: "Send",
    trashSending: "Sending…",
    trashSendError: "Could not send. Try again.",
  },

  result: {
    win: "Called it.",
    loss: "Not your night. Rematch?",
    push: "Push. Nobody owes.",
    void: "Game's off. Challenge voided.",
    rematch: "Tap to rematch",
    rematching: "Working…",
    share: "Share the card",
    sharing: "Opening share sheet…",
    shared: "Card's out.",
  },

  forfeit: {
    owed: (name: string) => `You owe ${name} one.`,
    paid: "Paid in full.",
    title: "The line",
    settleAction: "Settle the line",
    viewStatus: "Check forfeit",
    markDone: "Mark as done",
    markingDone: "Marking…",
    owedBy: (name: string) => `${name} owes you one.`,
    dueBy: (when: string) => `Due ${when}`,
    honorNote: "Honor system — settle up outside the app.",
    shareConcession: "Share concession card",
    shareStory: "Share to story",
    downloadCard: "Download card",
    sharing: "Opening share sheet…",
    shareFailed: "Share didn't finish. Try again.",
    markedDone: "Marked done. Waiting on them to confirm.",
    uploadProof: "Upload proof",
    uploadingProof: "Uploading…",
    proofHint: "Photo or clip, 30 seconds max.",
    proofTooBig: "That file's too big. 50 MB max.",
    proofWrongType: "Photos and short clips only.",
    proofFailed: "Upload didn't finish. Try again.",
    proofSubmitted: "Proof's in. Waiting on them.",
    proofWaiting: (name: string) => `Waiting on ${name} to confirm.`,
    proofAutoConfirm: (hours: number) =>
      `Auto-confirms in ${hours} h if they don't look.`,
    proofReview: "Confirm the forfeit",
    confirmProof: "Looks good",
    confirmingProof: "Confirming…",
    rejectProof: "Not good enough",
    rejectingProof: "Sending back…",
    proofRejected: "They sent it back. Try again.",
    proofConfirmed: "Confirmed. Square again.",
    honorMarkReview: (name: string) => `${name} says it's done.`,
    jerseyActive: (team: string, days: number) =>
      `${team} colors for ${days} more ${days === 1 ? "day" : "days"}.`,
    jerseyDone: "Jersey time's up.",
    alreadyPaid: "Already square.",
    noneOwed: "Nothing owed here.",
    notYours: "That forfeit isn't yours.",
  },

  cards: {
    calledHeadline: "Called it.",
    concessionHeadline: (winner: string) => `${winner} called it.`,
    proofHeadline: "Paid up.",
    owesLine: (loser: string, winner: string, forfeit: string) =>
      `${loser} owes ${winner}: ${forfeit}`,
    paidLine: (loser: string, winner: string, forfeit: string) =>
      `${loser} paid ${winner}: ${forfeit}`,
    rivalryLead: (leader: string, trailer: string, wins: number, losses: number) =>
      `${leader} leads ${trailer} ${wins}–${losses}`,
    rivalryEven: (a: string, b: string, wins: number) =>
      `${a} and ${b} are even ${wins}–${wins}`,
    footer: "Tap to rematch",
    final: "Final",
    live: "Live",
  },

  profile: {
    record: "Record",
    recordValue: (wins: number, losses: number, pushes: number) =>
      `${wins}-${losses}-${pushes}`,
    paidRate: "Forfeit paid rate",
    owes: (count: number) => `Owes ${count}`,
    owesNone: "Owes nothing",
    topRivalries: "Top rivalries",
    noRivalries: "No settled waygrs yet.",
    viewRivalry: "See the record",
    notFound: "No one by that handle.",
    jerseyFrame: (team: string) => `Wearing ${team} colors`,
    settledHistory: "Recent waygrs",
    noSettledHistory: "No settled waygrs yet.",
  },

  rivalryPage: {
    title: (name: string) => `You vs ${name}`,
    record: (wins: number, losses: number, pushes: number) =>
      `${wins}-${losses}-${pushes}`,
    even: "Dead even.",
    history: "Every waygr",
    empty: "Nothing settled between you two yet.",
    signInNote: "Sign in to see your head-to-head.",
    youWon: "You called it",
    theyWon: "They called it",
    pushed: "Push",
  },

  rivalry: {
    line: (youLead: boolean, name: string, wins: number, losses: number) =>
      youLead
        ? `You lead ${name} ${wins}–${losses}`
        : `${name} leads you ${wins}–${losses}`,
    nudge: (name: string, wins: number, losses: number, game: string) =>
      `${name} leads you ${wins}–${losses}. ${game} play Sunday.`,
  },

  home: {
    empty: (game: string) => `No waygrs yet. ${game}. Make one.`,
    makeCall: "Make a call",
    viewProfile: "Profile & record",
    live: "Live now",
    owed: "You owe",
    waiting: "Waiting on someone",
    settled: "Recent waygrs",
    tonight: "Tonight",
    tomorrow: "Tomorrow",
    quickCall: "One-tap call",
    howItWorksTitle: "How it works",
    howItWorksSteps: [
      "Pick a game and your call.",
      "Share the link — friend takes the other side.",
      "Winner calls it. Loser pays the forfeit.",
    ] as const,
    browseSlate: "Browse tonight's slate",
    cancelCall: "Cancel call",
    cancelCallTitle: "Cancel this call?",
    cancelCallBody:
      "Your share link will stop working — nobody else can accept.",
    cancelCallConfirm: "Yes, cancel call",
    cancelCallKeep: "Keep waiting",
    cancelCallWorking: "Canceling…",
    cancelCallError: "Could not cancel. Try again.",
  },

  create: {
    pickGame: "Pick a game",
    pickMarket: "What's the call?",
    pickSide: "Your side",
    pickLine: "Set the line",
    pickForfeit: "What's on the line?",
    preview: "Your call",
    next: "Next",
    share: "Share challenge",
    sharing: "Opening share…",
    copying: "Copying…",
    creating: "Creating…",
    linkCopied: "Link copied",
    markets: {
      spread: "Spread",
      winner: "Winner",
      total: "Total",
      half_leader: "Halftime lead",
      quarter_winner: "Quarter winner",
    },
    forfeits: {
      concession: "Concession card",
      jersey_swap: "Jersey swap",
      custom: "Custom",
    },
    honorNote: "Honor system — settle up outside the app.",
    customPlaceholder: "What does the loser owe?",
    customMoneyLabel: "Custom $",
    customMoneyPlaceholder: "Custom amount (e.g. $15)",
    cancelChallenge: "Cancel call",
  },

  auth: {
    signInTitle: "Sign in",
    signUpTitle: "Create account",
    signIn: "Sign in",
    signingIn: "Signing in…",
    signUp: "Create account",
    signingUp: "Creating account…",
    working: "Working…",
    needAccount: "Need an account? Sign up",
    haveAccount: "Already have an account? Sign in",
    termsNote: "By continuing you agree to our Terms and Privacy Policy.",
    adultCheckbox: "I'm 21 or older",
    adultConfirmError: "Confirm you are 21 or older to continue.",
    adultStepTitle: "One more thing",
    adultPendingHint:
      "Confirm you're 21+ to use Waygr, or sign out and come back later.",
    adultAbandonMessage:
      "You're signed in but still need to confirm you're 21+. Sign in to pick up where you left off.",
    alreadyRegistered:
      "You already have an account. Sign in to finish setup.",
    signOut: "Sign out",
    demoNote: "Demo preview — no account needed. Accept is disabled.",
  },

  screening: {
    rejected:
      "Payment links and in-app transfers aren't supported. Pick a preset or describe what the loser owes — settle up outside the app.",
  },
} as const;

/** Flatten nested copy object into all string values for linting/tests. */
export function allCopyStrings(
  obj: Record<string, unknown> = copy,
): string[] {
  const strings: string[] = [];
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      strings.push(value);
    } else if (typeof value === "function") {
      continue;
    } else if (value && typeof value === "object") {
      strings.push(...allCopyStrings(value as Record<string, unknown>));
    }
  }
  return strings;
}
