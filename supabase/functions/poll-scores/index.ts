import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { runPollScores } from '../../../lib/jobs/poll-scores.ts';
import { SupabaseJobStore } from '../../../lib/jobs/supabase-store.ts';
import { createScoreProvider } from '../../../lib/scores/index.ts';
import { assertCronSecret } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    assertCronSecret(req);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const store = new SupabaseJobStore(supabase);
    const provider = createScoreProvider({
      provider: Deno.env.get('SCORE_PROVIDER') ?? 'balldontlie',
      apiKey: Deno.env.get('BALLDONTLIE_API_KEY'),
    });

    const result = await runPollScores(store, provider);

    if (result.updatedGameIds.length > 0) {
      const settleUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/settle`;
      await fetch(settleUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
          ...(Deno.env.get('CRON_SECRET')
            ? { 'x-cron-secret': Deno.env.get('CRON_SECRET')! }
            : {}),
        },
        body: JSON.stringify({ gameIds: result.updatedGameIds }),
      });
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
