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
    accept: "I'm in",
    decline: "Not this one",
    accepted: "You're on.",
    tooSlow: (name: string) => `Too slow. ${name} took it.`,
    makeYourOwn: "Make your own call",
  },

  live: {
    youUp: "You're up.",
    theyUp: (name: string) => `${name}'s up.`,
    tied: "Dead even.",
    lagging: "Score's lagging. Retrying.",
    trashTitle: "Trash talk",
    trashEmpty: "Say something.",
    trashDemoEmpty: "Messages show up here in a live challenge.",
    trashPlaceholder: "Talk trash…",
    trashSend: "Send",
    trashSendError: "Could not send. Try again.",
  },

  result: {
    win: "Called it.",
    loss: "Not your night. Rematch?",
    push: "Push. Nobody owes.",
    void: "Game's off. Challenge voided.",
    rematch: "Tap to rematch",
  },

  forfeit: {
    owed: (name: string) => `You owe ${name} one.`,
    paid: "Paid in full.",
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
    empty: (game: string) => `No calls yet. ${game}. Make one.`,
    makeCall: "Make a call",
    live: "Live now",
    owed: "You owe",
    waiting: "Waiting on someone",
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
    cancelChallenge: "Cancel challenge",
  },

  auth: {
    signInTitle: "Sign in",
    signUpTitle: "Create account",
    signIn: "Sign in",
    signUp: "Create account",
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
      // Template functions — check their literal return patterns via source scan in tests
      continue;
    } else if (value && typeof value === "object") {
      strings.push(...allCopyStrings(value as Record<string, unknown>));
    }
  }
  return strings;
}
