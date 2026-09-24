-- Row-level security (BUILD-BRIEF · architecture.md)
-- Keys off profiles.auth_user_id = auth.uid()

-- Helper: current user's profile id
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Helper: is the current user a participant in this challenge?
CREATE OR REPLACE FUNCTION public.is_challenge_participant(challenge_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM challenges c
    WHERE c.id = challenge_id
      AND (
        c.creator_id = public.current_profile_id()
        OR c.opponent_id = public.current_profile_id()
      )
  );
$$;

REVOKE ALL ON FUNCTION public.current_profile_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated;

REVOKE ALL ON FUNCTION public.is_challenge_participant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_challenge_participant(uuid) TO authenticated;

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Public read of display fields for avatars/handles on challenge pages uses service role.

-- teams (read-only for authenticated users)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select_all"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

-- games: service role only for writes; authenticated can read games tied to their challenges
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select_participant"
  ON games FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.game_id = games.id
        AND (
          c.creator_id = public.current_profile_id()
          OR c.opponent_id = public.current_profile_id()
        )
    )
  );

-- challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_select_participant"
  ON challenges FOR SELECT
  TO authenticated
  USING (
    creator_id = public.current_profile_id()
    OR opponent_id = public.current_profile_id()
  );

CREATE POLICY "challenges_insert_creator"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = public.current_profile_id());

CREATE POLICY "challenges_cancel_creator"
  ON challenges FOR UPDATE
  TO authenticated
  USING (
    creator_id = public.current_profile_id()
    AND state = 'open'
  )
  WITH CHECK (
    creator_id = public.current_profile_id()
    AND state = 'canceled'
  );

-- Authenticated creators may only cancel (open → canceled). All other column writes
-- and post-accept state transitions are service role only.
CREATE OR REPLACE FUNCTION public.challenges_guard_authenticated_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF OLD.state <> 'open' OR NEW.state <> 'canceled' THEN
      RAISE EXCEPTION 'authenticated users may only cancel open challenges';
    END IF;
    IF NEW.creator_id <> OLD.creator_id
      OR NEW.opponent_id IS DISTINCT FROM OLD.opponent_id
      OR NEW.game_id <> OLD.game_id
      OR NEW.market <> OLD.market
      OR NEW.creator_pick <> OLD.creator_pick
      OR NEW.line IS DISTINCT FROM OLD.line
      OR NEW.quarter IS DISTINCT FROM OLD.quarter
      OR NEW.forfeit_kind <> OLD.forfeit_kind
      OR NEW.forfeit_text IS DISTINCT FROM OLD.forfeit_text
      OR NEW.outcome IS DISTINCT FROM OLD.outcome
      OR NEW.rematch_of IS DISTINCT FROM OLD.rematch_of
      OR NEW.accepted_at IS DISTINCT FROM OLD.accepted_at
      OR NEW.settled_at IS DISTINCT FROM OLD.settled_at
      OR NEW.slug <> OLD.slug
      OR NEW.created_at <> OLD.created_at
    THEN
      RAISE EXCEPTION 'authenticated users may only change state to canceled';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.challenges_guard_authenticated_update() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.challenges_guard_authenticated_update() TO authenticated;

CREATE TRIGGER challenges_guard_authenticated_update
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.challenges_guard_authenticated_update();

-- Post-accept state transitions (accepted, live, settled, void, expired) are service role only.

-- forfeits: readable by owed parties; writes service role only
ALTER TABLE forfeits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forfeits_select_participant"
  ON forfeits FOR SELECT
  TO authenticated
  USING (
    owed_by = public.current_profile_id()
    OR owed_to = public.current_profile_id()
  );

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  TO authenticated
  USING (public.is_challenge_participant(challenge_id));

CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = public.current_profile_id()
    AND public.is_challenge_participant(challenge_id)
    AND EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = challenge_id
        AND (
          c.state IN ('accepted', 'live')
          OR (
            c.state = 'settled'
            AND c.settled_at IS NOT NULL
            AND now() < c.settled_at + interval '24 hours'
          )
        )
    )
  );

-- push_subscriptions: own rows only
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select_own"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = public.current_profile_id());

CREATE POLICY "push_subscriptions_insert_own"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_profile_id());

CREATE POLICY "push_subscriptions_delete_own"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = public.current_profile_id());

-- notifications_sent: own rows only (read)
ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_sent_select_own"
  ON notifications_sent FOR SELECT
  TO authenticated
  USING (user_id = public.current_profile_id());

-- blocks: blocker manages their blocks
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_select_own"
  ON blocks FOR SELECT
  TO authenticated
  USING (blocker_id = public.current_profile_id());

CREATE POLICY "blocks_insert_own"
  ON blocks FOR INSERT
  TO authenticated
  WITH CHECK (blocker_id = public.current_profile_id());

CREATE POLICY "blocks_delete_own"
  ON blocks FOR DELETE
  TO authenticated
  USING (blocker_id = public.current_profile_id());

-- reports: reporter can file
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert_own"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = public.current_profile_id());

-- rivalries view inherits underlying challenge visibility via security barrier pattern
-- Expose only rows where current user is user_a or user_b
CREATE OR REPLACE VIEW public.rivalries_secure AS
SELECT * FROM rivalries
WHERE user_a = public.current_profile_id()
   OR user_b = public.current_profile_id();

REVOKE ALL ON rivalries FROM authenticated;
GRANT SELECT ON rivalries_secure TO authenticated;
