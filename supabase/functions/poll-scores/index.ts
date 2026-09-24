/**
 * Edge Function stub — Step 2 implements ScoreProvider polling.
 * @see docs/BUILD-BRIEF.md · poll-scores
 */
Deno.serve(async () => {
  return new Response(JSON.stringify({ ok: true, stub: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
