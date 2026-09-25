#!/usr/bin/env bash
# Cloud Agent start phase for Waygr. Runs on every boot.
# Brings up Docker + the local Supabase stack, writes .env.local with the
# well-known local dev keys, and applies the database schema. Must terminate.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

log() { echo "[start] $*"; }

# ---------------------------------------------------------------------------
# 1. Docker daemon (nested VM). If this fails, the app can still run tests and
#    build, so surface the error but do not hard-fail the boot.
# ---------------------------------------------------------------------------
if ! bash "$REPO_DIR/.cursor/docker-up.sh"; then
  log "WARN: Docker unavailable; skipping Supabase. Tests/build still work; the"
  log "      dev server will render /demo but auth-backed pages need a database."
  exit 0
fi

# ---------------------------------------------------------------------------
# 2. Local Supabase stack (idempotent: no-op if already running).
# ---------------------------------------------------------------------------
log "Starting local Supabase stack..."
if ! supabase status >/dev/null 2>&1; then
  supabase start
fi

# ---------------------------------------------------------------------------
# 3. .env.local with local dev configuration. The anon/service keys below are
#    the standard, well-known Supabase *local* demo keys (not secrets) derived
#    from the default local JWT secret; they are identical on every machine.
# ---------------------------------------------------------------------------
if [ ! -f "$REPO_DIR/.env.local" ]; then
  log "Writing .env.local..."
  cat > "$REPO_DIR/.env.local" <<'ENV'
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SCORE_PROVIDER=balldontlie
BALLDONTLIE_API_KEY=
CRON_SECRET=dev-cron-secret
ENV
else
  log ".env.local already present; leaving as-is."
fi

# ---------------------------------------------------------------------------
# 4. Database schema. Apply the Drizzle SQL migrations if the schema is not yet
#    present. `drizzle-kit migrate` runs everything in one transaction and
#    rolls back on the pre-existing error in 0005 (invalid multi-target INTO on
#    Postgres 14+), so apply each file directly and continue past that one file.
# ---------------------------------------------------------------------------
DB_CONTAINER="$(docker ps --filter 'name=supabase_db_' --format '{{.Names}}' | head -1)"
if [ -z "$DB_CONTAINER" ]; then
  log "WARN: Supabase DB container not found; skipping migrations."
  exit 0
fi

HAS_PROFILES="$(docker exec "$DB_CONTAINER" psql -U postgres -d postgres -tAc \
  "select to_regclass('public.profiles') is not null;" 2>/dev/null || echo f)"

if [ "$HAS_PROFILES" = "t" ]; then
  log "Schema already applied."
else
  log "Applying Drizzle migrations..."
  for f in "$REPO_DIR"/drizzle/[0-9]*.sql; do
    name="$(basename "$f")"
    docker cp "$f" "$DB_CONTAINER:/tmp/mig.sql" >/dev/null
    if docker exec "$DB_CONTAINER" psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 \
        -f /tmp/mig.sql >/tmp/mig-out.log 2>&1; then
      log "  applied $name"
    else
      log "  WARN: $name failed to apply (see below); continuing"
      sed 's/^/    /' /tmp/mig-out.log | tail -5
    fi
  done
fi

log "Start complete. Supabase Studio: http://127.0.0.1:54323"
