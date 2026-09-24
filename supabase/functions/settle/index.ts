/**
 * Edge Function stub — Step 2 implements transactional settlement.
 * @see docs/BUILD-BRIEF.md · settle job
 */
Deno.serve(async () => {
  return new Response(JSON.stringify({ ok: true, stub: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
