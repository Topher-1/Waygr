import { assertCronSecret as assertCronSecretBase } from '../../../lib/jobs/cron-auth.ts';

export function assertCronSecret(req: Request): void {
  assertCronSecretBase(req, {
    get: (key) => Deno.env.get(key),
  });
}
