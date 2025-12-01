# Vercel Build Rules - TriniBuild Project

## CRITICAL: Always Follow These Rules Before Pushing Code

### 1. **JSX Syntax Validation**
- ✅ **NEVER** put JSX elements inside HTML attributes
- ✅ **ALWAYS** properly close all JSX elements (`<input />` not `<input>`)
- ✅ **NEVER** use conditional rendering inside element attributes
- ❌ **WRONG**: `<input {condition && <span>...</span>} />`
- ✅ **RIGHT**: `<div>{condition && <span>...</span>}</div>`

### 2. **TypeScript Strict Mode Compliance**
- ✅ All variables must have proper types
- ✅ No `any` types without justification
- ✅ Imported components must exist and be properly typed
- ✅ Props interfaces must be defined for all components

### 3. **Import Validation**
- ✅ Check ALL imports actually exist
- ✅ Verify paths are correct (relative vs absolute)
- ✅ Ensure no circular dependencies
- ✅ Icons from `lucide-react` must be spelled correctly

### 4. **Build Testing Protocol**

#### Before Every Git Push:
```bash
# 1. Run local build test
npm run build

# 2. Check for TypeScript errors
npx tsc --noEmit

# 3. Run linter (if available)
npm run lint
```

### 5. **Common Vercel Build Killers**

#### ❌ NEVER DO THIS:
```tsx
// Broken JSX in attributes
<input 
  type="text"
  {cartCount > 0 && (
    <span>Badge</span>
  )}
/>

// Unclosed elements
<button>Click Me
<div>Content

// Wrong import paths
import { Component } from './nonexistent/path'

// Using window/document without checks
const data = window.localStorage.getItem('key')  // Breaks SSR
```

#### ✅ ALWAYS DO THIS:
```tsx
// Proper JSX structure
<div className="relative">
  <input type="text" />
  {cartCount > 0 && (
    <span className="badge">{cartCount}</span>
  )}
</div>

// Properly closed elements
<button>Click Me</button>
<div>Content</div>

// Correct imports with verification
import { Component } from '../components/Component'

// SSR-safe code
const data = typeof window !== 'undefined' 
  ? window.localStorage.getItem('key') 
  : null
```

### 6. **File Edit Safety Rules**

#### When Editing Large Files (>500 lines):
1. **View the exact section** before editing
2. **Copy exact target content** - including ALL whitespace
3. **Test replacement** in a small section first
4. **Verify syntax** after each edit
5. **Build test** before committing

#### High-Risk Files (Always Extra Careful):
- `pages/Storefront.tsx` (818 lines) - Complex checkout flow
- `pages/StoreCreator.tsx` (661 lines) - Multi-step form
- `App.tsx` (routing critical)
- Any file with complex JSX nesting

### 7. **Pre-Commit Checklist**

```markdown
- [ ] Ran `npm run build` successfully
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All imports verified to exist
- [ ] No JSX syntax errors
- [ ] No console errors in dev server
- [ ] Tested affected pages locally
- [ ] All elements properly closed
- [ ] No SSR-breaking code (window/document usage)
```

### 8. **Vercel-Specific Considerations**

#### Build Environment:
- Node.js version: Latest LTS
- Build timeout: 15 minutes
- Memory limit: 8GB (4 cores)
- Build command: `vite build`

#### SSR Issues to Avoid:
```tsx
// ❌ Breaks Vercel build
const isMobile = window.innerWidth < 768

// ✅ SSR-Safe
const [isMobile, setIsMobile] = useState(false)
useEffect(() => {
  setIsMobile(window.innerWidth < 768)
}, [])
```

### 9. **Emergency Hotfix Protocol**

If build fails on Vercel:
1. Check Vercel error logs for exact line number
2. Revert to last working commit if unsure: `git checkout HEAD~1 -- [file]`
3. Fix locally with `npm run build` test
4. Create hotfix commit with "HOTFIX:" prefix
5. Push and monitor Vercel deployment

### 10. **Automated Safety Checks**

#### Recommended package.json scripts:
```json
{
  "scripts": {
    "prebuild": "tsc --noEmit",
    "build": "vite build",
    "test:build": "npm run prebuild && npm run build",
    "verify": "npm run test:build"
  }
}
```

---

## Rule Enforcement

**Before ANY code push:**
1. Run `npm run build` locally
2. Check for ANY errors
3. Fix all errors before pushing
4. Never push "hoping it works on Vercel"

**When editing JSX:**
- Treat HTML elements as STRICTLY CLOSED
- Never nest incorrectly
- Always validate bracket matching
- Test immediately in dev server

**Golden Rule:**
> If it doesn't build locally, it WILL NOT build on Vercel.
> If it builds locally but has errors, it MIGHT NOT build on Vercel.
> Only push code that builds CLEANLY with ZERO errors locally.

---

## Quick Reference: Recent Build Errors

### Error: Expected "..." but found [identifier]
**Cause**: JSX inside HTML attribute
**Fix**: Move JSX outside the element, wrap in proper container

### Error: Expected corresponding JSX closing tag
**Cause**: Unclosed JSX element or wrong closing tag
**Fix**: Ensure all `<element>` have matching `</element>` or use self-closing `<element />`

### Error: Cannot find module
**Cause**: Wrong import path or non-existent file
**Fix**: Verify file exists, check path is correct (case-sensitive!)

---

**Last Updated**: 2025-12-01
**Project**: TriniBuild
**Build System**: Vite + React + TypeScript → Vercel
