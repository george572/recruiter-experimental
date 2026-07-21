#!/usr/bin/env bash
# Run on Hetzner as root: bash /opt/samushao/recruiter-platform/deploy/hetzner/install.sh
set -euo pipefail

PLATFORM_DIR="/opt/samushao/recruiter-platform"
MAIN_DIR="/opt/samushao/app"
REPO_SSH="git@github.com:george572/recruiter-experimental.git"
REPO_HTTPS="https://github.com/george572/recruiter-experimental.git"
DEPLOY_KEY="/root/.ssh/recruiter_platform_deploy"

git_sync() {
  if [[ "${SKIP_GIT_SYNC:-}" == "1" ]]; then
    echo "[recruiter-platform] SKIP_GIT_SYNC=1 — using existing checkout"
    return 0
  fi

  if [[ -f "$DEPLOY_KEY" ]]; then
    export GIT_SSH_COMMAND="ssh -i ${DEPLOY_KEY} -o StrictHostKeyChecking=accept-new"
    if [[ -d .git ]]; then
      git remote set-url origin "$REPO_SSH"
      git fetch origin main
      git reset --hard origin/main
    else
      git clone -b main "$REPO_SSH" .
    fi
    return 0
  fi

  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    local url="https://x-access-token:${GITHUB_TOKEN}@github.com/george572/recruiter-experimental.git"
    if [[ -d .git ]]; then
      git remote set-url origin "$url"
      git fetch origin main
      git reset --hard origin/main
      git remote set-url origin "$REPO_HTTPS"
    else
      git clone -b main "$url" .
      git remote set-url origin "$REPO_HTTPS"
    fi
    return 0
  fi

  # Public HTTPS (or any existing clone that can fetch) — sync without deploy key.
  if [[ -d .git ]]; then
    git remote set-url origin "$REPO_HTTPS"
    if git fetch origin main; then
      git reset --hard origin/main
      return 0
    fi
  else
    if git clone -b main "$REPO_HTTPS" .; then
      return 0
    fi
  fi

  echo "[recruiter-platform] No deploy key, GITHUB_TOKEN, or reachable origin — cannot sync" >&2
  echo "Add /root/.ssh/recruiter_platform_deploy to GitHub deploy keys, or export GITHUB_TOKEN" >&2
  exit 1
}

echo "[recruiter-platform] ensuring directory..."
mkdir -p "$PLATFORM_DIR"
cd "$PLATFORM_DIR"
git_sync

echo "[recruiter-platform] building .env..."
MAIN_ENV="$MAIN_DIR/.env"
OUT_ENV="$PLATFORM_DIR/.env"

if [[ ! -f "$MAIN_ENV" ]]; then
  echo "Missing $MAIN_ENV — create Samushao .env first" >&2
  exit 1
fi

{
  echo "NODE_ENV=production"
  echo "PORT=4004"
  echo "HOSTNAME=0.0.0.0"
  echo "SAMUSHAO_API_BASE=http://app:4000"
  echo "NEXT_PUBLIC_API_BASE_URL=http://app:4000"
  echo "NEXT_PUBLIC_SITE_URL=https://recruiter.ge"
  echo "NEXT_PUBLIC_GA_MEASUREMENT_ID=G-3T11JCESTD"
} > "$OUT_ENV"

echo "[recruiter-platform] docker build + start..."
docker compose -f deploy/hetzner/docker-compose.yml up -d --build

echo "[recruiter-platform] health..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if docker compose -f deploy/hetzner/docker-compose.yml exec -T recruiter-platform \
    node -e "fetch('http://127.0.0.1:4004/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"; then
    echo "[recruiter-platform] healthy"
    break
  fi
  if [[ "$i" -eq 10 ]]; then
    echo "[recruiter-platform] health check failed" >&2
    exit 1
  fi
  sleep 3
done

echo "[recruiter-platform] updating Caddyfile for recruiter.ge → platform..."
CADDY="$MAIN_DIR/Caddyfile"
MARK_PLATFORM="# --- recruiter.ge platform (managed by recruiter-platform install.sh) ---"
MARK_LEGACY="# --- recruiter.ge (managed by install.sh) ---"

# Remove legacy single-block and previous platform block so we can rewrite cleanly
python3 - <<'PY'
from pathlib import Path
import re

path = Path("/opt/samushao/app/Caddyfile")
text = path.read_text() if path.exists() else ""

# Drop managed platform block
text = re.sub(
    r"\n?# --- recruiter\.ge platform \(managed by recruiter-platform install\.sh\) ---.*?(?=\n# ---|\Z)",
    "\n",
    text,
    flags=re.S,
)

# Drop legacy recruiter block that proxies all hosts to recruiter:4003
text = re.sub(
    r"\n?# --- recruiter\.ge \(managed by install\.sh\) ---.*?(?=\n# ---|\Z)",
    "\n",
    text,
    flags=re.S,
)

# Also drop any leftover bare recruiter.ge block pointing everything at recruiter:4003
text = re.sub(
    r"\n?recruiter\.ge,\s*www\.recruiter\.ge,\s*app\.recruiter\.ge\s*\{[^}]*\}\n?",
    "\n",
    text,
    flags=re.S,
)

block = """
# --- recruiter.ge platform (managed by recruiter-platform install.sh) ---
recruiter.ge, www.recruiter.ge {
  reverse_proxy recruiter-platform:4004
}

app.recruiter.ge {
  reverse_proxy recruiter:4003
}
"""

path.write_text(text.rstrip() + "\n" + block + "\n")
print("[recruiter-platform] Caddyfile updated")
PY

cd "$MAIN_DIR"
docker compose restart caddy

echo "[recruiter-platform] done."
echo "recruiter.ge → audience board (Next.js :4004)"
echo "app.recruiter.ge → HR product (Express :4003)"
echo "Test: curl -I https://recruiter.ge/"
