#!/usr/bin/env bash
# Bring up a working Docker daemon inside the Cloud Agent VM (nested containers).
# Idempotent: returns 0 quickly if the daemon is already serving requests.
#
# Nested-VM specifics handled here:
#   * fuse-overlayfs storage driver (overlay2 is unavailable on the overlay FS).
#   * FORWARD chain default policy set to ACCEPT so container-to-container
#     traffic is not dropped (Docker 29's nftables bridge rules fail to install
#     in this environment, leaving the default DROP policy in place).
set -euo pipefail

log() { echo "[docker-up] $*"; }

open_forward() {
  # Allow inter-container traffic on both nft and legacy backends (best-effort).
  sudo iptables -P FORWARD ACCEPT 2>/dev/null || true
  sudo iptables-legacy -P FORWARD ACCEPT 2>/dev/null || true
}

LOG=/var/log/dockerd.log

if sudo docker info >/dev/null 2>&1; then
  open_forward
  # Make the socket usable without sudo for the current user.
  sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
  log "Docker daemon already running."
  exit 0
fi

log "Starting dockerd (storage-driver=fuse-overlayfs)..."
# Clear stale daemon state left over from a previous boot/snapshot so a fresh
# dockerd can bind its pidfile and socket.
sudo rm -f /var/run/docker.pid /var/run/docker/containerd/containerd.pid 2>/dev/null || true
# Pre-create a world-writable log so the backgrounded root shell can always
# write it (a pre-existing root-owned/again-restricted /tmp path was the cause
# of an earlier "Permission denied" failure on a fresh pod).
sudo touch "$LOG" 2>/dev/null && sudo chmod 666 "$LOG" 2>/dev/null || LOG=/dev/null
sudo setsid bash -c "dockerd --storage-driver=fuse-overlayfs >>'$LOG' 2>&1 &" || true

# Wait up to ~60s for the socket to come alive.
for i in $(seq 1 60); do
  if sudo docker info >/dev/null 2>&1; then
    open_forward
    sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
    log "Docker daemon is up."
    exit 0
  fi
  sleep 1
done

log "ERROR: dockerd did not become ready in time. Last log lines:"
sudo tail -20 "$LOG" 2>/dev/null || true
exit 1
