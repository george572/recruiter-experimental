#!/usr/bin/env bash
# First-time bootstrap on Hetzner (private repo).
# Usage on server:
#   export GITHUB_TOKEN='ghp_...'
#   bash bootstrap.sh
set -euo pipefail

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Set GITHUB_TOKEN first (GitHub fine-grained or classic PAT with repo read)." >&2
  exit 1
fi

mkdir -p /opt/samushao
PLATFORM_DIR="/opt/samushao/recruiter-platform"

if [[ ! -d "$PLATFORM_DIR/.git" ]]; then
  rm -rf "$PLATFORM_DIR"
  git clone -b main "https://x-access-token:${GITHUB_TOKEN}@github.com/george572/recruiter-experimental.git" "$PLATFORM_DIR"
fi

cd "$PLATFORM_DIR"
git remote set-url origin "https://github.com/george572/recruiter-experimental.git"
export GITHUB_TOKEN
bash deploy/hetzner/install.sh
unset GITHUB_TOKEN

echo "[bootstrap] complete — revoke GITHUB_TOKEN if it was pasted in shell history"
