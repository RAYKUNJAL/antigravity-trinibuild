# 💰 TriniBuild Complete Fee & Revenue System

## Executive Summary

TriniBuild operates a **transparent, three-way revenue split system**:

| Party | Gets | Details |
|-------|------|---------|
| **Merchant** | 85-88% | Order value minus all fees & taxes |
| **TriniBuild** | 5% | Platform fee + delivery commission + payment processing |
| **Taxes (T&T)** | 12.5% | VAT on merchant earnings |

---

## 📊 Complete Fee Structure

### 1. Order Revenue Flow (Example: TT$1,000 Order)

```
Customer Orders ........................... TT$1,000.00
├─ Subtotal ............................. TT$1,000.00
├─ Delivery Fee (TriniRides) ............ -TT$75.00 (25 base + 4/km)
│
└─ Merchant Receives ..................... TT$925.00
    ├─ TriniBuild Platform Fee (5%) .... -TT$46.25 (of original)
    ├─ Payment Processing Fee ........... -TT$19.00 (if card)
    │
    └─ Gross Earnings ................... TT$859.75
        ├─ VAT (12.5%) ................. -TT$107.47
        ├─ Green Fund Levy (0.3%) ...... -TT$2.58
        ├─ Business Levy (0.2%) ....... -TT$1.72
        │
        └─ NET PAYOUT .................. TT$748.00 (75% of order)
```

### 2. TriniBuild Fees by Payment Method

| Method | Fee Structure | Example (TT$1,000) |
|--------|---------------|-------------------|
| **COD** | 5% platform + delivery (TriniRides) | -TT$121.25 |
| **Card** | 5% platform + 2.9% + TT$10 | -TT$75.00 |
| **PayPal** | 5% platform + 4.9% + TT$20 | -TT$79.00 |
| **Bank Transfer** | 5% platform + TT$50 batch | -TT$100.00 |

**Why different rates?**
- COD: Highest fee (delivery coordination required)
- Card: Payment processor fee (Stripe)
- PayPal: Payment processor fee (PayPal)
- Bank: Fixed daily batch fee to reduce friction

### 3. Delivery Fees (TriniRides Integration)

```
TriniBuild receives:
├─ Base fee: TT$25 per delivery
├─ Distance fee: TT$4 per km
└─ Commission: 20% of above

Example: TT$75 delivery = TT$15 commission to TriniBuild
```

### 4. Tax Obligations (Trinidad & Tobago)

| Tax | Rate | On What | Example |
|-----|------|---------|---------|
| **VAT** | 12.5% | Merchant gross earnings | TT$1,000 earnings → TT$125 VAT |
| **Green Fund Levy** | 0.3% | Merchant gross earnings | TT$1,000 earnings → TT$3 levy |
| **Business Levy** | 0.2% | Merchant gross earnings | TT$1,000 earnings → TT$2 levy |

**Total tax burden: ~12.75% of earnings**

---

## 🏦 Revenue Tracking System

### Tables in Supabase

#### 1. `order_revenue` - Per-Order Tracking
```sql
- order_id (UUID)
- store_id (UUID)
- merchant_id (UUID)
- order_total (numeric) -- TT$1,000
- trinibuild_fee (numeric) -- TT$50
- delivery_fee (numeric) -- TT$75
- payment_fee (numeric) -- TT$19
- merchant_earnings (numeric) -- TT$856
- payment_method (varchar) -- 'cod', 'card', 'bank'
- status (varchar) -- 'completed', 'failed', 'refunded'
- created_at (timestamp)
```

**Key Feature:** Every order's fees are recorded individually for:
- Merchant visibility (MerchantRevenueDashboard)
- TriniBuild reporting (FinancialDashboard)
- Tax compliance (BIR reporting)

#### 2. `merchant_monthly_revenue` - Monthly Aggregates
```sql
- store_id (UUID)
- merchant_id (UUID)
- period (varchar) -- '2026-04'
- total_order_value (numeric) -- Sum of all orders
- order_count (integer) -- Number of orders
- trinibuild_fees (numeric) -- 5% of all orders
- delivery_fees (numeric) -- All delivery charges
- payment_fees (numeric) -- All payment processor fees
- merchant_earnings (numeric) -- Total before tax
- vat_amount (numeric) -- 12.5% of earnings
- green_fund_levy (numeric) -- 0.3%
- business_levy (numeric) -- 0.2%
- total_tax (numeric) -- VAT + levies
- net_payout (numeric) -- Earnings - taxes
- status (varchar) -- 'pending', 'approved', 'paid'
```

**Use Case:** Monthly summary for:
- Merchant dashboard
- Payout calculations
- Tax reporting

#### 3. `merchant_payouts` - Payout Requests
```sql
- store_id (UUID)
- merchant_id (UUID)
- period (varchar) -- '2026-04'
- gross_earnings (numeric)
- tax_amount (numeric)
- payout_amount (numeric) -- After tax
- bank_account (jsonb) -- {accountNumber, bankName, accountName}
- status (varchar) -- 'pending' → 'approved' → 'processing' → 'completed'
- requested_at (timestamp)
- approved_at (timestamp)
- processed_at (timestamp)
- completed_at (timestamp)
- payment_reference (varchar) -- Bank reference
- payment_date (date)
```

**Workflow:**
1. Merchant requests payout (pending)
2. TriniBuild approves after tax verification (approved)
3. Batch payment processed (processing)
4. Funds transferred to merchant's bank (completed)

#### 4. `trinibuild_monthly_revenue` - Platform Revenue
```sql
- period (varchar) -- '2026-04'
- platform_fees (numeric) -- 5% of all orders
- delivery_commission (numeric) -- 20% of delivery fees
- payment_processing (numeric) -- Stripe/PayPal fees
- subscription_revenue (numeric) -- Pro plan revenue
- total_revenue (numeric)
- operating_costs (numeric) -- ~40% of revenue
- net_profit (numeric) -- Revenue - costs
```

**TriniBuild Revenue Streams:**
1. Platform fees (5% of orders)
2. Delivery commission (20% of TriniRides)
3. Payment processing (keep % from Stripe/PayPal)
4. Subscription plans ($199/mo Pro → $400/mo Enterprise)

---

## 💼 Merchant Revenue Dashboard

**File:** `components/merchant/MerchantRevenueDashboard.tsx`

### What Merchants See

#### Real-Time Metrics
- **Total Order Value** - Sum of all completed orders
- **Total Orders** - Count of orders this period
- **Merchant Earnings** - After all fees
- **Net Payout** - After taxes

#### Fee Breakdown
- TriniBuild Platform Fee (5%)
- Delivery Fees (TriniRides)
- Payment Processing Fees
- VAT & Levies

#### Order History Table
- Order #, Date, Total, Delivery Fee
- Payment Method (COD, Card, Bank)
- Status (Pending, Completed, Failed)

#### Export Options
- CSV export for accounting/tax filing
- Monthly financial summaries

#### Tax Transparency
- Shows VAT calculation (12.5%)
- Green Fund Levy (0.3%)
- Business Levy (0.2%)
- Notes about BIR compliance

---

## 🔐 Security & Compliance

### Row-Level Security (RLS)
✅ Merchants can ONLY see their own revenue  
✅ Admins can see all revenue (for reporting)  
✅ No cross-store visibility  
✅ Automatic encryption at rest  

### Tax Compliance
✅ All transactions logged  
✅ CSV exports for BIR filing  
✅ Monthly reconciliation reports  
✅ VAT tracking by merchant  

### Fraud Prevention
✅ Duplicate order detection  
✅ Refund reversal tracking  
✅ Payment method verification  
✅ Suspicious activity alerts  

---

## 📱 Merchant Payout Workflow

### Step 1: Earnings Accumulation
Merchant gets orders throughout the month...
```
Week 1: TT$2,500 in orders
Week 2: TT$3,100 in orders
Week 3: TT$2,200 in orders
Week 4: TT$1,800 in orders
────────────────────────────
Total: TT$9,600 in orders
```

### Step 2: Fee Deduction
All fees automatically deducted:
```
TT$9,600 (orders)
-  TT$480 (5% platform fee)
-  TT$300 (delivery fees)
-  TT$150 (payment fees)
────────────────
= TT$8,670 (gross earnings)
```

### Step 3: Tax Calculation
Taxes calculated on gross earnings:
```
TT$8,670 × 12.5% = TT$1,083.75 (VAT)
TT$8,670 × 0.3%  = TT$26.01 (Green Fund)
TT$8,670 × 0.2%  = TT$17.34 (Business)
─────────────────
Total Tax = TT$1,127.10
```

### Step 4: Payout Calculation
Net payout after taxes:
```
TT$8,670 (gross)
- TT$1,127 (taxes)
─────────────────
= TT$7,543 (net payout) ← Merchant receives this
```

### Step 5: Payout Request
Merchant can request payout via dashboard:
- Select month to withdraw
- Confirm bank account details
- Submit for approval

### Step 6: Approval & Processing
TriniBuild processes within 48 hours:
- Verify tax compliance
- Approve payout
- Process bank transfer
- Send confirmation

**Status Tracking:**
- ⏳ Pending (awaiting approval)
- ✓ Approved (verified)
- ⚙️ Processing (transferring)
- ✅ Completed (in merchant's account)

---

## 📊 Financial Reports

### For Merchants
- Monthly revenue summary
- Fee breakdown by payment method
- Order history with fees
- Tax obligations
- Payout status

### For TriniBuild
- Platform fee revenue (5%)
- Delivery commission (20% of TriniRides)
- Payment processing fees
- Subscription revenue
- Total operating profit

### For Trinidad Government (BIR)
- Merchant earnings by month
- Tax collected (VAT, levies)
- Merchant compliance status
- Export-ready CSV format

---

## 🎯 Key Principles

### Transparency
✅ Every fee shown to merchants  
✅ Clear explanation of why fees exist  
✅ Simple percentage rates (no hidden charges)  
✅ Real-time dashboard updates  

### Fairness
✅ 5% platform fee is competitive vs Shopify (2.9%), etsy (3-5%)  
✅ Payment fees only charged once (not double-dipped)  
✅ Delivery fees passed through (no markup)  
✅ Merchants set own product prices  

### Compliance
✅ All T&T tax laws followed  
✅ BIR reporting ready  
✅ Monthly reconciliation  
✅ Audit trails for all transactions  

### Simplicity
✅ One clear fee structure  
✅ No tiers or thresholds  
✅ Same rates for all merchants  
✅ Predictable calculations  

---

## 💡 Revenue Examples

### Scenario: Restaurant (Food Business)

**Monthly Orders:** 300 orders @ avg TT$150 each
```
Total Order Value ........................ TT$45,000
├─ TriniBuild Fee (5%) .................. -TT$2,250
├─ Delivery Fees ........................ -TT$1,500
├─ Payment Fees (20% card) ............. -TT$600
├─ Gross Earnings ....................... TT$40,650
├─ VAT (12.5%) .......................... -TT$5,081
├─ Other Levies (0.5%) ................. -TT$203
└─ NET PAYOUT ........................... TT$35,366 (78.5%)
```

**Insight:** Restaurant keeps ~78.5% of order value, rest covers delivery and taxes.

### Scenario: Fashion Boutique (High Margin)

**Monthly Orders:** 150 orders @ avg TT$400 each
```
Total Order Value ........................ TT$60,000
├─ TriniBuild Fee (5%) .................. -TT$3,000
├─ Delivery Fees ........................ -TT$1,800
├─ Payment Fees (card) .................. -TT$1,200
├─ Gross Earnings ....................... TT$54,000
├─ VAT (12.5%) .......................... -TT$6,750
├─ Other Levies (0.5%) ................. -TT$270
└─ NET PAYOUT ........................... TT$46,980 (78.3%)
```

**Insight:** Same net payout ratio, but higher absolute earnings due to margins.

### Scenario: Small Retail (Lower Margin)

**Monthly Orders:** 500 orders @ avg TT$50 each
```
Total Order Value ........................ TT$25,000
├─ TriniBuild Fee (5%) .................. -TT$1,250
├─ Delivery Fees ........................ -TT$1,000
├─ Payment Fees (mix) ................... -TT$400
├─ Gross Earnings ....................... TT$22,350
├─ VAT (12.5%) .......................... -TT$2,794
├─ Other Levies (0.5%) ................. -TT$112
└─ NET PAYOUT ........................... TT$19,444 (77.8%)
```

**Insight:** High volume, lower per-order fees, consistent payout ratio.

---

## 🚀 What's Next

### Phase 1: Complete (NOW)
✅ Order revenue tracking  
✅ Fee calculations  
✅ Monthly summaries  
✅ Merchant dashboard  
✅ Payout requests  

### Phase 2: Q2 2026
- [ ] Automated payout processing (daily batches)
- [ ] Multi-currency support (USD, EUR)
- [ ] Scheduled payouts (weekly vs monthly)
- [ ] Advance payouts (up to 50% weekly)
- [ ] Tax filing integration with BIR

### Phase 3: Q3 2026
- [ ] Merchant financial advisor (AI)
- [ ] Tax optimization recommendations
- [ ] Profit forecasting
- [ ] Expense categorization
- [ ] Accountant portal

### Phase 4: Q4 2026 & Beyond
- [ ] TriniBuild Bank (fintech)
- [ ] Working capital loans
- [ ] Merchant credit cards
- [ ] Business insurance
- [ ] Liability protection

---

## 📧 Contact & Support

**Merchants with questions about:**
- Fees: Email support@trinibuild.com
- Taxes: Check docs/tax-guide.md
- Payouts: Dashboard → Help → Payout FAQ
- Compliance: Email legal@trinibuild.com

**Admins/Ops:**
- Dashboard: admin.trinibuild.com
- Reports: docs/financial-reports/
- Tax filing: tools/bir-export.ts

---

**Last Updated:** April 22, 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0
