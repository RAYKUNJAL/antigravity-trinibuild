#!/bin/bash

# TriniBuild - Vercel Configuration Fix Script
# This script updates the framework preset and adds environment variables via Vercel API

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 TriniBuild Vercel Configuration Fix${NC}"
echo ""

# Get Vercel token from environment or prompt
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${YELLOW}Please enter your Vercel API token:${NC}"
    echo "Get it from: https://vercel.com/account/tokens"
    read -s VERCEL_TOKEN
    echo ""
fi

TEAM_ID="team_CgmlMWVtL10mdIngnybUkVcY"
PROJECT_ID="antigravity-trinibuild"

echo -e "${GREEN}Step 1/3: Updating framework preset to Next.js...${NC}"

# Update framework to nextjs
curl -X PATCH \
  "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "framework": "nextjs",
    "buildCommand": "next build",
    "outputDirectory": ".next"
  }'

echo ""
echo -e "${GREEN}✅ Framework updated to Next.js${NC}"
echo ""

echo -e "${GREEN}Step 2/3: Adding NEXT_PUBLIC_SUPABASE_URL environment variable...${NC}"

# Add NEXT_PUBLIC_SUPABASE_URL
curl -X POST \
  "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?upsert=true&teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "NEXT_PUBLIC_SUPABASE_URL",
    "value": "https://cdprbbyptjdntcrhmwxf.supabase.co",
    "type": "plain",
    "target": ["production", "preview", "development"]
  }'

echo ""
echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_URL added${NC}"
echo ""

echo -e "${GREEN}Step 3/3: Adding NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable...${NC}"

# Add NEXT_PUBLIC_SUPABASE_ANON_KEY
curl -X POST \
  "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?upsert=true&teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkcHJiYnlwdGpkbnRjcmhtd3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzM5MTQsImV4cCI6MjA3OTcwOTkxNH0.4sZ8vH8wqK_QXK0xVvxE0yXG5Y-YdxQPE9vKGz5XQKE",
    "type": "plain",
    "target": ["production", "preview", "development"]
  }'

echo ""
echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_ANON_KEY added${NC}"
echo ""

echo -e "${GREEN}🎉 Configuration complete!${NC}"
echo ""
echo -e "${YELLOW}Next step: Trigger a redeploy${NC}"
echo "Visit: https://vercel.com/rays-projects-f998311b/antigravity-trinibuild/deployments"
echo "Or run: vercel --prod"
echo ""
