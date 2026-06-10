# NextBagChaser Server Memory

Last updated: 2026-06-09

## Infrastructure Direction

All NextBagChaser, TriniBuild, BidBinBuy, and related app operations are moving off Vercel and onto the self-hosted Hetzner server.

The platform command center should be the primary operating surface:

- Production dashboard: `https://nextbagchaser.com/dashboard/team`
- TriniBuild production site target: `https://trinibuild.com`
- Admin command center route: `/admin/command-center/team`
- Agent memory, app registry, command runs, and handoffs live in self-hosted Supabase tables.
- The website should use self-hosted Supabase environment variables, not hosted Supabase/Vercel defaults.

## Known Server

- Hetzner server name: `trinibuild-prod`
- Hetzner server id: `129731300`
- Public IPv4: `5.78.105.83`
- OS image: Ubuntu 24.04
- Datacenter: `hil-dc1`
- DNS: `nextbagchaser.com` resolves to `5.78.105.83`
- Required DNS update: `trinibuild.com` and `www.trinibuild.com` should point to `5.78.105.83`.
- HTTP/HTTPS: Caddy is responding on ports `80` and `443`
- Coolify: port `8000` is open and redirects to `/login`
- SSH: port `22` is open
- Code-server: `https://code.nextbagchaser.com` accepts the provided password, but the workbench WebSocket currently fails with status `1006` because `wss://code.nextbagchaser.com/stable-...` returns `404`.

Do not commit Hetzner API tokens, Coolify passwords, Supabase service role keys, root passwords, or SSH private keys to this repo.

## Access Still Needed

The Hetzner API token can list infrastructure, but it does not provide shell access to the running server.

To deploy and manage the platform directly on the server, one of these is required:

- SSH access for `root@5.78.105.83` or a sudo user
- An SSH private key already trusted by the server
- The current root password
- Coolify login or Coolify API token

To wire the frontend to self-hosted Supabase, these are required:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Supabase service role key for admin migrations, kept server-side only
- Database connection string or Supabase Studio/admin access for applying migrations

## Command Center Build State

The repo now contains:

- `components/admin/TeamCommandCenter.tsx`
- `services/commandCenterService.ts`
- `supabase/migrations/48_command_center_ai_team.sql`

These implement:

- Multi-app command center
- AI agent roster
- Google Gemini command-run path through the existing `llmRouter`
- Paperclip boot control through the existing orchestrator
- Shared memory
- Agent runs
- Agent handoffs
- App registry and setup checklists
- Local fallback mode when Supabase is not configured

## Deployment Notes

After server access is available:

1. Pull this repo on the server or configure Coolify to deploy the GitHub branch.
2. Set the production env vars in Coolify.
3. Apply `supabase/migrations/48_command_center_ai_team.sql` to the self-hosted Supabase database.
4. Build with `npm ci && npm run build`.
5. Serve the built `dist` app through the existing Caddy/Coolify deployment.
6. Verify `https://nextbagchaser.com/dashboard/team` renders after login.

For the standalone TriniBuild web deployment:

1. Ensure DNS for `trinibuild.com` and `www.trinibuild.com` points to `5.78.105.83`.
2. Deploy this repo with `docker compose -f docker-compose.trinibuild.yml up -d --build`.
3. Add the Caddy route from `deploy/hetzner/Caddyfile.trinibuild.example`.
4. Verify `https://trinibuild.com` returns the app instead of `404`.

## Current Blockers

- No SSH key is registered in the Hetzner project.
- Codex SSH key is now registered in the Hetzner project as `codex-nextbagchaser`, but it is not accepted by the existing server until added to the server user's `authorized_keys`.
- No Coolify login/API token is available in this repo/session.
- No self-hosted Supabase anon/service keys are available in this repo/session.
- Code-server cannot currently be used for terminal work until the WebSocket proxy is fixed.
