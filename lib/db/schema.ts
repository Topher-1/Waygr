import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers } from "@/lib/db/auth";

export const leagueEnum = pgEnum("league", ["nfl", "ncaaf", "nba", "ncaab"]);
export const gameStatusEnum = pgEnum("game_status", [
  "scheduled",
  "live",
  "final",
  "postponed",
  "suspended",
  "canceled",
]);
export const marketEnum = pgEnum("market", [
  "winner",
  "spread",
  "total",
  "half_leader",
  "quarter_winner",
]);
export const pickEnum = pgEnum("pick", ["home", "away", "over", "under"]);
export const challengeStateEnum = pgEnum("challenge_state", [
  "open",
  "accepted",
  "live",
  "settled",
  "void",
  "expired",
  "canceled",
]);
export const outcomeEnum = pgEnum("outcome", ["creator", "opponent", "push"]);
export const forfeitKindEnum = pgEnum("forfeit_kind", [
  "concession",
  "jersey_swap",
  "custom",
]);
export const forfeitStatusEnum = pgEnum("forfeit_status", [
  "owed",
  "proof_submitted",
  "paid",
]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authUserId: uuid("auth_user_id")
      .unique()
      .references(() => authUsers.id, { onDelete: "set null" }),
    handle: text("handle").unique().notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    adultConfirmedAt: timestamp("adult_confirmed_at", { withTimezone: true }),
    referredBy: uuid("referred_by"),
    jerseyTeam: text("jersey_team"),
    jerseyUntil: timestamp("jersey_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "profiles_referred_by_profiles_id_fk",
      columns: [table.referredBy],
      foreignColumns: [table.id],
    }),
  ],
);

export const teams = pgTable("teams", {
  code: text("code").primaryKey(),
  league: leagueEnum("league").notNull(),
  abbr: text("abbr").notNull(),
  name: text("name").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
});

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    providerGameId: text("provider_game_id").notNull(),
    league: leagueEnum("league").notNull(),
    homeTeam: text("home_team")
      .notNull()
      .references(() => teams.code),
    awayTeam: text("away_team")
      .notNull()
      .references(() => teams.code),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    status: gameStatusEnum("status").notNull().default("scheduled"),
    period: integer("period"),
    clock: text("clock"),
    homeScore: integer("home_score").notNull().default(0),
    awayScore: integer("away_score").notNull().default(0),
    periodScores: jsonb("period_scores").notNull().default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.provider, t.providerGameId)],
);

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").unique().notNull(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => profiles.id),
    opponentId: uuid("opponent_id").references(() => profiles.id),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),
    market: marketEnum("market").notNull(),
    creatorPick: pickEnum("creator_pick").notNull(),
    line: numeric("line", { precision: 5, scale: 1 }),
    quarter: integer("quarter"),
    forfeitKind: forfeitKindEnum("forfeit_kind").notNull(),
    forfeitText: text("forfeit_text"),
    state: challengeStateEnum("state").notNull().default("open"),
    outcome: outcomeEnum("outcome"),
    rematchOf: uuid("rematch_of"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    settledAt: timestamp("settled_at", { withTimezone: true }),
  },
  (t) => [
    index("challenges_game_id_state_idx").on(t.gameId, t.state),
    foreignKey({
      name: "challenges_rematch_of_challenges_id_fk",
      columns: [t.rematchOf],
      foreignColumns: [t.id],
    }),
    check(
      "challenges_quarter_check",
      sql`${t.quarter} is null or (${t.quarter} between 1 and 4)`,
    ),
    check(
      "challenges_opponent_check",
      sql`${t.opponentId} is null or ${t.opponentId} <> ${t.creatorId}`,
    ),
  ],
);

export const forfeits = pgTable("forfeits", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengeId: uuid("challenge_id")
    .unique()
    .notNull()
    .references(() => challenges.id),
  owedBy: uuid("owed_by")
    .notNull()
    .references(() => profiles.id),
  owedTo: uuid("owed_to")
    .notNull()
    .references(() => profiles.id),
  kind: forfeitKindEnum("kind").notNull(),
  status: forfeitStatusEnum("status").notNull().default("owed"),
  proofPath: text("proof_path"),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export const messages = pgTable(
  "messages",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("messages_body_check", sql`char_length(${t.body}) <= 280`),
  ],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").unique().notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsSent = pgTable(
  "notifications_sent",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    refId: uuid("ref_id").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.kind, t.refId] })],
);

export const blocks = pgTable(
  "blocks",
  {
    blockerId: uuid("blocker_id").references(() => profiles.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id").references(() => profiles.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })],
);

export const reports = pgTable("reports", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  reporterId: uuid("reporter_id")
    .notNull()
    .references(() => profiles.id),
  challengeId: uuid("challenge_id").references(() => challenges.id),
  messageId: bigint("message_id", { mode: "number" }).references(() => messages.id, {
    onDelete: "set null",
  }),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Head-to-head record between any two people, from settled challenges. */
export const rivalries = pgView("rivalries").as((qb) =>
  qb
    .select({
      userA: sql<string>`least(${challenges.creatorId}, ${challenges.opponentId})`.as("user_a"),
      userB: sql<string>`greatest(${challenges.creatorId}, ${challenges.opponentId})`.as("user_b"),
      winsA: sql<number>`count(*) filter (where (${challenges.outcome} = 'creator' and ${challenges.creatorId} < ${challenges.opponentId}) or (${challenges.outcome} = 'opponent' and ${challenges.opponentId} < ${challenges.creatorId}))`.as(
        "wins_a",
      ),
      winsB: sql<number>`count(*) filter (where (${challenges.outcome} = 'creator' and ${challenges.creatorId} > ${challenges.opponentId}) or (${challenges.outcome} = 'opponent' and ${challenges.opponentId} > ${challenges.creatorId}))`.as(
        "wins_b",
      ),
      pushes: sql<number>`count(*) filter (where ${challenges.outcome} = 'push')`.as("pushes"),
      lastSettledAt: sql<Date>`max(${challenges.settledAt})`.as("last_settled_at"),
    })
    .from(challenges)
    .where(sql`${challenges.state} = 'settled'`)
    .groupBy(
      sql`least(${challenges.creatorId}, ${challenges.opponentId})`,
      sql`greatest(${challenges.creatorId}, ${challenges.opponentId})`,
    ),
);
