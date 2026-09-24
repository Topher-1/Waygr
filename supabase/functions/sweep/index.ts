/**
 * Edge Function stub — Step 2 implements expire / void / proof / jersey sweep.
 * @see docs/BUILD-BRIEF.md · sweep job
 */
Deno.serve(async () => {
  return new Response(JSON.stringify({ ok: true, stub: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
