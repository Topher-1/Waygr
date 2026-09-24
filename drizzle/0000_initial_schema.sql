-- Waygr initial schema (BUILD-BRIEF data model)
CREATE TYPE "public"."league" AS ENUM('nfl', 'ncaaf', 'nba', 'ncaab');
CREATE TYPE "public"."game_status" AS ENUM('scheduled', 'live', 'final', 'postponed', 'suspended', 'canceled');
CREATE TYPE "public"."market" AS ENUM('winner', 'spread', 'total', 'half_leader', 'quarter_winner');
CREATE TYPE "public"."pick" AS ENUM('home', 'away', 'over', 'under');
CREATE TYPE "public"."challenge_state" AS ENUM('open', 'accepted', 'live', 'settled', 'void', 'expired', 'canceled');
CREATE TYPE "public"."outcome" AS ENUM('creator', 'opponent', 'push');
CREATE TYPE "public"."forfeit_kind" AS ENUM('concession', 'jersey_swap', 'custom');
CREATE TYPE "public"."forfeit_status" AS ENUM('owed', 'proof_submitted', 'paid');

CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "auth_user_id" uuid UNIQUE,
  "handle" text UNIQUE NOT NULL,
  "display_name" text NOT NULL,
  "avatar_url" text,
  "adult_confirmed_at" timestamptz,
  "referred_by" uuid,
  "jersey_team" text,
  "jersey_until" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "deleted_at" timestamptz,
  CONSTRAINT "profiles_auth_user_id_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "profiles_referred_by_profiles_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "teams" (
  "code" text PRIMARY KEY NOT NULL,
  "league" "league" NOT NULL,
  "abbr" text NOT NULL,
  "name" text NOT NULL,
  "primary_color" text NOT NULL,
  "secondary_color" text NOT NULL
);

CREATE TABLE "games" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" text NOT NULL,
  "provider_game_id" text NOT NULL,
  "league" "league" NOT NULL,
  "home_team" text NOT NULL,
  "away_team" text NOT NULL,
  "starts_at" timestamptz NOT NULL,
  "status" "game_status" DEFAULT 'scheduled' NOT NULL,
  "period" integer,
  "clock" text,
  "home_score" integer DEFAULT 0 NOT NULL,
  "away_score" integer DEFAULT 0 NOT NULL,
  "period_scores" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "games_home_team_teams_code_fk" FOREIGN KEY ("home_team") REFERENCES "public"."teams"("code") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "games_away_team_teams_code_fk" FOREIGN KEY ("away_team") REFERENCES "public"."teams"("code") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "games_provider_provider_game_id_unique" UNIQUE("provider","provider_game_id")
);

CREATE TABLE "challenges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "creator_id" uuid NOT NULL,
  "opponent_id" uuid,
  "game_id" uuid NOT NULL,
  "market" "market" NOT NULL,
  "creator_pick" "pick" NOT NULL,
  "line" numeric(5, 1),
  "quarter" integer,
  "forfeit_kind" "forfeit_kind" NOT NULL,
  "forfeit_text" text,
  "state" "challenge_state" DEFAULT 'open' NOT NULL,
  "outcome" "outcome",
  "rematch_of" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "accepted_at" timestamptz,
  "settled_at" timestamptz,
  CONSTRAINT "challenges_creator_id_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "challenges_opponent_id_profiles_id_fk" FOREIGN KEY ("opponent_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "challenges_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "challenges_rematch_of_challenges_id_fk" FOREIGN KEY ("rematch_of") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "challenges_quarter_check" CHECK ("quarter" is null or ("quarter" between 1 and 4)),
  CONSTRAINT "challenges_opponent_check" CHECK ("opponent_id" is null or "opponent_id" <> "creator_id")
);

CREATE INDEX "challenges_game_id_state_idx" ON "challenges" USING btree ("game_id","state");

CREATE TABLE "forfeits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "challenge_id" uuid UNIQUE NOT NULL,
  "owed_by" uuid NOT NULL,
  "owed_to" uuid NOT NULL,
  "kind" "forfeit_kind" NOT NULL,
  "status" "forfeit_status" DEFAULT 'owed' NOT NULL,
  "proof_path" text,
  "due_at" timestamptz NOT NULL,
  "paid_at" timestamptz,
  CONSTRAINT "forfeits_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "forfeits_owed_by_profiles_id_fk" FOREIGN KEY ("owed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "forfeits_owed_to_profiles_id_fk" FOREIGN KEY ("owed_to") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "messages" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "challenge_id" uuid NOT NULL,
  "author_id" uuid NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "messages_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "messages_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "messages_body_check" CHECK (char_length("body") <= 280)
);

CREATE TABLE "push_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "endpoint" text UNIQUE NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "push_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE "notifications_sent" (
  "user_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "ref_id" uuid NOT NULL,
  "sent_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "notifications_sent_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "notifications_sent_user_id_kind_ref_id_pk" PRIMARY KEY("user_id","kind","ref_id")
);

CREATE TABLE "blocks" (
  "blocker_id" uuid,
  "blocked_id" uuid,
  CONSTRAINT "blocks_blocker_id_profiles_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "blocks_blocked_id_profiles_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "blocks_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id")
);

CREATE TABLE "reports" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "reporter_id" uuid NOT NULL,
  "challenge_id" uuid,
  "message_id" bigint,
  "reason" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "reports_reporter_id_profiles_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "reports_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "reports_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action
);

CREATE VIEW "rivalries" AS
SELECT
  least(creator_id, opponent_id) AS user_a,
  greatest(creator_id, opponent_id) AS user_b,
  count(*) FILTER (
    WHERE (outcome = 'creator' AND creator_id < opponent_id)
       OR (outcome = 'opponent' AND opponent_id < creator_id)
  ) AS wins_a,
  count(*) FILTER (
    WHERE (outcome = 'creator' AND creator_id > opponent_id)
       OR (outcome = 'opponent' AND opponent_id > creator_id)
  ) AS wins_b,
  count(*) FILTER (WHERE outcome = 'push') AS pushes,
  max(settled_at) AS last_settled_at
FROM challenges
WHERE state = 'settled'
GROUP BY 1, 2;
