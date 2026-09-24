type EnvReader = { get(key: string): string | undefined };

const nodeEnv: EnvReader = {
  get(key: string) {
    return process.env[key];
  },
};

/** Fail-closed cron auth for Edge Functions. CRON_SECRET must be set in every environment. */
export function assertCronSecret(req: Request, env: EnvReader = nodeEnv): void {
  const expected = env.get('CRON_SECRET');
  if (!expected) {
    throw new Error('CRON_SECRET is not configured');
  }
  const provided = req.headers.get('x-cron-secret');
  if (provided !== expected) {
    throw new Error('Unauthorized');
  }
}
