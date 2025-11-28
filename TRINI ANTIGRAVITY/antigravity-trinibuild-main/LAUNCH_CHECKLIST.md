
# TriniBuild Launch Checklist 🚀

## ✅ Completed
- [x] **Core Frontend:** Built Home, Directory, Rides, Jobs, Tickets, Real Estate, and Classifieds pages.
- [x] **Unified Dashboard:** Created a "Super App" dashboard for Merchants, Drivers, Pros, and Promoters.
- [x] **Ad Platform:** Integrated `AdSpot` component across all key pages.
- [x] **Onboarding Flow:** Streamlined sign-up for different user types (Shopper, Merchant, Worker).
- [x] **Database Setup:** Configured Supabase client and created SQL schema for Users, Stores, Products, and Orders.
- [x] **Git Repository:** Initialized and pushed code to GitHub.

## 🚧 In Progress / Next Steps
- [x] **Connect Frontend to Supabase:**
    - [x] Update `authService.ts` to use Supabase Auth instead of mock data.
    - [x] Update `storeService.ts` to fetch/save stores from Supabase DB.
    - [x] Update `productService.ts` to manage products in Supabase DB.
    - [x] Update `orderService.ts` to handle real orders.
- [x] **Deploy to Vercel:**
    - [x] Connect GitHub repo to Vercel.
    - [x] Add Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`).
    - [x] Verify live deployment.
- [ ] **Rides & Maps Integration:**
    - [ ] Implement Google Maps or Mapbox for real-time location tracking in `Rides.tsx`.
    - [ ] Build backend logic for matching riders with drivers.
- [ ] **Payments:**
    - [ ] Integrate a real payment gateway (WiPay or Stripe) for checkout.
- [ ] **Admin Panel:**
    - [ ] Build an interface to manage Ads (upload images, set links).
    - [ ] Build a moderation queue for new Stores and Products.

## 📅 Launch Plan
1.  **Alpha Test (Internal):** Verify all Supabase connections work (Sign up, Create Store, Add Product).
2.  **Beta Launch:** Deploy to Vercel and share with a small group of test users.
3.  **Public Launch:** Marketing push and open registration.
