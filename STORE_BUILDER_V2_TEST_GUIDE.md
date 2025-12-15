# 🧪 Store Builder V2 - Complete Test Guide

## ✅ Pre-Test Setup

### 1. Apply Database Migration
**IMPORTANT**: Run this SQL in your Supabase SQL Editor first:
```sql
-- Copy and paste from: apply_store_v2_migration.sql
```

### 2. Verify Dev Server is Running
- Ensure `npm run dev` is running on http://localhost:5173
- Check console for any errors

---

## 🎯 Test Flow: Complete Store Creation

### **Step 0: Quick Start** (if shown)
- Navigate to: http://localhost:5173/#/create-store
- Click **"Start Fresh"** button (or "Manual" option)

---

### **Step 1: Business Basics** ✨
**Fill in the following:**
- **Business Name**: `Ray's Doubles Stand`
- **Category**: Select `🌮 Doubles / Street Food Vendor`
- **Tagline**: `Best Doubles in Trinidad` (or click "Generate with AI")

**Expected Result:**
- All fields should accept input
- "Next: Design Your Brand" button should be enabled

**Action:** Click **"Next: Design Your Brand"**

---

### **Step 2: Design & Branding** 🎨 (LOGO STUDIO)

#### What to Test:
1. **Logo Preview**
   - ✅ Should see a large preview box with:
     - Icon (based on category - should be food-related)
     - Your business name: "Ray's Doubles Stand"
     - Your tagline below it
   - ✅ Preview should have a colored border

2. **Color Schemes**
   - Click on **"Carnival Vibes"** (Red/Orange)
   - ✅ Logo preview border should turn RED
   - Click on **"Ocean Breeze"** (Blue/Cyan)
   - ✅ Logo preview border should turn BLUE
   - Click on **"Forest Green"**
   - ✅ Logo preview border should turn GREEN

3. **Font Pairs**
   - Click on **"Modern & Clean"** (Inter)
   - ✅ Business name font should update
   - Click on **"Elegant Serif"** (Playfair Display)
   - ✅ Business name should change to serif font

4. **Logo Application**
   - Click **"Use This Professional Design"** button
   - ✅ Button should turn GREEN and say "Logo Applied!"

5. **Business Vibe Tags** (Optional)
   - Click on tags like "Traditional", "Family Friendly", "Authentic"
   - ✅ Selected tags should turn RED with white text

**Expected Result:**
- Logo preview updates in REAL-TIME as you change colors/fonts
- All interactions should be smooth and responsive

**Action:** Click **"Next: Store Details"**

---

### **Step 3: Store Details** 📋

#### Fill in the following:
1. **Business Description**
   - Option A: Type manually: `"Authentic Trinidad doubles made fresh daily. Best in Port of Spain!"`
   - Option B: Click **"Write with AI"** button (if working)

2. **WhatsApp Number**
   - Enter: `18681234567`
   - ✅ Should format automatically

3. **Location**
   - **Area**: Select `Port of Spain`
   - **Region**: Select `Port of Spain`
   - **Street Address** (optional): `123 Main Street`

4. **Operating Hours**
   - Click **"Mon-Fri 9-5"** preset button
   - ✅ Should auto-fill operating hours

5. **Delivery Options** (check at least one)
   - ☑ Pickup
   - ☑ Delivery

6. **Payment Methods** (check at least one)
   - ☑ Cash
   - ☑ Linx/Debit

**Expected Result:**
- All fields should save properly
- No validation errors

**Action:** Click **"Next: Preview & Launch"**

---

### **Step 4: Preview & Launch** 🚀

#### What to Verify:

1. **Store Preview Section**
   - ✅ Should see a mockup of your store
   - ✅ Logo should be visible (icon + business name)
   - ✅ Business name: "Ray's Doubles Stand"
   - ✅ Description should be shown
   - ✅ **Demo Products** should be visible:
     - Should see 4 product cards
     - Products should be doubles-related (e.g., "Classic Doubles", "Pepper Doubles")
     - Each product should have an image, name, description, and price

2. **Color Verification**
   - ✅ If you selected "Ocean Breeze", buttons should be BLUE
   - ✅ If you selected "Carnival Vibes", buttons should be RED
   - ✅ If you selected "Forest Green", buttons should be GREEN

3. **Plan Selection**
   - Click on the **"Storefront" (Pro)** plan card
   - ✅ Card should highlight with blue border
   - ✅ Shows "$100/mo"
   - ✅ Features: Custom Domain, 50 Products, 0% Transaction Fees

4. **Terms Agreement**
   - ☑ Check **"I agree to the Terms of Service"** checkbox

**Expected Result:**
- Preview looks professional
- Demo products are visible and styled correctly
- Plan is selected

**Action:** Click **"Launch My Pro Store 🚀"**

---

### **Step 5: Store Launch & Redirect** 🎊

#### What Should Happen:
1. **Loading State**
   - ✅ Should see "Launching your store..." message
   - ✅ Should see "Stocking your shelves with demo products..." message

2. **Redirect**
   - ✅ Should automatically redirect to: `/store/{store-id}?welcome=true`
   - ✅ URL should change to your new store

---

### **Step 6: Verify Live Storefront** 🏪

#### On the Live Store Page, Check:

1. **Header**
   - ✅ Logo is displayed (icon + business name)
   - ✅ Business name: "Ray's Doubles Stand"
   - ✅ Star rating shown (4.8 stars)
   - ✅ Search bar is visible

2. **Store Colors**
   - ✅ Buttons match your selected color scheme
   - ✅ Prices are in your selected color
   - ✅ "Add to Cart" buttons use your color

3. **Products Section**
   - ✅ Should see **REAL PRODUCTS** (not empty!)
   - ✅ Products should be:
     - Classic Doubles - $15.00
     - Pepper Doubles - $18.00
     - Chicken Doubles - $20.00
     - Veggie Doubles - $15.00
   - ✅ Each product has an image
   - ✅ Each product has a description
   - ✅ "Add" button on each product

4. **Trust Badges**
   - ✅ "Secure Checkout" badge
   - ✅ "Fast Delivery" badge
   - ✅ "Cash on Delivery" badge
   - ✅ "24/7 Support" badge

5. **Test Add to Cart**
   - Click **"Add"** on a product
   - ✅ Cart icon should show a number badge
   - ✅ Cart sidebar should open
   - ✅ Product should be in cart with quantity controls

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module 'DEMO_DATA'"
**Fix:** The file exists at `config/demoData.ts` - restart dev server

### Issue: Logo preview not updating
**Fix:** Check browser console for errors - might be a state issue

### Issue: No products after launch
**Fix:** Check Supabase `products` table - products should be inserted

### Issue: Colors not applying to storefront
**Fix:** Hard refresh the storefront page (Ctrl+Shift+R)

### Issue: Migration errors
**Fix:** Run the SQL from `apply_store_v2_migration.sql` directly in Supabase SQL Editor

---

## 📸 Screenshots to Take

1. Step 2: Logo Studio with preview
2. Step 4: Store preview with demo products
3. Live Storefront: Full page with products
4. Live Storefront: Cart with item added

---

## ✅ Success Criteria

- [ ] All 5 steps complete without errors
- [ ] Logo Studio preview updates in real-time
- [ ] Demo products visible in Step 4 preview
- [ ] Store launches successfully
- [ ] Storefront displays with custom colors
- [ ] Products are populated (not empty)
- [ ] Add to cart functionality works
- [ ] Selected color scheme is applied throughout

---

## 🎉 Expected Final Result

You should have a **fully functional, beautifully designed store** with:
- Custom branding (logo, colors, fonts)
- 4 demo products ready to sell
- Working cart and checkout flow
- Professional appearance
- SEO-optimized pages

**This is a COMMERCIAL-GRADE store builder!** 🚀
