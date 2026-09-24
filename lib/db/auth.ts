import { pgSchema, uuid } from "drizzle-orm/pg-core";

/** Supabase Auth users table — referenced by profiles.auth_user_id. */
export const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});
