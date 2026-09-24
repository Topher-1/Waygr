-- Step 2: cron job metadata + proof auto-confirm timestamp
CREATE TABLE IF NOT EXISTS job_meta (
  key text PRIMARY KEY,
  value timestamptz NOT NULL
);

ALTER TABLE forfeits
  ADD COLUMN IF NOT EXISTS proof_submitted_at timestamptz;

-- Service role only (Edge Functions)
ALTER TABLE job_meta ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE job_meta FROM anon, authenticated;
