/** Map Supabase auth errors to user-facing guidance. */
export function mapAuthError(message: string): {
  text: string;
  suggestSignIn: boolean;
} {
  if (/already registered/i.test(message)) {
    return { text: "already_registered", suggestSignIn: true };
  }
  return { text: message, suggestSignIn: false };
}
