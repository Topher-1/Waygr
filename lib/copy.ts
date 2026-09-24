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
    lagging: "Score's lagging. Retrying.",
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
  },

  auth: {
    signInTitle: "Sign in",
    signUpTitle: "Create account",
    signIn: "Sign in",
    signUp: "Create account",
    needAccount: "Need an account? Sign up",
    haveAccount: "Already have an account? Sign in",
    termsNote: "By continuing you agree to our Terms and Privacy Policy.",
    adultCheckbox: "I'm 18 or older",
    demoNote: "Demo preview — no account needed. Accept is disabled.",
  },

  screening: {
    rejected: "Keep it legal and sober. Try a jersey or a public apology.",
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
