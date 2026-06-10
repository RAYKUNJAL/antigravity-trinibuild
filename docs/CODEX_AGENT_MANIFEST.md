# Codex Agent Manifest

This repo now treats Codex as part of the NextBagChaser operating team.

## Role

Codex is the build, test, deploy, and server-setup agent for:

- NextBagChaser command center
- TriniBuild platform apps
- BidBinBuy bin-store/scanner app
- Self-hosted Supabase migrations
- Hetzner/Coolify deployment runbooks

## Server Target

- Server: `trinibuild-prod`
- IP: `5.78.105.83`
- Primary domain: `nextbagchaser.com`
- Code-server domain: `code.nextbagchaser.com`
- Coolify panel: `http://5.78.105.83:8000`

## Current Access State

- Hetzner API access works.
- A Codex SSH key has been created locally and registered in Hetzner as `codex-nextbagchaser`.
- The running server does not yet accept that key because existing servers do not automatically import newly registered Hetzner project keys.
- `code.nextbagchaser.com` password login works, but the code-server workbench cannot attach because the WebSocket route returns `404` and the UI reports `WebSocket close with status code 1006`.

## Model/Agent Wiring

The command center should use:

- Google Gemini through `services/llmRouter.ts` for agent planning.
- Paperclip through `services/paperclipAgentOrchestrator.ts` for local team bootstrapping.
- Supabase command-center tables for durable memory and handoffs.

Command-center tables are defined in:

`supabase/migrations/48_command_center_ai_team.sql`

Server bootstrap is defined in:

`deploy/hetzner/bootstrap-platform.sh`

## Required Before Live Server Build

One of these must be fixed or provided:

- SSH access for a server user that can run Docker/Coolify commands.
- Root password or sudo user password.
- Working code-server WebSocket proxy so the integrated terminal works.
- Coolify API token/login so the GitHub deployment can be configured there.

After access is working, run:

```bash
sudo bash deploy/hetzner/bootstrap-platform.sh
```
