import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { runSweep } from '../../../lib/jobs/sweep.ts';
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

    const store = new SupabaseJobStore(supabase);
    const result = await runSweep(store);

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
