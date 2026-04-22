# 🚀 TriniBuild CRO Landing Page Launch Checklist

**Status**: READY FOR LAUNCH  
**Date**: April 22, 2026  
**Target Launch**: Within 24 hours  
**First Campaign Budget**: TT$1,500/week

---

## Pre-Launch: Technical Setup (TODAY)

### ✅ Landing Page
- [x] LandingPageCRO.tsx built (701 lines)
- [x] Route added to App.tsx (`/landing`)
- [x] WhatsApp icon fixed
- [x] Mobile responsive tested
- [x] SEO optimized (keywords, meta tags, OG)
- [x] A/B testing variants ready
- [x] Analytics integrated (GA4 + Facebook Pixel)
- [x] Deployed to trinibuild.com/landing ✅

### ✅ Analytics
- [x] GA4AnalyticsService created (250+ lines)
  - Events: signup_start, signup_complete, store_created, first_order, pro_upgrade
  - Tracking: page_view, scroll_depth, button_click, form_complete
  - A/B test variant tracking
- [x] FacebookPixelService created (200+ lines)
  - Retargeting audience setup
  - Standard events (PageView, Lead, CompleteRegistration, Purchase)
  - Custom event tracking
- [x] ABTestingService created (400+ lines)
  - Variant assignment (localStorage persistence)
  - Statistical significance calculator
  - 12-week test roadmap
  - Week 1-4 foundation tests ready

### ✅ Documentation
- [x] AD_CAMPAIGN_GUIDE.md (1,200+ lines)
  - 3 Facebook audience segments
  - 5 ad creative templates
  - Google Search keyword strategy
  - Weekly optimization checklist
  - Success metrics + month-by-month projections

---

## Launch Day Checklist

### BEFORE GOING LIVE (Morning)
- [ ] **Verify Landing Page**: Visit https://trinibuild.com/landing
  - Hero section visible
  - All buttons clickable
  - Mobile responsive
  - Images loading
  - No console errors (check DevTools)

- [ ] **Test A/B Variants**: 
  - Open in incognito window
  - Should see random variant assignment
  - localStorage should have `ab_test_variant` key
  - Refresh → should show same variant

- [ ] **Test Analytics Tracking**:
  - Open DevTools → Network tab
  - Look for GA4 requests (google-analytics.com)
  - Look for Facebook Pixel requests
  - Scroll down page → should see scroll_depth events
  - Click CTA button → should see button_click events

- [ ] **GA4 Setup** (if not done):
  - Go to https://analytics.google.com
  - Create new GA4 property
  - Get GA4 ID (format: `G-XXXXXXXXXX`)
  - Add to .env: `VITE_GA4_ID=G-XXXXXXXXXX`
  - Redeploy to Vercel

- [ ] **Facebook Pixel Setup** (if not done):
  - Go to https://business.facebook.com/
  - Create Pixel (if not exists) or use existing
  - Get Pixel ID
  - Add to .env: `VITE_FACEBOOK_PIXEL_ID=1234567890123456`
  - Redeploy to Vercel

- [ ] **SSL/TLS Certificate**: Check padlock in browser
  - Should show HTTPS
  - No mixed content warnings

- [ ] **Domain Alias**: Verify both work
  - https://trinibuild.com/landing ✅
  - https://www.trinibuild.com/landing ✅

### LAUNCH: Go Live (Afternoon)
- [ ] **Create Facebook Ad Account** (if new):
  - Go to facebook.com/ads/manager
  - Set up Business Manager
  - Connect Instagram Business profile
  - Create first campaign (see AD_CAMPAIGN_GUIDE.md)

- [ ] **Create Google Ads Campaign** (if new):
  - Go to google.com/ads
  - Create new campaign
  - Set up conversion tracking
  - Create first ads (keywords: "online store Trinidad", etc.)

- [ ] **Launch Campaign 1: Awareness**
  - Budget: TT$500/week (Facebook)
  - Audience: Segment 1 + 2
  - Creative: Problem-Solution + No Barriers
  - Landing: /landing (no variant parameter)
  - Start time: Post 2 PM (afternoon engagement peak)

- [ ] **Launch Campaign 2: Search**
  - Budget: TT$500/week (Google)
  - Keywords: Tier 1 (exact match)
  - Bid: TT$3-5 CPC target
  - Landing: /landing
  - Quality Score target: 7+

- [ ] **Launch Retargeting**
  - Budget: TT$300/week
  - Audience: All visitors to /landing
  - Creative: Social proof + testimonial
  - Duration: 14 days
  - Frequency: 5x per week

- [ ] **Post Launch Announcement**:
  - WhatsApp status: "Merchants: Build your free store. 10 products free. No credit card."
  - Facebook post: Link + merchant stories
  - Reach: Friends, existing merchants, networks

### LAUNCH + 24 Hours (Next Day)
- [ ] **Check Ad Performance**:
  - Facebook Ads Manager: Check impressions, clicks, CTR
  - Expected CTR: 1-2%
  - Expected CPC: TT$5-10 (Week 1)
  - Expected CVR: 5% (Week 1)

- [ ] **Check GA4 Dashboard**:
  - Landing page users: Should see 500+ for first 24 hours
  - signup_start events: Should see 20-50
  - signup_complete events: Should see 3-10
  - Scroll depth: Should see 25%, 50%, 75% events

- [ ] **Check Facebook Pixel**:
  - Pixel Dashboard → Events: Should see PageView events
  - Audience size: Should start building

- [ ] **Quick Feedback Round**:
  - Send to 5-10 test merchants
  - Ask: "Would you use this?"
  - Collect objections/feedback
  - Update FAQ if needed

- [ ] **Monitor Support Channels**:
  - WhatsApp: Monitor for questions
  - Email: Check inbox for inquiries
  - Slack: Set up channel for real-time alerts

---

## Week 1 Launch Goals

### Traffic
- [ ] **1,000 visitors** to /landing
  - Target: 500 from Facebook, 500 from Google
  - If below: Check ad spend, increase budget
  - If above: Great! Scale ads

- [ ] **CTR > 1.5%**
  - Facebook expected: 2-3%
  - Google expected: 2-4%
  - If below: Check ad copy, test new creative

### Signups
- [ ] **75 signup attempts** (signup_start events)
  - From 1,000 visitors = 7.5% CTR on "Start Free" button ✅
  - If below 5%: Hero CTA not compelling → test copy

- [ ] **10-15 store completions** (signup_complete events)
  - From 75 signups = 13-20% completion rate
  - If below 10%: Onboarding too complicated → simplify

### Costs
- [ ] **CAC < TT$40**
  - TT$500 spend / 15 signups = TT$33 each ✅
  - This is Week 1, can be higher
  - Target: < TT$25 by Week 4

### Quality Signals
- [ ] **Scroll depth > 50%**
  - Users scrolling past hero (good signal)
  - If < 30%: Hero not compelling → redesign

- [ ] **No errors in GA4**
  - Events firing correctly
  - No data loss

- [ ] **No errors in Facebook Pixel**
  - Pixel firing
  - Events tracked

---

## Week 2-4 Optimization

### Performance Targets
- [ ] **Impressions**: 5,000-10,000
- [ ] **Clicks**: 100-200
- [ ] **CTR**: 1.5-2%
- [ ] **CPC**: TT$2-5
- [ ] **Signups**: 75-120
- [ ] **CVR (clicks → signups)**: 10-15%
- [ ] **CAC**: TT$25-35

### Creative Testing
- [ ] **Pause low performers** (< 1% CTR)
- [ ] **Scale winners** (> 2% CTR) + 50% budget
- [ ] **A/B test headlines**:
  - Control: "Sell Online with COD"
  - Test A: "Get Your Free Store in 5 Minutes"
  - Run 50/50 split, measure CVR
  - Winner gets full budget by Week 4

- [ ] **A/B test CTA buttons**:
  - Control: Red (#E61E2B)
  - Test A: Neon Green (#00FF00)
  - Measure click-through rate
  - Winner gets 100% by Week 4

### Audience Testing
- [ ] **Test lookalike audience**
  - Create 1% lookalike of existing signups
  - Budget: TT$100/week
  - Compare CTR to seed audience

- [ ] **Expand geographic targeting**
  - Start: All Trinidad & Tobago
  - Week 3: Consider San Fernando + Port of Spain focus
  - Measure CVR by region

### Retargeting
- [ ] **Launch page visitor retargeting**
  - Audience: All /landing visitors (last 7 days)
  - Message: Remove objections
  - Creative: "No credit card, takes 5 min"
  - Frequency: 3-5x/week
  - Budget: TT$150/week

---

## Week 5-8 Growth Phase

### Scaling
- [ ] **Increase ad budget**:
  - If CAC < TT$25: Increase to TT$2,000/week
  - If ROI > 2:1: Increase further
  - If CAC > TT$40: Hold or reduce, optimize

- [ ] **Expand to Segment 3** (Digital Entrepreneurs)
  - Budget: TT$300/week
  - Message: "Side hustle" + passive income
  - Creative: Success story videos

- [ ] **Increase video creative**
  - Commission 3-5 testimonial videos
  - 30-60 seconds each
  - Real merchants telling story + results
  - Cost: TT$500-1,000 per video
  - ROI: 10-20x expected

### Data-Driven Decisions
- [ ] **Review GA4 funnel**:
  - landing_page_view → signup_start → signup_complete → store_created
  - Where do users drop off?
  - Fix bottlenecks

- [ ] **Analyze best-performing audiences**:
  - Segment 1 or 2? Create lookalike of winner
  - Location? Double down on high-CVR areas
  - Age range? Expand or narrow

- [ ] **Review cohort analysis**:
  - Week 1 signups: How many created stores?
  - Week 2 signups: Faster? Slower?
  - Trend: Improving or declining?

---

## Week 9-12 Optimization Phase

### Final Scaling
- [ ] **Consolidate on winners**
  - Pause all low-performing creatives
  - Focus 70% budget on top 3 creatives
  - 30% budget on testing

- [ ] **Launch holiday campaign** (if applicable)
  - Messaging: "Earn TT$ this season"
  - Creative: Holiday sales success stories
  - Timing: Adjust for Carnival season

- [ ] **Create lookalike audiences**
  - From: People who created stores
  - Size: 1%, 2%, 5%
  - Test each against seed audience

### Final Metrics
- [ ] **CAC target: TT$18-20**
  - Should be lowest by week 12
  - If not achieved: Extend testing

- [ ] **CVR target: 12-15%**
  - clicks → signups
  - If below 10%: Landing page optimization needed

- [ ] **Merchant quality: Retention rate**
  - Track: How many create stores?
  - Track: How many add products?
  - Track: How many get first order?
  - Goal: 30% of signups → first order

---

## Month 2-3 Planning

### Based on Month 1 Data
- [ ] **Determine scaling budget**:
  - If ROAS > 3:1: Can increase to TT$3,000/week
  - If ROAS 2-3:1: Increase to TT$2,000/week
  - If ROAS < 2:1: Optimize more before scaling

- [ ] **Plan creative refresh**
  - Audiences get ad fatigue after 3-4 weeks
  - Create 5-10 new creatives
  - Test new messages

- [ ] **Plan product improvements**
  - Collect merchant feedback
  - Fix pain points
  - Add features that reduce drop-off

- [ ] **Plan content strategy**
  - Blog posts (SEO)
  - Case studies (credibility)
  - Merchant interviews (social proof)

---

## Success Metrics Summary

### End of Week 1
- [ ] 1,000 landing page visitors
- [ ] 75+ signups (sign up initiated)
- [ ] 15+ stores created
- [ ] CAC < TT$40

### End of Week 4
- [ ] 4,000 landing page visitors
- [ ] 240+ signups
- [ ] 50+ stores created
- [ ] CAC < TT$25 ✅

### End of Week 8
- [ ] 8,000 landing page visitors
- [ ] 480+ signups
- [ ] 150+ active stores
- [ ] CAC < TT$23
- [ ] ROAS > 2.5:1

### End of Week 12
- [ ] 12,000+ landing page visitors
- [ ] 780+ signups
- [ ] 300+ active stores
- [ ] CAC < TT$20
- [ ] ROAS > 3:1
- [ ] TT$18,000 invested
- [ ] Estimated revenue: TT$25,000+ (subscriptions + COD commissions)

---

## Critical Success Factors

### 1. **Speed to Market**
- Launch today, not tomorrow
- Imperfect early > perfect late
- Learn from real users, not assumptions

### 2. **Mobile First**
- 60% of traffic is mobile
- Test on real phone (not desktop)
- Fast loading is critical (< 3s)

### 3. **Messaging Clarity**
- "COD" is your unfair advantage
- "No credit card" removes top objection
- "5 minutes" proves simplicity

### 4. **Daily Monitoring**
- Check GA4 every morning
- Check ad metrics daily (impressions, CTR, CPC)
- Pause underperformers immediately

### 5. **Weekly Optimization**
- Test, measure, learn, scale
- Don't wait for perfection
- Iterate based on data

---

## Risks & Mitigation

### Risk 1: Low Signup Rate (< 5%)
**Signal**: Few people clicking "Start My Free Store"  
**Cause**: Hero CTA not compelling or visible  
**Fix**:
- A/B test button color (red vs green)
- A/B test button text ("Start Free" vs "Create Store")
- A/B test hero copy (test "Get Your Free Store in 5 Minutes")
- Check mobile: Is button visible above fold?

### Risk 2: High Signup Drop-off (< 10% completion)
**Signal**: Clicks "Start" but don't finish store creation  
**Cause**: Onboarding too complicated  
**Fix**:
- Simplify signup form (3 fields → 2 fields)
- Add progress indicator
- Reduce required info at signup time
- Ask for email/location only
- Save category + products for later

### Risk 3: High Ad Costs (> TT$40 CAC)
**Signal**: Spending TT$500 but only getting 12 signups  
**Cause**: Wrong audience, weak creative, or poor landing page  
**Fix**:
- Pause high-cost audiences
- Test new audience segments
- Test new ad creatives
- Check landing page loading speed
- Ensure GA4 conversion tracking works

### Risk 4: No Orders from New Merchants
**Signal**: Stores created but no first orders  
**Cause**: Merchants not adding products or products not discoverable  
**Fix**:
- Improve product listing tutorial
- Auto-fill sample products on signup
- Send email: "Your store is live! Here's how to add products"
- AI product lister (ready!)

---

## Daily Standup Questions

**Every Day for Week 1-2:**
1. How many visitors landed on /landing?
2. How many clicked "Start My Free Store"?
3. How many completed store signup?
4. What's the CAC so far?
5. Any errors in GA4 or Pixel?
6. Which ad is getting best CTR?
7. Which audience segment converts best?

**Every Day for Week 3-12:**
1. Did we hit CAC target < TT$25?
2. Did any ad underperform (pause)?
3. Did any ad overperform (scale)?
4. What's today's ROAS?
5. How many stores created?
6. How many stores with products?
7. Any first orders?

---

## Communication Plan

### Announce to Team
- [ ] Slack #launch channel post (with landing URL)
- [ ] Email: Ray + team with timeline
- [ ] Calendar invite: Weekly sync meetings
- [ ] Shared dashboard: Live GA4 metrics

### Announce to Customers
- [ ] WhatsApp: "TriniBuild launches today! Build your free store: [link]"
- [ ] Facebook: Post with 3 merchant stories
- [ ] Instagram: Stories + Reels
- [ ] Email: Existing users about new landing page

---

## Go-Live Checklist (FINAL)

- [ ] Landing page loads without errors
- [ ] A/B testing working (variant assignment)
- [ ] GA4 events firing
- [ ] Facebook Pixel firing
- [ ] Ad accounts created (Facebook + Google)
- [ ] First campaign created (Awareness)
- [ ] Budget allocated (TT$1,500/week)
- [ ] Ads approved by platform
- [ ] Ads published (go live 2 PM or evening)
- [ ] Monitor for 1 hour (CTR, impressions, clicks)
- [ ] First feedback collected
- [ ] Celebrate 🎉

---

## Success Celebration Milestones

🎯 **When**: 100 signups  
🎉 **Action**: Post update in team Slack

🎯 **When**: 1st merchant creates store  
🎉 **Action**: Save screenshot, thank in WhatsApp

🎯 **When**: 1st order placed  
🎉 **Action**: Email merchant, screenshot for social proof

🎯 **When**: CAC drops to TT$25  
🎉 **Action**: Double the budget, celebrate with team

🎯 **When**: 300 merchants created  
🎉 **Action**: Big company announcement, increase budget

---

**Last Updated**: April 22, 2026  
**Status**: READY TO LAUNCH  
**Next Step**: Execute Week 1 checklist above  

Good luck! 🚀🇹🇹
