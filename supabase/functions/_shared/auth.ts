export function assertCronSecret(req: Request): void {
  const expected = Deno.env.get('CRON_SECRET');
  if (!expected) return;
  const provided = req.headers.get('x-cron-secret');
  if (provided !== expected) {
    throw new Error('Unauthorized');
  }
}
