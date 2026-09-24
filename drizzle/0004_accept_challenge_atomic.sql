-- Atomic challenge accept: one conditional update + optional referred_by (BUILD-BRIEF).
-- Exactly one opponent wins when two people tap at once.

CREATE OR REPLACE FUNCTION public.accept_challenge_atomic(
  p_challenge_id uuid,
  p_opponent_id uuid,
  p_accepted_at timestamptz,
  p_referred_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge challenges%ROWTYPE;
  v_kickoff timestamptz;
BEGIN
  IF p_opponent_id IS NULL THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'missing_opponent');
  END IF;

  SELECT g.starts_at INTO v_kickoff
  FROM challenges c
  JOIN games g ON g.id = c.game_id
  WHERE c.id = p_challenge_id;

  IF v_kickoff IS NULL THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'not_found');
  END IF;

  IF v_kickoff <= now() THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'past_kickoff');
  END IF;

  UPDATE challenges
  SET
    state = 'accepted',
    opponent_id = p_opponent_id,
    accepted_at = p_accepted_at
  WHERE id = p_challenge_id
    AND state = 'open'
    AND creator_id <> p_opponent_id
    AND opponent_id IS NULL
  RETURNING * INTO v_challenge;

  IF NOT FOUND THEN
    SELECT * INTO v_challenge FROM challenges WHERE id = p_challenge_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('accepted', false, 'reason', 'not_found');
    END IF;
    IF v_challenge.creator_id = p_opponent_id THEN
      RETURN jsonb_build_object('accepted', false, 'reason', 'own_challenge');
    END IF;
    IF v_challenge.opponent_id IS NOT NULL AND v_challenge.opponent_id <> p_opponent_id THEN
      RETURN jsonb_build_object('accepted', false, 'reason', 'taken');
    END IF;
    IF v_challenge.state <> 'open' THEN
      RETURN jsonb_build_object('accepted', false, 'reason', 'not_open');
    END IF;
    RETURN jsonb_build_object('accepted', false, 'reason', 'conflict');
  END IF;

  IF p_referred_by IS NOT NULL THEN
    UPDATE profiles
    SET referred_by = p_referred_by
    WHERE id = p_opponent_id
      AND referred_by IS NULL;
  END IF;

  RETURN jsonb_build_object(
    'accepted', true,
    'challenge_id', v_challenge.id,
    'opponent_id', v_challenge.opponent_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_challenge_atomic(uuid, uuid, timestamptz, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_challenge_atomic(uuid, uuid, timestamptz, uuid) TO service_role;
