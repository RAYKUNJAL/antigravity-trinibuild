#!/bin/bash
# Juvay.app full redeploy from GitHub → server
# Run this locally after agents push: bash scripts/deploy-juvay.sh
echo "🌴 Pulling latest and deploying to juvay.app..."
ssh trini "bash /opt/juvay/deploy.sh"
echo "✅ Done. Check https://juvay.app"
