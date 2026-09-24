-- Atomic settlement: challenge + forfeit + jersey + notifications in one transaction.
-- Also repairs settled challenges that are missing a forfeit (crash recovery).

CREATE OR REPLACE FUNCTION public.settle_challenge_atomic(
  p_challenge_id uuid,
  p_outcome outcome,
  p_settled_at timestamptz,
  p_owed_by uuid DEFAULT NULL,
  p_owed_to uuid DEFAULT NULL,
  p_forfeit_kind forfeit_kind DEFAULT NULL,
  p_jersey_team text DEFAULT NULL,
  p_jersey_until timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge challenges%ROWTYPE;
  v_due_at timestamptz;
  v_newly_settled boolean := false;
  v_repaired boolean := false;
  v_notifications int := 0;
  v_inserted int;
BEGIN
  UPDATE challenges
  SET state = 'settled', outcome = p_outcome, settled_at = p_settled_at
  WHERE id = p_challenge_id AND state IN ('accepted', 'live')
  RETURNING * INTO v_challenge;

  IF FOUND THEN
    v_newly_settled := true;
  ELSE
    SELECT * INTO v_challenge
    FROM challenges
    WHERE id = p_challenge_id AND state = 'settled';

    IF NOT FOUND THEN
      RETURN jsonb_build_object('settled', false, 'repaired', false, 'notifications', 0);
    END IF;

    IF v_challenge.outcome IS DISTINCT FROM p_outcome THEN
      RETURN jsonb_build_object('settled', false, 'repaired', false, 'notifications', 0);
    END IF;

    v_repaired := true;
  END IF;

  IF p_outcome <> 'push' AND p_owed_by IS NOT NULL AND p_owed_to IS NOT NULL AND p_forfeit_kind IS NOT NULL THEN
    v_due_at := p_settled_at + interval '7 days';

    INSERT INTO forfeits (challenge_id, owed_by, owed_to, kind, status, due_at, paid_at)
    VALUES (
      p_challenge_id,
      p_owed_by,
      p_owed_to,
      p_forfeit_kind,
      CASE WHEN p_forfeit_kind = 'jersey_swap' THEN 'paid'::forfeit_status ELSE 'owed'::forfeit_status END,
      v_due_at,
      CASE WHEN p_forfeit_kind = 'jersey_swap' THEN p_settled_at ELSE NULL END
    )
    ON CONFLICT (challenge_id) DO NOTHING;

    IF p_forfeit_kind = 'jersey_swap' AND p_jersey_team IS NOT NULL THEN
      UPDATE profiles
      SET jersey_team = p_jersey_team,
          jersey_until = COALESCE(p_jersey_until, v_due_at)
      WHERE id = p_owed_by;
    END IF;
  END IF;

  INSERT INTO notifications_sent (user_id, kind, ref_id)
  VALUES (v_challenge.creator_id, 'settled', p_challenge_id)
  ON CONFLICT (user_id, kind, ref_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted > 0 THEN
    v_notifications := v_notifications + 1;
  END IF;

  IF v_challenge.opponent_id IS NOT NULL THEN
    INSERT INTO notifications_sent (user_id, kind, ref_id)
    VALUES (v_challenge.opponent_id, 'settled', p_challenge_id)
    ON CONFLICT (user_id, kind, ref_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted > 0 THEN
      v_notifications := v_notifications + 1;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'settled', v_newly_settled OR v_repaired,
    'repaired', v_repaired AND NOT v_newly_settled,
    'notifications', v_notifications
  );
END;
$$;

REVOKE ALL ON FUNCTION public.settle_challenge_atomic(uuid, outcome, timestamptz, uuid, uuid, forfeit_kind, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_challenge_atomic(uuid, outcome, timestamptz, uuid, uuid, forfeit_kind, text, timestamptz) TO service_role;
