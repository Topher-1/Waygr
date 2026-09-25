-- Slice 6: forfeits, result cards, Profile, Rivalry.
-- Additive only. Cites BUILD-BRIEF · Data model (forfeit_kind, forfeit_status,
-- profiles.jersey_team / jersey_until) and BUILD · Storage (private `proof` bucket).

-- A rejected proof goes back to 'owed'; this records that it happened so the
-- loser sees why and the 72 h auto-confirm clock does not resume.
ALTER TABLE forfeits
  ADD COLUMN IF NOT EXISTS proof_rejected_at timestamptz;

-- Profile "Owes N" + forfeit paid rate, and the Home owed-forfeits list.
CREATE INDEX IF NOT EXISTS forfeits_owed_by_status_idx
  ON forfeits (owed_by, status);
CREATE INDEX IF NOT EXISTS forfeits_owed_to_status_idx
  ON forfeits (owed_to, status);

-- Rivalry history and profile record: settled challenges by either side.
CREATE INDEX IF NOT EXISTS challenges_settled_creator_idx
  ON challenges (creator_id, state, settled_at DESC);
CREATE INDEX IF NOT EXISTS challenges_settled_opponent_idx
  ON challenges (opponent_id, state, settled_at DESC);

-- Jersey frames end on a schedule (Edge `sweep`), so the sweep needs this.
CREATE INDEX IF NOT EXISTS profiles_jersey_until_idx
  ON profiles (jersey_until)
  WHERE jersey_until IS NOT NULL;

-- Handle lookups for /u/[handle] and /r/[handle] already ride the unique index
-- on profiles.handle.

-- Private proof bucket: images and short clips, 50 MB max (BUILD · Storage).
-- storage.objects keeps row-level security on with no policies for this bucket,
-- so only the service role (API routes, Edge Functions) reads or writes it and
-- the app hands out 1-hour signed URLs.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'proof',
      'proof',
      false,
      52428800,
      ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'video/mp4',
        'video/quicktime',
        'video/webm'
      ]
    )
    ON CONFLICT (id) DO UPDATE
      SET public = false,
          file_size_limit = 52428800,
          allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END
$$;
