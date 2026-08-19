#!/usr/bin/env bash
# Deploy Caribbean Trade Network to the trini VPS behind Traefik/Coolify.
# Prereq: real domain set in docker-compose.yml Traefik label + DNS A record -> 5.78.105.83
set -e
APP="caribbean-trade"
echo "🌴 Deploying $APP to trini (5.78.105.83)..."
scp -r -o StrictHostKeyChecking=accept-new \
  Dockerfile .dockerignore docker-compose.yml .env.production deploy.sh \
  src server.js seed.js load-scraped.js package.json data db \
  trini:/opt/$APP/
ssh trini "cd /opt/$APP && docker compose up -d --build"
echo "✅ $APP deployed. Set DNS A record for your domain to 5.78.105.83 if not done."
