# TriniBuild Ads Manager - Implementation Roadmap

## 🎯 Vision
A commercial-grade AI-powered video advertising platform embedded within the TriniBuild ecosystem, enabling local businesses to create, manage, and optimize video ad campaigns with Caribbean cultural authenticity.

---

## 📊 Project Status

### ✅ PHASE 1: Foundation (COMPLETED)
- [x] Database schema design
- [x] Core data models (advertisers, campaigns, creatives, events, billing)
- [x] TypeScript service layer
- [x] AI services (script, caption, budget generation)
- [x] RLS policies for security

**Files Created:**
- `supabase/migrations/20_ads_manager_foundation.sql`
- `services/adsManagerService.ts`
- `services/adsAIService.ts`

---

## 🚀 PHASE 2: Core UI Components (NEXT)

### 2.1 Advertiser Portal Dashboard
**Components to Build:**
- `pages/AdsPortal.tsx` - Main advertiser dashboard
- `components/ads/CampaignList.tsx` - Campaign table with status
- `components/ads/KPISummary.tsx` - Key metrics cards
- `components/ads/AIRecommendationsFeed.tsx` - AI suggestions widget

**Features:**
- View all campaigns with status indicators
- Quick stats: impressions, views, CTR, spend
- Create campaign button → wizard flow
- AI recommendations sidebar

### 2.2 Campaign Creation Wizard
**Steps:**
1. **Objective Selection** - Choose campaign goal
2. **Targeting** - Locations and categories
3. **Budget & Schedule** - Daily/lifetime budget, dates
4. **Video Upload** - Integrate with watermark engine
5. **AI Creative Assistant** - Generate script/captions
6. **Preview** - See ad with watermarks
7. **Review & Launch** - Final confirmation

**Components:**
- `components/ads/CampaignWizard.tsx`
- `components/ads/steps/ObjectiveStep.tsx`
- `components/ads/steps/TargetingStep.tsx`
- `components/ads/steps/BudgetStep.tsx`
- `components/ads/steps/VideoUploadStep.tsx`
- `components/ads/steps/AIAssistStep.tsx`
- `components/ads/steps/PreviewStep.tsx`

### 2.3 Analytics Dashboard
**Components:**
- `components/ads/AnalyticsDashboard.tsx`
- `components/ads/TimeSeriesChart.tsx` - Impressions/views over time
- `components/ads/FunnelChart.tsx` - Conversion funnel
- `components/ads/PlacementPerformance.tsx` - Best placements

**Metrics:**
- Impressions, Views, Completions
- CTR, Average Watch Time
- Spend, Cost per View
- Geographic breakdown
- Device breakdown

---

## 🎨 PHASE 3: Watermark Engine

### 3.1 Video Processing Pipeline
**Tech Stack:**
- **FFmpeg.wasm** for client-side watermarking (lightweight)
- **Cloudflare Stream** or **Mux** for server-side processing (scalable)

**Features:**
- Apply TriniBuild watermark (semi-transparent logo)
- Optional vendor watermark
- Respect safe zones (CTA area, bottom bar)
- Generate HLS adaptive streaming
- Create thumbnails

**Implementation Files:**
- `services/watermarkEngine.ts` - Core watermarking logic
- `workers/videoProcessor.ts` - Background job for encoding

### 3.2 Watermark Configuration UI
- Position selector (4 corners)
- Opacity slider (10-40%)
- Preview before final upload
- Safe zone visualization

---

## 📱 PHASE 4: Video Player Integration

### 4.1 Ad-Enabled Video Player
**Features:**
- Auto-play on scroll into view
- Mute/unmute toggle
- CTA button overlay
- Event tracking (impression, play, quartiles, completion, CTA click)
- Watermark always visible

**Components:**
- `components/ads/AdVideoPlayer.tsx`
- Integration with existing TriniBuild feed

### 4.2 Ad Placements
**Inject ads into:**
- Home feed (every 5th post)
- Store directory listings
- Search results
- Vendor profile pages

**Frequency Capping:**
- Max 3 video ads per user per day per placement
- Session-based tracking

---

## 🔧 PHASE 5: Admin Moderation Tools

### 5.1 Creative Review Queue
**Admin Dashboard:**
- `pages/admin/AdModeration.tsx`
- Queue of pending creatives
- Video preview with watermark
- Approve/Reject buttons
- Policy violation reasons

**Moderation Rules:**
- No explicit content
- No misleading claims
- Watermark quality check
- Audio quality check

---

## 💳 PHASE 6: Billing & Monetization

### 6.1 Pricing Packages
**Tiers:**
1. **Boost Basic** - TTD 99 for 7 days, 3K impressions
2. **Boost Plus** - TTD 299 for 30 days, 15K impressions
3. **Smart Reach (CPM)** - TTD 45 per 1000 impressions

### 6.2 Payment Integration
- **Stripe** for credit/debit cards
- **Local gateway** for Trinidad bank transfers
- Auto-invoicing after campaign ends

**Implementation:**
- `services/billingService.ts` (already created)
- `components/ads/PaymentCheckout.tsx`
- Webhook handlers for Stripe events

---

## 📊 PHASE 7: Analytics & Reporting

### 7.1 Real-Time Metrics Aggregation
**Database Functions:**
```sql
CREATE OR REPLACE FUNCTION aggregate_campaign_metrics(campaign_id UUID)
RETURNS TABLE (...)
```

**Hourly aggregation job:**
- Sum impressions, views, clicks
- Calculate CTR, completion rate
- Update campaign spend

### 7.2 Export & Reporting
- CSV export of campaign data
- PDF invoice generation
- Email reports (weekly digest)

---

## 🤖 PHASE 8: Advanced AI Features

### 8.1 Performance Optimization AI
- Analyze which creatives perform best
- Suggest optimal budget allocation
- Recommend best posting times
- A/B test recommendations

### 8.2 Automatic Pausing
- Pause campaigns when budget exhausted
- Alert when performance drops below threshold
- Suggest creative refresh

---

## 🔒 PHASE 9: Security & Fraud Prevention

### 9.1 Fraud Detection
- IP blocklists for datacenter IPs
- Event deduplication (same session, same ms)
- Device fingerprinting
- Abnormal click spike detection

### 9.2 Rate Limiting
- Event ingest: 100 events/min per IP
- Campaign creation: 10/hour per user
- API endpoints: Standard rate limits

---

## 🚢 PHASE 10: Launch & Monitoring

### 10.1 Pre-Launch Checklist
- [ ] All migrations applied to production
- [ ] RLS policies tested
- [ ] Video upload flow end-to-end tested
- [ ] Event tracking verified with 3+ test campaigns
- [ ] Billing reconciliation verified
- [ ] Admin moderation flow tested
- [ ] Performance benchmarks met

### 10.2 Monitoring & Alerts
- **Metrics to track:**
  - Event ingest rate
  - Campaign creation rate
  - Video processing success rate
  - Payment success rate
  - API error rates

- **Alerts:**
  - Event ingest failures spike
  - Payment processing errors
  - Fraud score anomalies

---

## 📅 Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Foundation | ✅ COMPLETE | - |
| Phase 2: Core UI | 2-3 weeks | Phase 1 |
| Phase 3: Watermark Engine | 1-2 weeks | Phase 2 (video upload) |
| Phase 4: Player Integration | 1 week | Phase 3 |
| Phase 5: Admin Tools | 1 week | Phase 2 |
| Phase 6: Billing | 1-2 weeks | Phase 2 |
| Phase 7: Analytics | 1 week | Phase 4 (event data) |
| Phase 8: Advanced AI | 2 weeks | Phase 7 |
| Phase 9: Security | 1 week | Ongoing |
| Phase 10: Launch Prep | 1 week | All phases |

**Total Estimated Time: 10-14 weeks** (with 1-2 developers)

---

## 🎯 Immediate Next Steps

1. **Run the foundation migration:**
   ```bash
   # Via Supabase Dashboard:
   # Copy supabase/migrations/20_ads_manager_foundation.sql
   # Paste into SQL Editor and execute
   ```

2. **Set up Google AI API Key:**
   ```bash
   # Add to .env.local:
   VITE_GOOGLE_AI_API_KEY=your_key_here
   ```

3. **Build the Advertiser Portal Dashboard (Phase 2.1):**
   - Start with `pages/AdsPortal.tsx`
   - Create basic campaign list view
   - Add "Create Campaign" button

4. **Integrate with existing TriniBuild admin:**
   - Add "Ads Manager" menu item
   - Link to `/ads-portal` route

---

## 🤝 Team & Responsibilities

**Suggested Roles:**
- **Full-stack developer**: UI components + backend API
- **Video engineer**: Watermark pipeline + player integration
- **Data analyst**: Analytics dashboard + aggregation queries
- **QA**: End-to-end testing, fraud testing

---

## 📈 Success Metrics (First 3 Months)

- **Platform Goals:**
  - 50+ active advertisers
  - 200+ campaigns launched
  - 1M+ video impressions served
  - TTD 15,000+ revenue

- **Performance Goals:**
  - Campaign creation < 5 minutes
  - Video processing < 2 minutes
  - Event tracking latency < 500ms
  - 99.5% uptime

---

## 🔗 Integration Points with Existing TriniBuild

1. **User Authentication**: Reuse existing `auth.users` table
2. **Store Profiles**: Link `advertisers.trinibuild_store_id` to `stores` table
3. **Admin Dashboard**: Add "Ads Manager" section
4. **Main Feed**: Inject ad placements
5. **Analytics**: Share user behavior data (anonymized)

---

## 🧪 Testing Strategy

### Unit Tests
- Service layer functions
- AI prompt generation
- Watermark positioning calculations

### Integration Tests
- Campaign creation flow
- Event tracking pipeline
- Billing transaction flow

### E2E Tests
- Advertiser onboarding
- Video upload + watermark
- Analytics data accuracy
- Payment processing

---

## 📚 Documentation Needed

1. **Advertiser Guide**: How to create your first campaign
2. **API Reference**: For headless integrations
3. **Admin Manual**: Moderation best practices
4. **Watermark Guidelines**: Brand standards

---

## 🎉 Launch Plan

### Soft Launch (Beta)
- Invite 10 existing TriniBuild vendors
- Free credits for first campaigns
- Gather feedback, iterate quickly

### Public Launch
- Announcement on TriniBuild homepage
- Email blast to all vendors
- Social media campaign
- Press release

### Post-Launch
- Weekly check-ins with advertisers
- Monitor metrics dashboard
- Release AI improvements monthly
- Scale to meet demand

---

**Created:** 2024-12-03  
**Last Updated:** 2024-12-03  
**Status:** Phase 1 Complete ✅ | Ready for Phase 2 🚀
