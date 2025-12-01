# TriniBuild Store Creator - Upsell Implementation

## Overview
Implemented a one-time upgrade offer (OTO) modal that appears after store creation with PayPal payment integration.

## Features Implemented

### Step 6: Upsell Modal
After the celebration screen (Step 5), users are presented with a premium upgrade offer before being redirected to the dashboard.

### Offer Details
- **Price**: TT$49 (75% off from TT$199)
- **Payment**: One-time payment via PayPal
- **USD Conversion**: $7.50 USD (~49 TTD)

### Premium Features Included
1. **Verified Business Badge**
   - Instantly build trust
   - Verified stores get 3x more clicks

2. **24h Homepage Boost**
   - Featured placement on TriniBuild homepage for 24 hours
   - Maximum visibility for new stores

3. **Unlock AI Analytics**
   - Track store visitors from day one
   - Understand customer behavior

## User Flow

```
Step 1: Business Info → 
Step 2: Logo Builder → 
Step 3: Theme Selection → 
Step 4: Store Preview → 
Step 5: Celebration ("Store Created!") → 
Step 6: Upsell Offer (NEW) → 
Dashboard
```

## Technical Implementation

### PayPal Integration
- Uses `@paypal/react-paypal-js` package
- Sandbox mode configured (clientId: "sb")
- Currency: USD
- Amount: $7.50

### Payment Flow
1. User clicks PayPal button
2. PayPal modal opens for payment
3. On successful payment:
   - Payment details captured
   - Success message shown
   - User redirected to dashboard
   - TODO: Update store record with premium features

4. On payment error:
   - Error logged to console
   - User notified
   - Can retry or skip

### Skip Options
Users can decline the offer in two ways:
1. Click the X button (top right)
2. Click "No thanks, I'll stay on the slow path" button

Both options redirect to `/dashboard` without charging.

## Design Features

### Visual Design
- **Background**: Purple-to-pink gradient for urgency
- **Card**: White rounded card with shadow
- **Badge**: "⚡ ONE TIME OFFER" in yellow-orange gradient
- **Benefits**: Color-coded cards with icons
- **Pricing**: Dark card with strikethrough original price

### Icons Used
- CheckCircle (Verified Badge)
- Zap (Homepage Boost)
- TrendingUp (AI Analytics)
- X (Close button)

## Database Integration (TODO)

When payment is successful, the following should be updated in Supabase:

```sql
UPDATE stores 
SET 
  is_verified = true,
  homepage_boost_until = NOW() + INTERVAL '24 hours',
  has_analytics = true,
  premium_tier = 'fast_track',
  upgraded_at = NOW()
WHERE id = [store_id];
```

## Environment Variables Required

For production, update the PayPal clientId:

```env
VITE_PAYPAL_CLIENT_ID=your_production_client_id
```

Then update the PayPalScriptProvider:

```tsx
<PayPalScriptProvider options={{ 
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb", 
  currency: "USD", 
  intent: "capture" 
}}>
```

## Testing

### Test the Flow
1. Navigate to `/create-store`
2. Complete all steps (Info → Logo → Theme → Preview)
3. Click "Launch Store"
4. Sign the agreement (if required)
5. See celebration screen
6. Click "Continue"
7. See upsell modal
8. Test PayPal payment (sandbox)
9. Verify redirect to dashboard

### Test Skip Flow
1. Follow steps 1-7 above
2. Click X or "No thanks" button
3. Verify redirect to dashboard without payment

## Notes

- The PayPal sandbox account is currently configured
- Before going live, replace with production credentials
- Consider adding conversion tracking (Google Analytics, Meta Pixel)
- The 75% discount creates urgency and high perceived value
- The "slow path" copy uses loss aversion psychology

## Future Enhancements

1. **A/B Testing**: Test different price points ($5, $7.50, $10)
2. **Countdown Timer**: Add 10-minute timer for extra urgency
3. **Social Proof**: Show "X stores upgraded today"
4. **Exit Intent**: Re-show offer if user tries to close tab
5. **Email Follow-up**: Send offer reminder if skipped
6. **Analytics Dashboard**: Track conversion rate of upsell
