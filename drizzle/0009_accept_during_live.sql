-- Dogfood: allow accept while game is scheduled or live (not merely before kickoff).

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
  v_game_status game_status;
BEGIN
  IF p_opponent_id IS NULL THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'missing_opponent');
  END IF;

  UPDATE challenges
  SET
    state = 'accepted',
    opponent_id = p_opponent_id,
    accepted_at = p_accepted_at
  FROM games g
  WHERE challenges.id = p_challenge_id
    AND challenges.game_id = g.id
    AND challenges.state = 'open'
    AND challenges.creator_id <> p_opponent_id
    AND challenges.opponent_id IS NULL
    AND g.status IN ('scheduled', 'live')
  RETURNING challenges.* INTO v_challenge;

  IF NOT FOUND THEN
    SELECT c.*, g.status
    INTO v_challenge, v_game_status
    FROM challenges c
    JOIN games g ON g.id = c.game_id
    WHERE c.id = p_challenge_id;

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

    IF v_game_status NOT IN ('scheduled', 'live') THEN
      RETURN jsonb_build_object('accepted', false, 'reason', 'game_over');
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
