#!/usr/bin/env bash
# Cloud Agent install phase for Waygr.
# Idempotent: installs system tooling (Docker + Supabase CLI) needed to run the
# local Supabase stack, installs Node dependencies, and warms the Docker image
# cache so the first boot is fast. Safe to run repeatedly.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

log() { echo "[install] $*"; }

# ---------------------------------------------------------------------------
# 1. System packages: Docker Engine, fuse-overlayfs (nested-container storage),
#    and the Supabase CLI. All guarded so re-runs are no-ops.
# ---------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker Engine..."
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sudo sh /tmp/get-docker.sh
else
  log "Docker already installed ($(docker --version))."
fi

if ! dpkg -s fuse-overlayfs >/dev/null 2>&1; then
  log "Installing fuse-overlayfs..."
  sudo apt-get update -y && sudo apt-get install -y fuse-overlayfs
else
  log "fuse-overlayfs already installed."
fi

if ! command -v supabase >/dev/null 2>&1; then
  log "Installing Supabase CLI..."
  ARCH="$(dpkg --print-architecture)"
  curl -fsSL "https://github.com/supabase/cli/releases/latest/download/supabase_linux_${ARCH}.tar.gz" -o /tmp/supabase.tar.gz
  tar -xzf /tmp/supabase.tar.gz -C /tmp supabase
  sudo mv /tmp/supabase /usr/local/bin/supabase
else
  log "Supabase CLI already installed ($(supabase --version | head -1))."
fi

# ---------------------------------------------------------------------------
# 2. Node dependencies (required for tests + dev server).
# ---------------------------------------------------------------------------
log "Installing npm dependencies..."
npm ci

# ---------------------------------------------------------------------------
# 3. Warm the Docker image cache for the Supabase stack so the first `start`
#    is fast. Best-effort and non-destructive: skipped entirely once the images
#    are cached, so re-running install never tears down a running stack. A
#    failure here must not fail the install, since tests and the build run
#    without a live database.
# ---------------------------------------------------------------------------
if docker image ls --format '{{.Repository}}' 2>/dev/null | grep -q 'supabase/postgres'; then
  log "Supabase images already cached; skipping warm-up."
elif bash "$REPO_DIR/.cursor/docker-up.sh"; then
  log "Pre-pulling Supabase images..."
  if supabase start >/tmp/supabase-warm.log 2>&1; then
    supabase stop --no-backup >/dev/null 2>&1 || true
    log "Supabase images cached."
  else
    log "WARN: supabase start during warm-up failed; images will pull on first boot. See /tmp/supabase-warm.log"
  fi
else
  log "WARN: Docker daemon could not start during install; skipping image warm-up."
fi

log "Install complete."
