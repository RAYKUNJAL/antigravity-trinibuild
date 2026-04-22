# 🚀 4-WEEK SPRINT: BUILD TRINIBUILD 2.0 (CARIBBEAN DOMINATION)

## WEEK 1: AI Website Builder + Business Scraper (FOUNDATION)

### WEEK 1 DELIVERABLES

#### Task 1.1: Business Scraper Service (AI Agent)
**File:** `services/businessScraperService.ts`
**Inputs:** Business name, location
**Outputs:** Business info (name, category, phone, email, address, images, description)
**Sources:** Google Maps, Facebook, Instagram, website
**Time:** 30 seconds per business

```typescript
// Pseudo-code structure
export const scrapeBusinessInfo = async (businessName, location) => {
  // 1. Google Maps search
  const mapsData = await googleMapsAPI.search(businessName, location);
  
  // 2. Facebook search
  const fbData = await facebookGraphAPI.search(businessName);
  
  // 3. Instagram scrape
  const igData = await instagramAPI.search(businessName);
  
  // 4. Extract data
  return {
    name: mapsData.name,
    category: mapsData.category,
    phone: mapsData.phone || fbData.phone,
    email: fbData.email || igData.email,
    address: mapsData.address,
    photos: [...mapsData.photos, ...fbData.photos],
    description: mapsData.description || fbData.description,
    reviews: mapsData.reviews,
    rating: mapsData.rating,
    website: mapsData.website,
  };
};
```

**Dependencies:**
- Google Maps API (get TT$300 credit free)
- Facebook Graph API (already have setup)
- Instagram Basic API (free)
- Cheerio (web scraping library)

**Testing:** Scrape 100 Trinidad businesses, verify data accuracy

---

#### Task 1.2: AI Website Auto-Generator (Core)
**File:** `services/aiWebsiteGeneratorService.ts`
**Input:** Business data (from scraper)
**Output:** Complete website (HTML/React component)
**Time:** 60 seconds per website
**Model:** OpenAI GPT-4o (we already have API access)

```typescript
export const generateWebsite = async (businessData) => {
  // 1. Select template (category-specific)
  const template = selectTemplateByCategory(businessData.category);
  
  // 2. Generate content
  const homepage = await generateHomepage(businessData);
  const services = await generateServicePages(businessData);
  const contact = generateContactPage(businessData);
  
  // 3. Personalize
  const website = {
    template,
    content: { homepage, services, contact },
    colors: extractBrandColors(businessData.photos[0]),
    images: businessData.photos,
  };
  
  // 4. Deploy
  return await deployWebsite(website);
};
```

**Key Features:**
- Auto-generate hero copy (value prop)
- Create product/service pages
- Add customer reviews as testimonials
- Generate contact forms
- Mobile responsive
- SEO-optimized

**Output:** Website URL ready to claim

---

#### Task 1.3: Database Schema for Prospecting
**Table:** `business_prospects`
```sql
CREATE TABLE business_prospects (
  id uuid PRIMARY KEY,
  business_name varchar,
  location varchar,
  category varchar,
  phone varchar,
  email varchar,
  address text,
  photos jsonb,
  description text,
  website_url varchar,
  auto_generated_site_url varchar,
  status varchar, -- 'prospect', 'contacted', 'claimed', 'upgraded'
  created_at timestamp,
  contacted_at timestamp,
  claimed_at timestamp,
  upgraded_at timestamp
);
```

**Supabase Migration:** Apply this migration

---

#### Task 1.4: Landing Page for Claiming Website
**File:** `pages/ClaimYourWebsite.tsx`
**Purpose:** Merchant claims their auto-generated website
**Flow:**
1. "Is this your business?" (verification)
2. "Enter your email"
3. "Confirm website looks good"
4. "Create account / Login"
5. "Website is live!"
6. "Upgrade to Pro for TT$99/mo"

**Design:** TriniBuild brand, clear CTA, social proof

---

### WEEK 1 DEPENDENCIES TO INSTALL
```bash
npm install axios cheerio google-maps-api facebook-sdk stripe
```

### WEEK 1 SUCCESS METRICS
- ✅ Scraper accurately gets 90%+ businesses
- ✅ Website generator creates 100 sites in 30 mins
- ✅ Website pages load in <2 seconds
- ✅ Can deploy 50 websites simultaneously

---

## WEEK 2: Gamification + WhatsApp Commerce (ENGAGEMENT)

### WEEK 2 DELIVERABLES

#### Task 2.1: Spin-to-Win Wheel Component
**File:** `components/SpinWheel.tsx`
**Library:** CrazyTim/spin-wheel (open source, 343 stars)
**Features:**
- Customizable segments (merchant sets prizes)
- Prize weights (control probability)
- Win/lose animation
- Claim prize button
- One spin per customer per day (configurable)

```typescript
// Install
npm install spin-wheel-game

// Usage
<SpinWheel
  segments={[
    { label: '10% off', value: 0.1 },
    { label: 'Free shipping', value: 'free_shipping' },
    { label: 'TT$50 credit', value: 50 },
  ]}
  onWin={(prize) => applyPrizeToCart(prize)}
  dailyLimit={true}
/>
```

**Merchant Dashboard:** Edit wheel prizes, view analytics

---

#### Task 2.2: Loyalty Points System
**File:** `services/loyaltyPointsService.ts`
**Features:**
- Automatic points per purchase (merchants set rate)
- Point redemption (points → discount)
- Tier levels (Bronze/Silver/Gold = higher percent)
- Lifetime points tracking
- Expiration rules (optional)

```typescript
// Database
CREATE TABLE loyalty_points (
  id uuid PRIMARY KEY,
  customer_id uuid,
  store_id uuid,
  balance integer,
  lifetime_earned integer,
  tier varchar, -- bronze, silver, gold
  created_at timestamp,
  expires_at timestamp
);

// Service
export const addPoints = async (customerId, storeId, orderValue, pointsRate) => {
  const points = Math.floor(orderValue * pointsRate / 10);
  await updateBalance(customerId, storeId, +points);
  await updateTier(customerId, storeId);
};
```

---

#### Task 2.3: WhatsApp Commerce Integration
**File:** `services/whatsappCommerceService.ts`
**Using:** WhatsApp Business API + Twilio

**Features:**
1. **WhatsApp Ordering:**
   - Customer: "Hi, do you have blue shirts XL?"
   - Bot: "Yes, TT$250. [Link to order]"
   - Customer clicks → Checkout

2. **Order Notifications:**
   - "Order #123 confirmed"
   - "Preparing your order"
   - "Out for delivery"
   - "Delivered!"

3. **Customer Support Chat:**
   - Incoming messages → merchant dashboard
   - Auto-replies for common questions
   - Escalation to human

4. **Broadcast Messages:**
   - "New collection arrived!"
   - "Weekend sale - 50% off"
   - "You have TT$100 store credit"

```typescript
// Setup
const whatsapp = new TwilioWhatsApp({
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  whatsappNumber: '+1-XXX-XXX-XXXX',
});

// Send message
await whatsapp.send({
  to: customerPhoneNumber,
  message: 'Order confirmed! Track here: [link]'
});

// Receive message
whatsapp.onMessage((from, message) => {
  // Process incoming message
  // Reply or escalate to merchant
});
```

---

#### Task 2.4: WhatsApp Checkout Integration
**File:** `services/whatsappCheckoutService.ts`
**Flow:**
1. WhatsApp bot sends product link
2. Customer clicks link (goes to trinibuild.com checkout)
3. Checkout auto-fills customer phone number
4. Completion sends confirmation back to WhatsApp
5. Delivery tracking via WhatsApp

---

### WEEK 2 DEPENDENCIES
```bash
npm install twilio @twilio/sdk
```

### WEEK 2 SUCCESS METRICS
- ✅ Spin wheel works on 100% of devices
- ✅ Loyalty points track accurately
- ✅ WhatsApp integration 99.9% uptime
- ✅ Message delivery <5 seconds

---

## WEEK 3: Coupons + SMS + Performance (CONVERSION)

### WEEK 3 DELIVERABLES

#### Task 3.1: Native Coupons System
**File:** `components/merchant/CouponManager.tsx`
**Database Tables:**
```sql
CREATE TABLE coupons (
  id uuid PRIMARY KEY,
  store_id uuid,
  code varchar UNIQUE,
  type varchar, -- 'percentage', 'fixed', 'free_shipping', 'bogo'
  value numeric, -- 20 (for 20%), 100 (for TT$100)
  min_purchase numeric,
  max_uses integer,
  used_count integer,
  expires_at timestamp,
  created_at timestamp
);

CREATE TABLE coupon_usage (
  id uuid PRIMARY KEY,
  coupon_id uuid,
  customer_id uuid,
  order_id uuid,
  discount_applied numeric,
  created_at timestamp
);
```

**Merchant Features:**
- Create coupon (type, value, rules)
- Set expiration date
- Set max uses (total and per customer)
- View usage analytics (how many redeemed, ROI)
- Auto-email coupons to customers

**Customer Features:**
- Apply code at checkout
- See discount calculated
- Show QR code for POS (if offline)

---

#### Task 3.2: SMS Integration (Twilio)
**File:** `services/smsNotificationService.ts`
**Use Cases:**
1. **Order Notifications:**
   - "Order #123 confirmed"
   - "Item shipped"
   - "Out for delivery"

2. **Marketing:**
   - "50% off today only"
   - "Your TT$100 credit expires in 24h"

3. **Reminders:**
   - "You left TT$500 in your cart"
   - "Reorder your favorite item"

4. **2FA:**
   - One-time password for login

```typescript
import twilio from 'twilio';

const client = twilio(accountSid, authToken);

export const sendSMS = async (phone, message) => {
  return await client.messages.create({
    body: message,
    from: '+1-XXX-XXX-XXXX', // Twilio number
    to: phone,
  });
};

// Example: Order notification
await sendSMS(customerPhone, 
  `Order #123 confirmed! TT$1,500. Delivery tomorrow 9-5pm. Track: [link]`
);
```

---

#### Task 3.3: Performance Optimization
**Files to Update:** Multiple

**Optimizations:**

1. **Image Optimization:**
   - Convert to WebP (30% smaller)
   - Lazy load images (only load visible)
   - Responsive images (mobile < desktop)
   - Use CDN (Vercel Image Optimization)

```typescript
// Replace <img> with Next.js Image
import Image from 'next/image';

<Image 
  src="/product.jpg"
  alt="Product"
  width={500}
  height={500}
  loading="lazy"
  quality={75}
/>
```

2. **Code Splitting:**
   - Only load components when needed
   - Bundle size analysis

```typescript
import dynamic from 'next/dynamic';

// Load only when needed
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'));
```

3. **Database Caching:**
   - Add Redis layer
   - Cache products for 5 minutes
   - Cache categories for 1 hour

```typescript
// Setup Redis
import Redis from 'ioredis';
const redis = new Redis();

// Cache products
export const getProducts = async (storeId) => {
  const cached = await redis.get(`products:${storeId}`);
  if (cached) return JSON.parse(cached);
  
  const products = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId);
  
  await redis.setex(`products:${storeId}`, 300, JSON.stringify(products));
  return products;
};
```

4. **Minification & Compression:**
   - Already handled by Vite/Vercel

**Target Metrics:**
- Homepage load: <1.5 seconds
- Product page load: <2 seconds
- Checkout: <3 seconds
- Lighthouse score: 90+

---

### WEEK 3 SUCCESS METRICS
- ✅ SMS delivery rate 99%+
- ✅ Coupon system handles 10K+ concurrently
- ✅ Homepage loads <1.5s
- ✅ Images optimized (30% size reduction)

---

## WEEK 4: Cold Outreach AI + Deployment (GROWTH)

### WEEK 4 DELIVERABLES

#### Task 4.1: Cold Outreach Email Sequence (AI)
**File:** `services/coldOutreachEmailService.ts`
**Sequence:**
```
Day 1: Discovery Email
Subject: "We built your business website"
Body: "Hi [Owner], we just built [Business Name] a professional website. Claim it free here: [link]"

Day 3: Feature Email
Subject: "Your new website includes..."
Body: "5 things your site includes... [benefits] Claim here: [link]"

Day 5: Social Proof Email
Subject: "[Competitor] is already selling online"
Body: "Success story from similar business... Want the same? [link]"

Day 7: CTA Email
Subject: "Upgrade to Pro - TT$99/month"
Body: "Your free site is live. Upgrade for unlimited products, analytics, etc. [link]"
```

**Database:**
```sql
CREATE TABLE outreach_campaigns (
  id uuid PRIMARY KEY,
  prospect_id uuid,
  email varchar,
  status varchar, -- opened, clicked, claimed, upgraded
  email_1_sent timestamp,
  email_1_opened timestamp,
  email_2_sent timestamp,
  ...
  created_at timestamp
);
```

**Tech:** Use SendGrid (transactional emails, good deliverability)

---

#### Task 4.2: WhatsApp Cold Outreach Bot
**File:** `services/whatsappColdOutreachService.ts`
**Flow:**
```
Day 1 (via WhatsApp):
"Hi [Owner Name]! 👋 
We built [Business Name] a free website. 
See it here: [link]
Claim in 2 minutes 👇"

Day 3 (follow-up):
"Still interested? Your website is ready to accept orders.
Upgrade to TT$99/mo for unlimited products.
[Link]"
```

---

#### Task 4.3: Lead Scoring & Tracking
**File:** `services/leadScoringService.ts`
**Metrics:**
- Email opened? (+10 points)
- Link clicked? (+20 points)
- Website claimed? (+50 points)
- Account created? (+30 points)
- Upgraded to Pro? (+100 points, = customer)

**Dashboard:** Show funnel analytics (prospects → customers)

---

#### Task 4.4: Deploy Everything
**File:** Deployment steps

```bash
# 1. Apply all database migrations
supabase migrations apply

# 2. Add environment variables
vercel env add GOOGLE_MAPS_API_KEY
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add SENDGRID_API_KEY
vercel env add REDIS_URL

# 3. Deploy to Vercel
vercel deploy --prod

# 4. Verify
- ✅ Website scraper works
- ✅ AI generator creates sites
- ✅ Spin wheel loads
- ✅ WhatsApp integration active
- ✅ Email sequences send
- ✅ SMS delivers
- ✅ Performance <1.5s
```

---

### WEEK 4 SUCCESS METRICS
- ✅ Send 10,000 emails with 25%+ open rate
- ✅ 20% claim rate on auto-generated sites
- ✅ 100+ new merchants from cold outreach
- ✅ All systems live and stable

---

## POST-SPRINT ROADMAP (Weeks 5-12)

### Week 5-6: Multi-Vendor Marketplace Beta
- Vendor dashboard
- Product catalog aggregation
- Order management
- Commission tracking

### Week 7-8: Local Payment Methods
- First Caribbean Bank integration
- Republic Bank integration
- NCB Bank integration
- Digital wallet support

### Week 9-10: AI Customer Support Bot
- FAQ chatbot
- Order tracking
- Returns processing
- Escalation to humans

### Week 11-12: Mobile PWA
- App-like mobile experience
- Offline support
- Push notifications
- Install to home screen

---

## DEPENDENCIES & COSTS

### APIs Needed
- Google Maps API: TT$300 free credit
- Facebook Graph API: Already set up
- Twilio (WhatsApp + SMS): TT$500-1,000/mo
- SendGrid (Emails): TT$200-500/mo
- OpenAI (GPT-4o): Already integrated

### Libraries to Add
```bash
npm install spin-wheel-game twilio @twilio/sdk redis ioredis sendgrid
```

### Infrastructure
- Redis server: TT$50-100/mo (or Vercel KV)
- Google Maps quota: Included in free tier initially

### Total Additional Cost
- Month 1: TT$1,000 (setup + first month)
- Month 2+: TT$700-1,500/month (services)

---

## TEAM ALLOCATION

### Engineer 1 (Full Stack)
- Week 1: Business scraper + website generator
- Week 2: WhatsApp integration
- Week 3: Performance optimization
- Week 4: Testing & deployment

### Engineer 2 (AI/Automation)
- Week 1: Scraper data quality
- Week 2: AI website generation
- Week 3: Coupons system
- Week 4: Cold outreach sequences

### You (Product)
- Oversee all
- Make decisions
- Testing & feedback
- Pitch to merchants

---

## SUCCESS CRITERIA

### Week 1
- ✅ Scrape 1,000 Trinidad businesses accurately
- ✅ Generate 100 websites in <60 seconds each
- ✅ All websites mobile-responsive and fast

### Week 2
- ✅ Spin wheel working on 100% of browsers
- ✅ WhatsApp messages send/receive reliably
- ✅ Loyalty points tracking accurately

### Week 3
- ✅ Coupons apply correctly at checkout
- ✅ SMS delivery 99%+ success
- ✅ Page load time <1.5 seconds

### Week 4
- ✅ Cold outreach sending 10K+ emails
- ✅ 20% claim rate (= 2,000 claimed from 10K)
- ✅ All systems live and stable
- ✅ First 100 customers acquired

---

## GO-LIVE PLAN (End of Week 4)

### Day 1: Soft Launch
- Invite 100 beta merchants
- Monitor all systems
- Gather feedback
- Fix critical issues

### Day 2-3: Public Launch
- Blog post: "TriniBuild 2.0 is here!"
- Social media blitz
- Email existing merchants about new features
- Cold outreach starts at scale

### Week 1 Post-Launch
- 500+ merchants claimed websites
- 100+ upgraded to Pro
- TT$50K revenue run rate

---

**READY TO BUILD?** 🚀
