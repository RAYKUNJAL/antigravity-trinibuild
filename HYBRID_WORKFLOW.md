# Hybrid MCP + Browser Automation Workflow

## Memory Rule Created
✅ **Memory #5**: Use MCP tools for API operations (Vercel read, Supabase queries, Make workflows) and Claude in Chrome for UI-only tasks (form filling, clicking dropdowns, settings that lack API endpoints). Always try MCP first; use browser automation only when MCP lacks write capabilities.

---

## Decision Framework: When to Use What

### 🔧 MCP Tools (API-First)
**Use for:**
- Reading data (Vercel:get_project, Supabase:list_tables)
- Creating/updating via API (Supabase:apply_migration, environment variables via API)
- Deploying code (Vercel:deploy_to_vercel when CLI configured)
- Automated workflows (Make scenarios, GitHub actions)

**Advantages:**
- ✅ Reliable, no UI dependencies
- ✅ Fast execution
- ✅ Can be scripted/automated
- ✅ Version controllable

**When NOT to use:**
- ❌ API endpoint doesn't exist
- ❌ Requires visual confirmation
- ❌ Complex UI interactions (drag-and-drop, visual editors)

---

### 🌐 Claude in Chrome (Browser Automation)
**Use for:**
- UI-only settings (framework dropdowns when API unavailable)
- Visual editors (Canva, Figma)
- Multi-step workflows requiring screenshots/confirmation
- Testing UI flows
- Accessing authenticated dashboards

**Advantages:**
- ✅ Access to any web UI
- ✅ Can handle complex interactions
- ✅ Visual feedback via screenshots
- ✅ Works when API docs missing

**When NOT to use:**
- ❌ API endpoint exists (use MCP instead)
- ❌ Need bulk operations (browser is slow)
- ❌ CI/CD workflows (unreliable)
- ❌ Page structure frequently changes

---

## Vercel Configuration: Three Approaches

### Option 1: API Script (RECOMMENDED)
**Status**: ✅ Script created, ready to run

```bash
# Get your Vercel token from: https://vercel.com/account/tokens
export VERCEL_TOKEN="your_token_here"

# Run the automated fix
cd /home/claude/trinibuild-source
./scripts/fix-vercel-config.sh
```

**What it does:**
1. Updates framework: Vite → Next.js
2. Adds NEXT_PUBLIC_SUPABASE_URL
3. Adds NEXT_PUBLIC_SUPABASE_ANON_KEY
4. All environments (production, preview, development)

**Pros:**
- ✅ Fastest (< 5 seconds)
- ✅ Repeatable
- ✅ Version controlled
- ✅ No manual clicking

**Cons:**
- ❌ Requires Vercel API token

---

### Option 2: Manual UI (3 Minutes)
**Status**: ⏳ Ready to follow

1. **Framework**: https://vercel.com/rays-projects-f998311b/antigravity-trinibuild/settings/general
   - Find "Framework Preset"
   - Change: Vite → Next.js
   - Save

2. **Env Vars**: https://vercel.com/rays-projects-f998311b/antigravity-trinibuild/settings/environment-variables
   - Add: `NEXT_PUBLIC_SUPABASE_URL` = `https://cdprbbyptjdntcrhmwxf.supabase.co`
   - Add: `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGc...XQKE`
   - Check all 3 environments

3. **Redeploy**: https://vercel.com/rays-projects-f998311b/antigravity-trinibuild/deployments
   - Click ••• on latest deployment
   - Click "Redeploy"

**Pros:**
- ✅ No token required
- ✅ Visual confirmation

**Cons:**
- ❌ 3 minutes of clicking
- ❌ Not repeatable
- ❌ Manual errors possible

---

### Option 3: Browser Automation (EXPERIMENTAL)
**Status**: ⚠️ Had timeout issues, needs retry

Using Claude in Chrome:
```javascript
// Navigate to settings
// Find framework dropdown
// Select Next.js
// Add environment variables
// Trigger redeploy
```

**Pros:**
- ✅ Automated UI interaction
- ✅ Visual confirmation
- ✅ No API token needed

**Cons:**
- ❌ Browser timeouts (experienced)
- ❌ Slower than API
- ❌ Fragile (UI changes break it)

---

## Best Practice Workflow

### For TriniBuild and Future Projects

1. **Check API First** (Vercel:search_vercel_documentation, search tool docs)
   ```
   Does an API endpoint exist for this operation?
   → YES: Use MCP tool or API script
   → NO: Continue to step 2
   ```

2. **Evaluate Complexity**
   ```
   Is it a one-time setup or recurring task?
   → One-time: Manual UI acceptable
   → Recurring: Worth browser automation or requesting API access
   ```

3. **Choose Tool**
   ```
   - API exists → MCP or curl script
   - No API, one-time → Manual UI
   - No API, recurring → Browser automation
   - Visual/complex → Browser automation
   ```

4. **Document Decision**
   ```
   Create memory rule or README note:
   "For X operation, use Y tool because Z"
   ```

---

## Current Status: Vercel Fix

**Recommended Path**: Option 1 (API Script)

**Next Action Required**: 
You need to provide your Vercel API token:
1. Go to: https://vercel.com/account/tokens
2. Create new token (name: "TriniBuild Claude Automation")
3. Run: `export VERCEL_TOKEN="your_token"`
4. Run: `./scripts/fix-vercel-config.sh`

**Alternative**: Option 2 (Manual - 3 minutes total)

---

## Files Created

1. ✅ `/scripts/fix-vercel-config.sh` - API automation script
2. ✅ `/HYBRID_WORKFLOW.md` - This documentation
3. ✅ Memory Rule #5 - MCP + Browser automation decision framework

**Committed to GitHub**: b02da88
