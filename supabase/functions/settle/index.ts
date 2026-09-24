import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { settleGames } from '../../../lib/jobs/settle.ts';
import { SupabaseJobStore } from '../../../lib/jobs/supabase-store.ts';
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

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const store = new SupabaseJobStore(supabase);

    let gameIds: string[] = body.gameIds ?? [];
    if (gameIds.length === 0) {
      const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('games')
        .select('id')
        .gte('updated_at', since);
      if (error) throw error;
      gameIds = (data ?? []).map((r) => r.id);
    }

    const result = await settleGames(store, gameIds);

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
