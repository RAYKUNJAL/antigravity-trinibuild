# TriniBuild System Audit & Fix Plan

## 1. Chatbot Fix
- [x] Investigate `ai_server` connection issues.
- [x] Ensure `ai_server` is running and accessible (Verified via curl).
- [x] Verify `ChatWidget.tsx` error handling and connection logic.
- [x] Test chatbot with local LLM fallback (Backend working).

## 2. Authentication & Onboarding Audit
- [x] Audit `pages/Auth.tsx` for sign-up/login flows.
- [x] Audit `pages/Onboarding.tsx` (General User/Business).
- [x] Audit `pages/DriverOnboarding.tsx`.
- [x] Audit `pages/PromoterOnboarding.tsx`.
- [x] Identify and fix any broken forms or API calls (Fixed Promoter file upload).
- [x] Ensure smooth transitions and error handling (Fixed missing routes in App.tsx).

## 3. Landing Page Optimization (SEO & CRO)
- [x] Implement `react-helmet-async` for SEO metadata.
- [x] Create reusable `SEO` component.
- [x] Optimize `LivingLanding.tsx` (Pain Points & Solutions).
- [x] Optimize `JobsLanding.tsx` (Dual Track: Employers vs Workers).
- [x] Optimize `RidesLanding.tsx` (Rider Pain Points).
- [x] Add SEO metadata to `MarketplaceLanding`, `TicketsLanding`, `DriveWithUs`.

## 4. General System Health
- [ ] Verify database connections (Supabase).
- [ ] Check for any console errors in the browser.
- [ ] Ensure all key pages load correctly.

## 5. Verification
- [ ] Run end-to-end tests for critical flows (Sign up, Chat, Onboarding).
