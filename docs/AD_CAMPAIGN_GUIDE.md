# 🎯 TriniBuild Ad Campaign Management Guide

## Campaign Strategy Overview

**Goal**: Drive cold traffic to `/landing` at < TT$25 cost per signup  
**Timeline**: 12 weeks  
**Budget**: TT$1,500/week (TT$18,000 total year 1)  
**Target**: 12,000 signups → 3,000 stores → 300 active merchants by month 12

---

## Facebook & Instagram Ads

### Audience Segments

#### Segment 1: Existing Business Owners (Primary)
- **Location**: Trinidad & Tobago
- **Age**: 25-55
- **Interests**: Small Business, Entrepreneurship, Online Marketing, E-commerce, SME
- **Behaviors**: Own/manage business, Online shopper, Mobile device user
- **Lookalike**: 1% lookalike of existing customers
- **Estimated Size**: 50,000-100,000 people
- **Expected CTR**: 2-4%
- **Expected Conversion Rate**: 8-12% (signup → store completion)

#### Segment 2: Online Sellers (High Intent)
- **Location**: Trinidad & Tobago
- **Age**: 20-50
- **Interests**: Social Selling, WhatsApp Business, Online Marketing, Dropshipping
- **Keywords**: "WhatsApp selling", "online business", "sell online Trinidad"
- **Lookalike**: Marketplace sellers, Instagram shop owners
- **Estimated Size**: 30,000-50,000 people
- **Expected CTR**: 3-6%
- **Expected Conversion Rate**: 10-15%

#### Segment 3: Digital Entrepreneurs (Growth)
- **Location**: Trinidad & Tobago
- **Age**: 18-40
- **Interests**: Side Hustle, Passive Income, Digital Marketing, Tech Startup
- **Behaviors**: Instagram active, frequent mobile user
- **Estimated Size**: 100,000+ people
- **Expected CTR**: 1-2%
- **Expected Conversion Rate**: 5-8%

### Ad Creative Strategy

#### Creative 1: Problem-Solution (15s Video)
```
HOOK: "Tired of selling just on WhatsApp?"
PROBLEM: "You're leaving money on the table"
SOLUTION: "TriniBuild lets you sell online with cash on delivery"
CTA: "Start Your Free Store"
Platform: Feed, Reels, Stories
Frequency: 5-7 days
```

#### Creative 2: Social Proof (Carousel)
```
Card 1: "5,000+ T&T businesses online"
Card 2: "Chaguanas boutique: TT$8,000/week"
Card 3: "San Fernando electronics: 47 orders month 1"
Card 4: "Port of Spain business: +TT$15,000/month"
Card 5: CTA: "Create Your Store Free"
```

#### Creative 3: Quick Demo (30s Video)
```
SCENE 1: "Create store in 5 minutes"
SCENE 2: "Add products with AI"
SCENE 3: "Get orders on WhatsApp"
SCENE 4: "Collect cash on delivery"
CTA: "Join 5,000+ Businesses"
```

#### Creative 4: No Barriers (Static Image)
```
Headline: "Free Online Store. No Credit Card. No Fees."
Image: Phone with TriniBuild app, T&T flag
Body: "Start selling with COD in 5 minutes"
CTA: "Get Started Free"
```

#### Creative 5: Testimonial (15-30s Video)
```
SPEAKER: Real merchant (Chaguanas boutique owner)
QUOTE: "I was selling on WhatsApp making TT$2,000/week. 
        Now with TriniBuild and COD, I'm at TT$8,000/week."
TIME: "2 months"
CTA: "See How Others Are Earning More"
```

### Campaign Setup

#### Campaign 1: Awareness (Weeks 1-2)
- **Budget**: TT$500/week
- **Objective**: Traffic (website clicks)
- **Audience**: Segment 1 + 2 (Existing + Online Sellers)
- **Placements**: Feed, Reels, Stories, Audience Network
- **Creative**: #1 (Problem-Solution), #4 (No Barriers)
- **Landing Page**: `/landing` (default variant)
- **KPI**: CTR > 2%, CPC < TT$3

#### Campaign 2: Consideration (Weeks 3-8)
- **Budget**: TT$1,000/week
- **Objective**: Traffic + Lead Gen (email capture)
- **Audience**: Site visitors (retarget), Segment 1, Segment 2
- **Creatives**: #2 (Social Proof), #3 (Demo), #5 (Testimonial)
- **A/B Test**: Headlines ("Free Store" vs "5 Min Setup")
- **Landing Page**: `/landing?v=a` or `/landing?v=b` (A/B variant)
- **KPI**: CTR > 3%, CVR > 10%, CPC < TT$5, CAC < TT$25

#### Campaign 3: Conversion (Weeks 9-12)
- **Budget**: TT$1,500/week
- **Objective**: Conversions (app installs or lead gen)
- **Audience**: Warm audiences, Segment 3 (Lookalikes), Retargeting
- **Creatives**: Best performer from weeks 3-8
- **Messaging**: Urgency ("Join 5,000+"), Success ("TT$8,000/week")
- **Landing Page**: `/landing` (winning variant)
- **KPI**: CVR > 12%, ROAS > 3:1

### Facebook Pixel Events to Track
```
1. PageView - Landing page view
2. ViewContent - Hero section viewed
3. Lead - Email captured
4. AddToCart - Signup button clicked
5. Checkout - Store creation started
6. Purchase - Store creation completed
7. Subscribe - Pro upgrade
```

### Audience Exclusions
- Existing TriniBuild users
- Current competitors (Shopify, WooCommerce)
- People who clicked but didn't convert (retarget with different message)

---

## Google Search Ads

### High-Intent Keywords (Exact Match)

#### Tier 1: Direct (TT$50-100/click)
```
- "online store Trinidad"
- "sell online Trinidad"
- "COD Trinidad"
- "free online store T&T"
- "TriniBuild"
```

#### Tier 2: Alternative (TT$20-50/click)
```
- "business online Trinidad"
- "start online business T&T"
- "WhatsApp selling Trinidad"
- "dropshipping Trinidad"
- "marketplace Trinidad"
```

#### Tier 3: Related (TT$10-30/click)
```
- "Trinidad SME"
- "small business Trinidad"
- "e-commerce T&T"
- "online marketplace"
- "sell products online"
```

### Campaign Structure

#### Campaign: Landing Page (Ongoing)
- **Objective**: Traffic to `/landing`
- **Budget**: TT$500/week
- **Keywords**: Tier 1 + Tier 2 (exact match priority)
- **Ad Copy**:
  ```
  Headline 1: "Free Online Store for Trinidad"
  Headline 2: "Cash on Delivery • No Credit Card"
  Headline 3: "Start Selling in 5 Minutes"
  
  Description: "Join 5,000+ T&T merchants. Get orders on WhatsApp. 
               Collect cash at delivery. Create your store free—no fees."
  ```
- **Landing Page**: `/landing`
- **Quality Score Target**: 7+
- **Bid Strategy**: Maximize conversions (CPA: TT$25)

### Google Ads Negative Keywords
```
- free (to avoid people looking for free stuff only)
- tutorial
- template
- download
- comparison
- vs shopify
- reviews
```

### Search Ad Extensions
- **Sitelink Extensions**: "/pricing", "/templates", "/about"
- **Call Extension**: WhatsApp support number
- **Promotion Extension**: "First 10 products free"
- **Structured Snippet**: Business categories (Fashion, Electronics, etc.)

---

## Retargeting Strategy

### Website Retargeting (Facebook + Google)

#### Audience 1: Page Viewers (1-14 days)
- **Audience Size**: All visitors to `/landing`
- **Message**: Social proof (5,000+ businesses)
- **Creative**: Testimonial video, success stories
- **Frequency**: 3-5x per week
- **Duration**: 2 weeks
- **Budget**: 20% of main budget

#### Audience 2: Form Abandoners (3-30 days)
- **Audience Size**: Clicked CTA but didn't complete signup
- **Message**: Remove objections ("No credit card, takes 5 min")
- **Creative**: FAQ video, COD explainer
- **Frequency**: 2-3x per week
- **Duration**: 4 weeks
- **Budget**: 15% of main budget

#### Audience 3: Recent Converters (Exclude)
- **Exclude**: Users who completed signup in last 7 days
- **Reason**: Don't waste budget on users already converting

---

## Weekly Optimization Checklist

### Every Week
- [ ] Check CTR (should be > 2% for FB, > 3% for Google)
- [ ] Check CPC (should trend downward TT$5→3→2)
- [ ] Check conversion rate (should be > 10% by week 4)
- [ ] Review top-performing ads (keep, scale, analyze)
- [ ] Review low-performing ads (pause, adjust, retest)
- [ ] Check ROAS (should be > 2:1 by week 8)

### Every 2 Weeks
- [ ] Analyze GA4 events (signup_start, signup_complete, store_created)
- [ ] Check Facebook Pixel data
- [ ] Test new audiences (lookalikes, interests)
- [ ] Test new creatives (#1-5 above)
- [ ] Adjust bids based on performance

### Every 4 Weeks
- [ ] Generate conversion report (impressions, clicks, conversions, cost)
- [ ] Calculate CAC per channel (FB vs Google vs Organic)
- [ ] Analyze merchant quality (retention, LTV, upgrades)
- [ ] Plan next month's creatives and messaging
- [ ] Review landing page A/B test results
- [ ] Determine winning hero headline / CTA button color

---

## Budget Allocation (TT$1,500/week)

### Initial (Weeks 1-2): TT$1,500/week
```
Facebook Awareness:     TT$500 (30%)
Google Search:          TT$500 (30%)
Facebook Retargeting:   TT$300 (20%)
Google Retargeting:     TT$200 (20%)
```

### Growth (Weeks 3-8): TT$1,500/week
```
Facebook (Consideration): TT$700 (45%)
Google Search:            TT$400 (25%)
Retargeting (FB + GG):    TT$400 (30%)
```

### Scale (Weeks 9-12): TT$1,500/week
```
Facebook (Conversion):    TT$600 (40%)
Google Search:            TT$400 (25%)
Retargeting:              TT$400 (25%)
Testing:                  TT$100 (10%)
```

---

## Success Metrics by Week

| Week | Visitors | Signups | SignUp CVR | CAC | ROAS |
|------|----------|---------|-----------|-----|------|
| 1    | 500      | 25      | 5%        | TT$60 | - |
| 2    | 1,000    | 75      | 7.5%      | TT$40 | 1.5:1 |
| 3    | 1,500    | 180     | 12%       | TT$25 | 2:1 |
| 4    | 2,000    | 240     | 12%       | TT$25 | 2:1 |
| 5    | 2,500    | 300     | 12%       | TT$25 | 2:1 |
| 6    | 3,000    | 360     | 12%       | TT$25 | 2.5:1 |
| 7    | 3,500    | 420     | 12%       | TT$24 | 2.5:1 |
| 8    | 4,000    | 480     | 12%       | TT$23 | 3:1 |
| 9    | 4,500    | 540     | 12%       | TT$22 | 3:1 |
| 10   | 5,000    | 600     | 12%       | TT$21 | 3:1 |
| 11   | 5,500    | 660     | 12%       | TT$20 | 3.5:1 |
| 12   | 6,000    | 720     | 12%       | TT$20 | 3.5:1 |

**Year 1 Total**: 6,500 visitors, 780 conversions (12% CVR), CAC < TT$25, ROAS 3:1+

---

## Creative Calendar (12 Weeks)

### Week 1-2: Foundation
- [ ] Create 5 ad creatives (#1-5 above)
- [ ] Set up pixel + GA4 events
- [ ] Design landing page A/B variants
- [ ] Launch Facebook Awareness + Google Search

### Week 3-4: Optimize
- [ ] Analyze which creatives perform best
- [ ] Pause underperformers
- [ ] Scale winning creatives +50%
- [ ] Test headline variations

### Week 5-8: Growth
- [ ] Create 3-5 new testimonial videos
- [ ] Launch carousel ads (social proof)
- [ ] Test messaging angles
- [ ] Increase budget to winners

### Week 9-12: Scale
- [ ] Focus budget on top-performing creatives
- [ ] Launch retargeting campaigns
- [ ] Test lookalike audiences
- [ ] Plan Q2 strategy based on learnings

---

## Tools & Setup

### Required
- Facebook Ads Manager (free)
- Google Ads (free account)
- GA4 (free)
- Conversion Pixel (Facebook): Already set up in `facebookPixelService.ts`
- GA4 Events: Already set up in `ga4AnalyticsService.ts`

### Helpful
- Canva Pro (ad design): TT$150/year
- Loom (video recording): Free tier available
- ConvertKit or Mailchimp (email capture): Free tier
- Looker Studio (dashboard): Free

### URLs
- Landing: `https://trinibuild.com/landing`
- Store Creator: `https://trinibuild.com/create-store`
- Pricing: `https://trinibuild.com/pricing`
- Contact: `https://trinibuild.com/contact`

---

## Key Takeaways

1. **Start with Segments 1 & 2** (existing business owners + online sellers): highest intent
2. **Lead with problem**, not features ("Tired of WhatsApp selling?" not "Built with React")
3. **Remove objections** in ad copy (no credit card, no fees, takes 5 min)
4. **Test creatives not audiences**: same audience, different messages = better learning
5. **Target < TT$25 CAC** by week 4; scale if achievable
6. **Retarget everyone**: 80% of value comes from warm audience
7. **Optimize weekly**, not daily: ads need 24-48 hrs to gather data
8. **Track cohort**: month 1 signups vs retention vs upgrades vs LTV

---

## Next Steps

1. [ ] Create Facebook Ads account + Instagram Business profile
2. [ ] Set up Google Ads account + conversion tracking
3. [ ] Design 5 ad creatives in Canva
4. [ ] Record 2-3 testimonial videos (recruit first customers)
5. [ ] Set up GA4 + Facebook Pixel on landing page (DONE ✅)
6. [ ] Create 2 landing page variants for A/B test
7. [ ] Launch Campaign 1 (Awareness) with TT$500/week budget
8. [ ] Monitor for 1 week, optimize, scale to TT$1,500/week
9. [ ] Weekly reporting on GA4 dashboard
10. [ ] Monthly strategy review + next month planning

---

**Created**: April 22, 2026  
**Last Updated**: April 22, 2026  
**Status**: Ready for Implementation
