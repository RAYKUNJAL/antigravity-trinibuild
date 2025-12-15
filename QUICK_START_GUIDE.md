# 🚀 Store Builder V2.0 - Quick Start Guide

## For Developers: Get Up and Running in 15 Minutes

### Prerequisites
- Node.js 18+ installed
- Supabase project set up
- OpenAI API key (for AI features)
- Google Maps API key (for location)

---

## Step 1: Environment Setup (5 min)

### 1.1 Create `.env` file
```bash
# Copy from .env.example
cp .env.example .env
```

### 1.2 Add API Keys
```env
# OpenAI (Required for AI features)
VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Google Maps (Required for location picker)
VITE_GOOGLE_MAPS_API_KEY=AIza-your-google-maps-key-here

# Supabase (Already configured)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Twilio (Optional - for SMS verification)
VITE_TWILIO_ACCOUNT_SID=your-twilio-sid
VITE_TWILIO_AUTH_TOKEN=your-twilio-token
VITE_TWILIO_PHONE_NUMBER=+1234567890
```

### 1.3 Get API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and paste into `.env`
4. Add $10 credit to account

**Google Maps:**
1. Go to https://console.cloud.google.com/
2. Enable Maps JavaScript API and Places API
3. Create API key
4. Copy and paste into `.env`

---

## Step 2: Database Setup (3 min)

### 2.1 Run Migration
```bash
# Create new migration file
supabase migration new store_builder_v2

# Copy this SQL to the migration file:
```

```sql
-- Add new columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS vibe_tags TEXT[],
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT ARRAY['cash'],
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS logo_style TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_plan ON stores(plan);
CREATE INDEX IF NOT EXISTS idx_stores_whatsapp_verified ON stores(whatsapp_verified);

-- Update RLS policies to allow store creation
CREATE POLICY "Users can create their own stores"
ON stores FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores"
ON stores FOR UPDATE
USING (auth.uid() = user_id);
```

### 2.2 Apply Migration
```bash
supabase db push
```

---

## Step 3: Install Dependencies (2 min)

```bash
npm install
```

**New dependencies needed:**
```bash
npm install @react-google-maps/api
npm install react-color
```

---

## Step 4: Add Route (1 min)

### 4.1 Update `App.tsx`
```typescript
import { StoreCreatorV2 } from './pages/StoreCreatorV2';

// Add route
<Route path="/create-store-v2" element={<StoreCreatorV2 />} />
```

### 4.2 Optional: Make V2 the default
```typescript
// Replace existing route
<Route path="/create-store" element={<StoreCreatorV2 />} />
```

---

## Step 5: Test the Flow (4 min)

### 5.1 Start Dev Server
```bash
npm run dev
```

### 5.2 Navigate to Store Builder
```
http://localhost:5173/create-store-v2
```

### 5.3 Test Social Import
1. Click "Import from Social Media"
2. Select Instagram
3. Paste: `https://instagram.com/trinibuild`
4. Click "Import"
5. Watch the magic! ✨

### 5.4 Test AI Features
1. Enter business name: "Test Roti Shop"
2. Select category: "Roti Shop"
3. Click "Generate with AI" for tagline
4. Click "Next: Design Your Brand"
5. Click "Generate with AI" for logo
6. Watch DALL-E create your logo! 🎨

### 5.5 Complete the Flow
1. Fill in all required fields
2. Watch auto-save indicator
3. Preview your store
4. Launch! 🚀

---

## Step 6: Test in Console (Optional)

### Test AI Service
```javascript
// Open browser console (F12)

// Test description generation
const { aiService } = await import('./services/aiService');

const result = await aiService.generateDescription({
  businessName: 'Test Roti Shop',
  category: 'roti_shop',
  tagline: 'Best Roti in Trinidad'
}, {
  tone: 'professional',
  length: 'medium'
});

console.log('Generated Description:', result.data.description);
```

### Test Social Import
```javascript
// Test social import
const { socialImportService } = await import('./services/socialImportService');

const result = await socialImportService.importFromUrl(
  'https://instagram.com/trinibuild'
);

console.log('Imported Data:', result.data);
```

---

## Common Issues & Solutions

### Issue 1: OpenAI API Error
**Error:** `API key not found`
**Solution:**
1. Check `.env` file has `VITE_OPENAI_API_KEY`
2. Restart dev server
3. Clear browser cache

### Issue 2: Social Import Fails
**Error:** `Failed to import from social media`
**Solution:**
- This is expected without API access
- The service will use mock data for development
- To enable real scraping, configure a proxy service

### Issue 3: Google Maps Not Loading
**Error:** `Google Maps API error`
**Solution:**
1. Check API key in `.env`
2. Enable Maps JavaScript API in Google Cloud Console
3. Enable Places API
4. Check billing is enabled

### Issue 4: Images Not Uploading
**Error:** `Failed to upload image`
**Solution:**
1. Check Supabase storage bucket exists: `site-assets`
2. Check RLS policies allow uploads
3. Check file size < 5MB

### Issue 5: Auto-Save Not Working
**Error:** No error, just not saving
**Solution:**
1. Check browser console for errors
2. Check localStorage is enabled
3. Check Supabase connection

---

## Development Tips

### 1. Use Mock Data for Development
```typescript
// In aiService.ts, the service automatically falls back to mock data
// if no API key is provided. This is perfect for development!

// To force mock mode:
const aiService = new AIService();
aiService.apiKey = null; // Forces mock responses
```

### 2. Skip WhatsApp Verification
```typescript
// In StoreCreatorV2.tsx
setFormData(prev => ({ ...prev, whatsappVerified: true }));
```

### 3. Auto-Fill Form for Testing
```typescript
// Add this to useEffect in StoreCreatorV2.tsx
useEffect(() => {
  if (import.meta.env.DEV) {
    setFormData({
      businessName: 'Test Roti Shop',
      category: 'roti_shop',
      tagline: 'Best Roti in Trinidad',
      description: 'We serve the best roti in Trinidad...',
      whatsappNumber: '18681234567',
      location: {
        area: 'Chaguanas',
        region: 'Couva-Tabaquite-Talparo'
      },
      // ... rest of fields
    });
  }
}, []);
```

### 4. Debug AI Costs
```typescript
// Check AI usage costs
const result = await aiService.generateDescription(...);
console.log('Cost:', result.usage?.cost); // In USD
```

### 5. Monitor Performance
```typescript
// Add timing logs
console.time('Social Import');
await socialImportService.importFromUrl(url);
console.timeEnd('Social Import');
```

---

## Testing Checklist

### Manual Testing
- [ ] Social import from Instagram
- [ ] Social import from Facebook
- [ ] Manual entry flow
- [ ] AI logo generation (all 5 styles)
- [ ] AI description generation
- [ ] AI tagline generation
- [ ] Color palette selection
- [ ] Font pair selection
- [ ] Location picker (map)
- [ ] Operating hours builder
- [ ] Image upload
- [ ] WhatsApp verification
- [ ] Preview (desktop/mobile)
- [ ] Auto-save
- [ ] Draft restoration
- [ ] Error handling
- [ ] Store launch

### Automated Testing (Future)
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set in production
- [ ] Database migration applied
- [ ] OpenAI API key has sufficient credits
- [ ] Google Maps billing enabled
- [ ] Supabase storage configured
- [ ] RLS policies tested
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (GA, Mixpanel)

### Deployment
```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy to Vercel/Netlify
vercel deploy --prod
# or
netlify deploy --prod
```

### Post-Deployment
- [ ] Test on production URL
- [ ] Test social import
- [ ] Test AI features
- [ ] Test payment flow
- [ ] Monitor error rates
- [ ] Monitor AI costs
- [ ] Check analytics

---

## Monitoring & Maintenance

### Daily Checks
- [ ] Error rate < 1%
- [ ] Completion rate > 70%
- [ ] AI costs within budget
- [ ] No critical bugs

### Weekly Checks
- [ ] Review user feedback
- [ ] Check funnel drop-off points
- [ ] Optimize slow steps
- [ ] Update AI prompts if needed

### Monthly Checks
- [ ] Review AI costs vs revenue
- [ ] A/B test results
- [ ] Feature usage stats
- [ ] Plan conversion rates

---

## Cost Management

### OpenAI Costs
```
Average per store:
- Description: $0.006
- Taglines: $0.009
- Category: $0.006
- Logo: $0.040 (if used)
Total: $0.02 - $0.06 per store
```

### Set Budget Alerts
1. Go to OpenAI dashboard
2. Set monthly budget: $100
3. Set alert at 80%: $80
4. Set hard limit at 100%

### Monitor Usage
```typescript
// Add to analytics
track('ai_feature_used', {
  feature: 'logo_generation',
  cost: result.usage?.cost,
  tokens: result.usage?.tokens
});
```

---

## Support & Resources

### Documentation
- **Full Docs:** `STORE_BUILDER_V2_README.md`
- **Implementation:** `IMPLEMENTATION_CHECKLIST.md`
- **Flow Diagram:** `STORE_BUILDER_FLOW_DIAGRAM.md`
- **This Guide:** `QUICK_START_GUIDE.md`

### External Docs
- [OpenAI API](https://platform.openai.com/docs)
- [Google Maps API](https://developers.google.com/maps/documentation)
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)

### Get Help
- **Issues:** Create GitHub issue
- **Questions:** Ask in team chat
- **Bugs:** Report with reproduction steps

---

## Next Steps

1. ✅ Complete this quick start
2. 📖 Read `STORE_BUILDER_V2_README.md`
3. 🎨 Complete Step 2 UI (logo, colors, fonts)
4. 📍 Complete Step 3 UI (map, hours, gallery)
5. 👁️ Complete Step 4 UI (preview, legal, plans)
6. 🧪 Write tests
7. 🚀 Deploy to staging
8. 📊 Monitor metrics
9. 🔄 Iterate based on data

---

**You're ready to build! 🚀**

If you get stuck, check the docs or ask for help. Happy coding! 💻
