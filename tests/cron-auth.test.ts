import { describe, expect, it } from 'vitest';
import { assertCronSecret } from '@/lib/jobs/cron-auth';

function req(secret: string | null): Request {
  const headers = new Headers();
  if (secret !== null) headers.set('x-cron-secret', secret);
  return new Request('https://example.com/functions/v1/poll-scores', { headers });
}

describe('assertCronSecret', () => {
  it('rejects when CRON_SECRET is not configured', () => {
    expect(() =>
      assertCronSecret(req('anything'), { get: () => undefined }),
    ).toThrow('CRON_SECRET is not configured');
  });

  it('rejects when header is missing or wrong', () => {
    const env = { get: (k: string) => (k === 'CRON_SECRET' ? 'expected' : undefined) };
    expect(() => assertCronSecret(req(null), env)).toThrow('Unauthorized');
    expect(() => assertCronSecret(req('wrong'), env)).toThrow('Unauthorized');
  });

  it('allows matching secret', () => {
    const env = { get: (k: string) => (k === 'CRON_SECRET' ? 'expected' : undefined) };
    expect(() => assertCronSecret(req('expected'), env)).not.toThrow();
  });
});
