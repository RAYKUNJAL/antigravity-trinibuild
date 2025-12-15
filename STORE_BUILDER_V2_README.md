# TriniBuild Store Builder V2.0 - Complete Documentation

## 🚀 Overview

The TriniBuild Store Builder V2.0 is a complete rebuild featuring AI-powered tools, social media import, and a streamlined 5-step wizard that gets businesses online in under 5 minutes.

## 📁 New Files Created

### 1. Configuration
- **`config/storeBuilderConfig.json`** - Complete wizard configuration with all steps, validation rules, AI settings, and integrations

### 2. Services
- **`services/aiService.ts`** - AI service for generating logos, descriptions, taglines, color palettes, and category detection
- **`services/socialImportService.ts`** - Service for importing business data from Instagram, Facebook, TikTok, and Twitter

### 3. Components
- **`pages/StoreCreatorV2.tsx`** - New optimized store creator component with 5-step wizard

## 🎯 Key Features

### Step 0: Quick Start
**Duration: 30 seconds - 5 minutes**

#### Social Media Import (⚡ 30 seconds)
- Import from Instagram, Facebook, TikTok, or Twitter
- Auto-extracts:
  - Business name
  - Description
  - Category (AI-detected)
  - Profile image
  - Gallery images
  - Follower count
  - Business vibe/tags
  - Dominant colors

#### Manual Entry (📝 5 minutes)
- Traditional form-based entry
- Skip social import entirely

**Features:**
- Platform selection (Instagram, Facebook, TikTok)
- URL validation
- Web scraping with fallback
- AI enhancement of scraped data
- Error recovery with manual fallback

---

### Step 1: Business Basics
**Duration: 90 seconds**

#### Fields:
1. **Business Name** (Required)
   - Min 2 characters, max 100
   - Real-time validation
   - Uniqueness check
   - Profanity filter
   - Blacklist check
   - AI name suggestions based on category

2. **Category** (Required)
   - 60+ Trinidad-specific categories
   - 8 category groups:
     - Food & Dining (11 options)
     - Retail & Shopping (13 options)
     - Skilled Trades (9 options)
     - Personal Services (6 options)
     - Professional Services (7 options)
     - Events & Entertainment (6 options)
     - Agriculture & Production (5 options)
     - Other
   - Searchable dropdown
   - AI category detection from business name
   - Visual icons for each category

3. **Tagline** (Optional)
   - Max 60 characters
   - AI-generated suggestions (5 options)
   - Multiple tone options:
     - Professional
     - Casual
     - Playful
     - Traditional

**AI Features:**
- Smart category suggestions based on business name
- Tagline generation with multiple tones
- Business name availability check
- Domain and social handle checking

---

### Step 2: Design & Branding
**Duration: 120 seconds**

#### Logo Options:
1. **Upload Logo**
   - Max 5MB
   - Formats: JPG, PNG, SVG, WebP
   - Auto-crop to 1:1 ratio
   - Auto-optimize for web

2. **AI Logo Generation** (DALL-E 3)
   - 5 style options:
     - Modern & Clean
     - Traditional Trini
     - Fun & Playful
     - Elegant & Premium
     - Bold & Vibrant
   - Generate 4 variations per style
   - Regenerate unlimited times
   - Edit prompt capability
   - 1024x1024px high quality

3. **Category Templates**
   - 10 pre-designed templates per category
   - Fully customizable
   - Professional quality

#### Color Scheme:
1. **AI-Generated Palettes**
   - 8 palettes based on:
     - Business category
     - Logo colors
     - Business vibe
     - Social media images
   - Accessibility-checked (WCAG AA)
   - Color harmony algorithm

2. **Preset Palettes**
   - Carnival Vibes
   - Ocean Breeze
   - Sunset Glow
   - Forest Green
   - Elegant Black & Gold

3. **Custom Palette**
   - Advanced color picker
   - Harmony suggestions
   - Contrast validation
   - Accessibility warnings

#### Typography:
1. **Preset Font Pairs**
   - Modern & Clean (Inter)
   - Elegant Serif (Playfair Display + Lato)
   - Bold Impact (Montserrat + Open Sans)
   - Friendly & Casual (Poppins + Nunito)
   - Professional (Roboto)

2. **Google Fonts Library**
   - 1000+ fonts
   - Searchable
   - Live preview
   - Custom preview text

#### Business Vibe Tags (Optional):
- Traditional
- Modern
- Family Friendly
- Upscale
- Casual
- Fast Service
- Authentic
- Innovative
- Eco-Friendly
- Local

**Live Preview:**
- Updates in real-time (500ms debounce)
- Desktop and mobile views
- Logo placement preview

---

### Step 3: Store Details
**Duration: 180 seconds**

#### Business Description (Required)
- Min 50 characters, max 500
- Character counter
- AI generation with options:
  - **Tones:** Professional, Friendly, Casual, Enthusiastic
  - **Lengths:** Short (50-100 words), Medium (100-200), Long (200-300)
  - SEO-optimized
  - Keyword suggestions
- AI improvement suggestions:
  - Clarity
  - SEO
  - Engagement
  - Grammar

#### WhatsApp Number (Required)
- Trinidad format: 1868XXXXXXX
- Auto-formatting: +1 (868) XXX-XXXX
- SMS verification:
  - 6-digit code
  - 10-minute expiry
  - 3 retry limit
  - 60-second cooldown
  - Alternative: Voice call
- **Deferred verification** (can verify later)
- Duplicate check
- WhatsApp active check

#### Location (Required)
1. **Address Fields:**
   - Street (optional)
   - Area (required) - Autocomplete with 30+ areas
   - Region (required) - 14 regions

2. **Map Picker:**
   - Google Maps integration
   - Draggable marker
   - Search enabled
   - Auto-detect location
   - Default: Trinidad center

#### Operating Hours (Required)
1. **Quick Presets:**
   - Mon-Fri (9am-5pm)
   - Mon-Sat (8am-6pm)
   - Every Day (24 Hours)

2. **Custom Schedule:**
   - Per-day configuration
   - Multiple shifts per day
   - Closed days
   - 12h or 24h format
   - 30-minute intervals

3. **Special Hours:**
   - Holidays
   - Temporary closures

#### Service Options (Required)
- **Pickup** (default)
- **Delivery:**
  - Delivery areas (multi-select)
  - Delivery fee (TTD)
  - Free delivery minimum
- **Dine In** (restaurants only)
- **Curbside Pickup**

#### Payment Methods (Required)
- Cash (default)
- Linx
- Bank Transfer
- Online Payment
- Mobile Wallet

#### Gallery Images (Optional)
- Max 10 images
- Max 5MB each
- Formats: JPG, PNG, WebP
- Auto-optimize
- Smart crop
- AI enhancement
- Quality check

#### Social Links (Optional)
- Instagram
- Facebook
- TikTok
- Twitter/X

---

### Step 4: Preview & Launch
**Duration: 120 seconds**

#### Live Preview
- **Device Views:**
  - Desktop
  - Tablet
  - Mobile (default)
- Interactive preview
- Shareable preview link (48h expiry)
- Real-time updates

#### Verification Checklist
- ✅ WhatsApp number verified
- ✅ Business information complete
- ✅ Branding and design set
- ✅ Preview reviewed (manual)

#### Legal Documents
1. **Terms of Service** (required)
2. **Merchant Agreement** (required)
3. **Privacy Policy** (optional)

**Digital Signature:**
- Captures IP address
- Timestamp
- User agent
- Legally binding

#### Payment Plans

**Free Starter** (TT$0/forever)
- Basic store page
- WhatsApp integration
- Up to 20 products
- Basic analytics
- TriniBuild branding
- Standard support

**Pro** (TT$199/month) ⭐ RECOMMENDED
- 14-day free trial
- Everything in Free
- Unlimited products
- Custom domain
- Advanced analytics
- No TriniBuild branding
- Priority support
- Marketing tools
- Discount codes

**Enterprise** (TT$499/month)
- Everything in Pro
- Multi-location support
- API access
- Dedicated account manager
- Custom integrations
- Advanced inventory management
- White-label option
- Contact sales

#### Launch Options
1. **Publish Now** - Go live immediately
2. **Save as Draft** - Publish later
3. **Schedule Launch** - Choose date/time (up to 30 days)

---

## 🤖 AI Integrations

### OpenAI GPT-4 Turbo
**Use Cases:**
- Business description generation
- Tagline creation
- Category detection
- Content improvement
- Keyword suggestions

**Configuration:**
- Model: `gpt-4-turbo`
- Temperature: 0.7 (creative) to 0.3 (precise)
- Max tokens: 150-1000 depending on task
- Cost tracking per request

### OpenAI DALL-E 3
**Use Cases:**
- Logo generation
- Product image generation (future)

**Configuration:**
- Model: `dall-e-3`
- Size: 1024x1024
- Quality: Standard
- Style: Vivid
- Cost: $0.04 per image

### Fallback Behavior
- Mock data for development
- Graceful degradation
- Error recovery
- Manual entry always available

---

## 🔒 Security Features

### Input Validation
- XSS protection
- SQL injection prevention
- CSRF tokens
- Input sanitization

### Rate Limiting
- 100 requests/hour per user
- 10 social imports/day
- 50 AI generations/session
- 3 SMS retries

### Data Protection
- AES-256 encryption at rest
- TLS encryption in transit
- PII anonymization in analytics
- GDPR compliant
- 365-day data retention

### Authentication
- Supabase Auth integration
- Session management
- Secure token storage
- Auto-logout on inactivity

---

## 📊 Analytics & Tracking

### Events Tracked:
- wizard_started
- step_completed
- step_abandoned
- field_changed
- social_import_attempted
- social_import_success
- social_import_failed
- ai_feature_used
- logo_generated
- description_generated
- preview_viewed
- preview_shared
- draft_saved
- store_published
- wizard_abandoned
- payment_plan_selected

### Metrics:
- Completion rate
- Time per step
- Total time
- Category distribution
- Social import success rate
- AI feature usage rate
- Plan selection distribution
- Abandonment points
- Device distribution

### Integrations:
- Google Analytics
- Mixpanel
- Hotjar (optional)

---

## 💾 Auto-Save & Recovery

### Auto-Save
- Every 10 seconds
- Cloud backup every 30 seconds
- 30-day retention
- Session recovery
- Draft restoration

### Error Recovery
- Social import fallback to manual
- SMS retry with cooldown
- AI generation retry
- Session timeout warnings (5 min before)
- Graceful degradation

---

## 🎨 Design System

### Colors
- Primary: #DC2626 (Trini Red)
- Secondary: #F59E0B (Gold)
- Accent: #10B981 (Green)
- Background: #FFFFFF
- Text: #1F2937

### Typography
- Headings: Inter (Bold)
- Body: Inter (Regular)
- Sizes: 14px - 48px

### Spacing
- Base: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64

### Animations
- Duration: 200ms - 700ms
- Easing: ease-out, ease-in-out
- Micro-interactions on all buttons

---

## 🚀 Performance Targets

### Load Times
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

### Optimizations
- Lazy loading
- Image optimization
- Code splitting
- CDN enabled
- Debounced inputs (500ms - 2s)

---

## 📱 Mobile Optimization

### Features
- Responsive breakpoints: 320px, 768px, 1024px, 1440px
- Touch-optimized buttons (min 44x44px)
- Camera integration for photos
- Geolocation for map
- WhatsApp deep linking
- Offline support (PWA)

### Accessibility
- WCAG AA compliant
- Screen reader optimized
- Keyboard navigation
- High contrast mode
- Focus indicators
- ARIA labels

---

## 🔧 Configuration

### Environment Variables
```env
VITE_OPENAI_API_KEY=sk-...
VITE_GOOGLE_MAPS_API_KEY=AIza...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Feature Flags
All features can be toggled in `storeBuilderConfig.json`:
- Social import enabled
- AI generation enabled
- WhatsApp verification required
- Auto-save enabled
- Analytics tracking

---

## 📝 Usage

### Basic Implementation

```tsx
import { StoreCreatorV2 } from './pages/StoreCreatorV2';

function App() {
  return <StoreCreatorV2 />;
}
```

### With Claim Parameters

```
/create-store?claim_name=Aunty%20May's%20Roti&claim_address=123%20Main%20St
```

### Draft Recovery

Drafts are automatically saved to `localStorage` and restored on page load.

---

## 🐛 Error Handling

### User-Facing Errors
- Inline validation messages
- Toast notifications
- Error recovery suggestions
- Help text and hints

### Developer Errors
- Console logging
- Error boundaries
- Sentry integration (optional)
- Detailed error messages

---

## 🔄 Migration from V1

### Differences
1. **5 steps instead of 6** - Streamlined flow
2. **AI-first approach** - AI features prominent
3. **Social import** - New capability
4. **Better validation** - Real-time, inline
5. **Auto-save** - Every 10 seconds
6. **Mobile-first** - Optimized for mobile

### Breaking Changes
- New data structure for `formData`
- Different step numbering
- New services required (`aiService`, `socialImportService`)

### Migration Path
1. Keep existing `StoreCreator.tsx` as fallback
2. Test `StoreCreatorV2.tsx` with feature flag
3. Gradually migrate users
4. Deprecate V1 after 30 days

---

## 🎯 Success Metrics

### Target KPIs
- **Completion Rate:** > 70%
- **Average Time:** < 5 minutes
- **Social Import Usage:** > 40%
- **AI Feature Usage:** > 60%
- **Mobile Completion:** > 50%
- **Pro Plan Conversion:** > 15%

### A/B Testing
Built-in support for testing:
- Social import placement
- Step count (3, 4, or 5 steps)
- Verification timing
- AI feature prominence

---

## 🛠️ Development

### Local Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Test
```bash
npm run test
```

---

## 📚 API Documentation

### AI Service

```typescript
// Generate description
const result = await aiService.generateDescription({
  businessName: 'Aunty May\'s Roti',
  category: 'roti_shop',
  tagline: 'Best Roti in South',
  vibe: ['traditional', 'family_friendly']
}, {
  tone: 'professional',
  length: 'medium'
});

// Generate logo
const logo = await aiService.generateLogo({
  businessName: 'Aunty May\'s Roti',
  category: 'roti_shop'
}, 'traditional');

// Generate taglines
const taglines = await aiService.generateTaglines({
  businessName: 'Aunty May\'s Roti',
  category: 'roti_shop'
}, 5);
```

### Social Import Service

```typescript
// Import from Instagram
const result = await socialImportService.importFromUrl(
  'https://instagram.com/auntymaysroti'
);

if (result.success) {
  console.log(result.data);
  // { businessName, description, category, images, ... }
}
```

---

## 🎉 Next Steps

### Phase 2 Features (Future)
1. **Product Management**
   - Bulk product upload
   - AI product descriptions
   - Inventory tracking

2. **Advanced Customization**
   - Custom CSS
   - Layout templates
   - Widget library

3. **Marketing Tools**
   - Email campaigns
   - SMS marketing
   - Social media scheduling

4. **Analytics Dashboard**
   - Real-time visitors
   - Conversion tracking
   - Customer insights

5. **Integrations**
   - Payment gateways
   - Shipping providers
   - Accounting software

---

## 📞 Support

For issues or questions:
- Email: support@trinibuild.com
- Docs: https://docs.trinibuild.com
- Community: https://community.trinibuild.com

---

## 📄 License

Proprietary - TriniBuild © 2024

---

**Built with ❤️ for Trinidad & Tobago businesses**
