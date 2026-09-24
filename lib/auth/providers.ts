/** Apple Sign-In requires a paid Apple Developer account — stub until configured. */
export const APPLE_SIGN_IN_ENABLED =
  process.env.NEXT_PUBLIC_APPLE_SIGN_IN_ENABLED === "true";

export const AUTH_REDIRECT_PATH = "/auth/callback";

export function authCallbackUrl(next?: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = new URL(AUTH_REDIRECT_PATH, base);
  if (next) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}
