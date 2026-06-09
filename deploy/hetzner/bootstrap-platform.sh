#!/usr/bin/env bash
set -euo pipefail

# NextBagChaser Hetzner bootstrap
# Run on trinibuild-prod after SSH/Coolify access is working.
# This script pulls the platform apps from GitHub and prepares the shared app root.

APP_ROOT="${APP_ROOT:-/opt/nextbagchaser}"
TRINIBUILD_REPO="${TRINIBUILD_REPO:-https://github.com/RAYKUNJAL/antigravity-trinibuild.git}"
BIDBINBUY_REPO="${BIDBINBUY_REPO:-https://github.com/RAYKUNJAL/bidbinbuy.git}"
TRINIBUILD_BRANCH="${TRINIBUILD_BRANCH:-codex/nextbagchaser-command-center}"
BIDBINBUY_BRANCH="${BIDBINBUY_BRANCH:-codex/store-owner-launch-pr}"

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Run as root or with sudo." >&2
    exit 1
  fi
}

install_system_packages() {
  apt-get update
  apt-get install -y ca-certificates curl git gnupg

  if ! command -v docker >/dev/null 2>&1; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    . /etc/os-release
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
      > /etc/apt/sources.list.d/docker.list
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi
}

sync_repo() {
  local repo_url="$1"
  local branch="$2"
  local target="$3"

  if [ -d "$target/.git" ]; then
    git -C "$target" fetch origin
    git -C "$target" checkout "$branch"
    git -C "$target" pull --ff-only origin "$branch"
  else
    git clone --branch "$branch" "$repo_url" "$target"
  fi
}

write_server_memory() {
  mkdir -p "$APP_ROOT/memory" "$APP_ROOT/env"
  cat > "$APP_ROOT/memory/codex-agent-manifest.json" <<'JSON'
{
  "platform": "nextbagchaser",
  "server": "trinibuild-prod",
  "model_owner": "codex",
  "purpose": "Build, test, deploy, and operate the NextBagChaser, TriniBuild, and BidBinBuy apps from the Hetzner command center.",
  "github_apps": [
    {
      "name": "antigravity-trinibuild",
      "repo": "https://github.com/RAYKUNJAL/antigravity-trinibuild.git",
      "branch": "codex/nextbagchaser-command-center",
      "routes": ["/dashboard/team", "/admin/command-center/team"]
    },
    {
      "name": "bidbinbuy",
      "repo": "https://github.com/RAYKUNJAL/bidbinbuy.git",
      "branch": "codex/store-owner-launch-pr",
      "routes": ["/", "/scan", "/owner/onboarding", "/pricing", "/blog"]
    }
  ],
  "agent_memory_tables": [
    "command_center_apps",
    "command_center_agent_runs",
    "command_center_agent_memory",
    "command_center_agent_handoffs",
    "command_center_events"
  ],
  "required_secrets": [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "VITE_GEMINI_API_KEY"
  ],
  "rules": [
    "Do not store secrets in Git.",
    "Apply database migrations before enabling production command-center writes.",
    "Use /dashboard/team as the operating surface for all apps.",
    "Keep BidBinBuy connected as the bin-store scanner and owner-acquisition app."
  ]
}
JSON
}

print_next_steps() {
  cat <<EOF

NextBagChaser app root is ready at: $APP_ROOT

Repos:
- $APP_ROOT/apps/antigravity-trinibuild
- $APP_ROOT/apps/bidbinbuy

Next steps:
1. Put production env files in $APP_ROOT/env or Coolify secrets.
2. Apply antigravity-trinibuild/supabase/migrations/48_command_center_ai_team.sql.
3. Configure Coolify apps from the GitHub repos or Docker compose files.
4. Fix code-server/Caddy websocket proxy if code.nextbagchaser.com still reports 1006.
5. Point trinibuild.com and www.trinibuild.com DNS to 5.78.105.83.
6. To run TriniBuild directly with Docker:
   cd $APP_ROOT/apps/antigravity-trinibuild
   docker compose -f docker-compose.trinibuild.yml up -d --build
7. Add deploy/hetzner/Caddyfile.trinibuild.example to the server Caddy config or create the equivalent Coolify domain route.
8. Open https://trinibuild.com and https://nextbagchaser.com/dashboard/team after deployment.

EOF
}

require_root
install_system_packages
mkdir -p "$APP_ROOT/apps"
sync_repo "$TRINIBUILD_REPO" "$TRINIBUILD_BRANCH" "$APP_ROOT/apps/antigravity-trinibuild"
sync_repo "$BIDBINBUY_REPO" "$BIDBINBUY_BRANCH" "$APP_ROOT/apps/bidbinbuy"
write_server_memory
print_next_steps
