import AIListingDashboard from './pages/AIListingDashboard';
import DebugUpload from './src/pages/DebugUpload';
import CODDashboard from './pages/CODDashboard';
import AffiliateDashboard from './pages/AffiliateDashboard';
import DocumentCenter from './pages/DocumentCenter';
import PricingPage from './pages/PricingPage';

console.log('🔄 App.tsx file is loading...');
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Directory } from './pages/Directory';
import { WelcomeScreen } from './components/WelcomeScreen';

// NEW: Single store builder (replaces 5+ legacy creators)
import StoreBuilderV3 from './pages/StoreBuilderV3';

import MerchantTaxDashboard from './components/MerchantTaxDashboard';
import AdminFinancialDashboard from './components/AdminFinancialDashboard';
import { Dashboard } from './pages/Dashboard';
import { Storefront } from './pages/Storefront';
import { ShortSlugRedirect } from './components/ShortSlugRedirect';
// AdminDashboard removed; external redirect will be used
import { Settings } from './pages/Settings';
import { StoreBotSettings } from './pages/StoreBotSettings';
import { ChatWidget } from './components/ChatWidget';
import { Rides } from './pages/Rides';
import { Jobs } from './pages/Jobs';
import { Pricing } from './pages/Pricing';
import { Deals } from './pages/Deals';
import { Onboarding } from './pages/Onboarding';
import { Earn } from './pages/Earn';
import { DriverOnboarding } from './pages/DriverOnboarding';
import { DriverHub } from './pages/DriverHub';
import { DriveWithUs } from './pages/DriveWithUs';
import { JobProfile } from './pages/JobProfile';
import { Auth } from './pages/Auth';
import { Contact } from './pages/Contact';
import { About } from './pages/About';
import { Features } from './pages/Features';
import { Events } from './pages/Events';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { BlogGenerator } from './pages/BlogGenerator';
import { LocationBlogPost } from './pages/LocationBlogPost';
import { AdminBlogDashboard } from './pages/AdminBlogDashboard';
import { SearchResults } from './pages/SearchResults';
import { KeywordDashboard } from './pages/KeywordDashboard';
import { CODTrackingPage } from './pages/CODTrackingPage';
import { AdminSignup } from './pages/admin/AdminSignup';
import { AdminBypass } from './pages/admin/AdminBypass';
import CommandCenter from './pages/CommandCenter';
import { AdminLayout } from './layouts/AdminLayout';
import {
  TrafficHub, AdsEngine, ContentAICenter, UserManagement,
  TrustSafety, FinancePayouts, SystemHealth, DeveloperTools,
  MarketplaceMonitor, JobsMonitor, RealEstateMonitor, RideshareFleet,
  TicketsMonitor, ReportsAnalytics, VideoControlCenter
} from './components/admin';
import { MessagingCenter } from './pages/admin/MessagingCenter';
import { Automations } from './pages/admin/Automations';
import { Legal } from './pages/Legal';
import { RealEstate } from './pages/RealEstate';
import { ListProperty } from './pages/ListProperty';
import { RealEstateAgentDashboard } from './pages/RealEstateAgentDashboard';
import { Tickets } from './pages/Tickets';
import { UserProfile } from './pages/UserProfile';
import { Classifieds } from './pages/Classifieds';
import { AffiliateProgram } from './pages/AffiliateProgram';
import { CROSignupFlow } from './pages/CROSignupFlow';
import { SignupPageSimple } from './pages/SignupPageSimple';
import { SmartOnboarding } from './pages/SmartOnboarding';

// Landing Pages (NLP Optimized)
import { MarketplaceLanding } from './pages/landing/MarketplaceLanding';
import { RidesLanding } from './pages/landing/RidesLanding';
import { JobsLanding } from './pages/landing/JobsLanding';
import { TicketsLanding } from './pages/landing/TicketsLanding';
import { PromoterOnboarding } from './pages/PromoterOnboarding';
import { LivingLanding } from './pages/landing/LivingLanding';
import { StoreServicesLanding } from './pages/landing/StoreServicesLanding';
import { FoodServicesLanding } from './pages/landing/FoodServicesLanding';
// StoreBuilder removed - replaced by StoreBuilderV3 (imported above)
import { StorefrontV2 } from './pages/StorefrontV2';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotFound } from './pages/NotFound';
import { AllLegalDocuments } from './pages/legal/AllLegalDocuments';
import { ContractorSignup } from './pages/ContractorSignup';
import { AdsPortal } from './pages/AdsPortal';
import { DriverSignupAI } from './pages/DriverSignupAI';
import { TemplateGallery } from './components/TemplateGallery';
import { AIProductListingPage } from './pages/AIProductListingPage';
import { PremiumFeaturesDashboard } from './components/PremiumFeaturesDashboard';
import { LoginPage } from './pages/LoginPageSimple';
import { AIDocumentAssistant } from './pages/AIDocumentAssistant';
import { QRScanner, OrderTracking } from './components/QRReceiptSystem';
import { DigitalServicesHub } from './pages/DigitalServicesHub';
import { LandingPageCRO } from './pages/LandingPageCRO';
import { SpinWheelPage } from './components/SpinWheelPage';
import { LoyaltyPage } from './components/LoyaltyPage';
import { useGamificationInit } from './services/gamificationIntegration';
import { BecomeSellerPage } from './pages/BecomeSellerPage';
import { EmailCampaignsPage } from './pages/EmailCampaignsPage';
import { GamePassProPage } from './pages/GamePassProPage';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { VendorDirectoryPage } from './pages/VendorDirectoryPage';
import { ProStoreFeaturesPage } from './pages/ProStoreFeaturesPage';
import { SuccessStoriesPage } from './pages/SuccessStoriesPage';
import { HelpSupportPage } from './pages/HelpSupportPage';
import { ReferralProgramPage } from './pages/ReferralProgramPage';
import { AffiliateEarningsDashboard } from './pages/AffiliateEarningsDashboard';
import { SellerOnboardingPage } from './pages/SellerOnboardingPage';
import { PartnershipPage } from './pages/PartnershipPage';


// Layout wrapper for pages that require top padding (everything except Home)
const PageLayout = () => {
  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
};

import ScrollToTop from './components/ScrollToTop';
import { useLocation } from 'react-router-dom';

const LocationLogger = () => {
  const location = useLocation();
  console.log('📍 Current Location:', location.pathname, location.hash, location.search);
  return null;
};

const App: React.FC = () => {
  console.log('App Component Rendering');
  
  // Initialize gamification on app load
  useGamificationInit();
  
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen font-sans text-gray-900 bg-white">
        <LocationLogger />
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Home Page has its own layout (hero goes under navbar) */}
            <Route path="/" element={<LandingPageCRO />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/landing" element={<LandingPageCRO />} />

            {/* Pages with padding */}
            <Route element={<PageLayout />}>
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signin" element={<LoginPage />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/stores" element={<Directory />} />
              {/* All store creation routes use StoreBuilderV3 (single source of truth) */}
              <Route path="/create-store" element={<StoreBuilderV3 />} />
              <Route path="/create-store-simple" element={<Navigate to="/create-store" replace />} />
              <Route path="/create-store-v2" element={<Navigate to="/create-store" replace />} />
              <Route path="/create-store-v1" element={<Navigate to="/create-store" replace />} />
              <Route path="/tax-dashboard" element={<MerchantTaxDashboard />} />
              <Route path="/admin-financial" element={<AdminFinancialDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/bot-settings" element={<ProtectedRoute><StoreBotSettings /></ProtectedRoute>} />
              <Route path="/classifieds" element={<Classifieds />} />

              {/* Landing Pages - The "Sales" Layer */}
              <Route path="/solutions/marketplace" element={<MarketplaceLanding />} />
              <Route path="/solutions/rides" element={<RidesLanding />} />
              <Route path="/solutions/jobs" element={<JobsLanding />} />
              <Route path="/solutions/living" element={<LivingLanding />} />
              <Route path="/solutions/stores" element={<StoreServicesLanding />} />

              {/* Service Landing Pages */}
              <Route path="/services/stores" element={<StoreServicesLanding />} />
              <Route path="/services/food" element={<FoodServicesLanding />} />
              <Route path="/services/marketplace" element={<MarketplaceLanding />} />
              <Route path="/services/rides" element={<RidesLanding />} />
              <Route path="/services/jobs" element={<JobsLanding />} />
              <Route path="/services/tickets" element={<TicketsLanding />} />
              <Route path="/services/living" element={<LivingLanding />} />

              {/* SEO-friendly product hub aliases for launch campaigns */}
              <Route path="/online-stores" element={<StoreServicesLanding />} />
              <Route path="/food-restaurants" element={<FoodServicesLanding />} />
              <Route path="/restaurants" element={<FoodServicesLanding />} />
              <Route path="/events-tickets" element={<TicketsLanding />} />
              <Route path="/store-templates" element={<TemplateGallery onSelectTemplate={(template) => console.log('Selected:', template)} />} />

              {/* Store Builder & Storefront */}
              <Route path="/store-builder" element={<StoreBuilderV3 />} />
              <Route path="/store/builder" element={<Navigate to="/store-builder" replace />} />
              <Route path="/store/:slug/v2" element={<Navigate to="/store/:slug" replace />} />

              {/* Ticket Ecosystem */}
              <Route path="/solutions/tickets" element={<TicketsLanding />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/tickets/onboarding" element={<PromoterOnboarding />} />

              {/* Core Flows */}
              <Route path="/signup" element={<SignupPageSimple />} />
              <Route path="/get-started" element={<SmartOnboarding />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminSignup />} />
              <Route path="/admin/bypass" element={<AdminBypass />} />
              <Route path="/ads-portal" element={<ProtectedRoute><AdsPortal /></ProtectedRoute>} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/affiliate" element={<AffiliateProgram />} />
              <Route path="/earn" element={<AffiliateDashboard />} />
              <Route path="/marketplace" element={<MarketplaceLanding />} />

              {/* Vertical Specific Pages */}
              <Route path="/rides" element={<Rides />} />
              <Route path="/drive-with-us" element={<DriveWithUs />} />
              <Route path="/driver/onboarding" element={<DriverOnboarding />} />
              <Route path="/driver/signup" element={<DriverSignupAI />} />
              <Route path="/drive/signup" element={<DriverSignupAI />} />
              <Route path="/driver/hub" element={<DriverHub />} />
              <Route path="/driver/dashboard" element={<DriverHub />} />

              {/* Payment & Order Tracking */}
              <Route path="/cod-tracking/:orderId" element={<CODTrackingPage />} />

              {/* NEW ROUTES - Template Gallery & AI Features */}
              <Route path="/debug-upload" element={<DebugUpload />} />
              <Route path="/templates" element={<TemplateGallery onSelectTemplate={(template) => console.log('Selected:', template)} />} />
              <Route path="/products/ai-add" element={<AIProductListingPage />} />
              <Route path="/premium-features" element={<PremiumFeaturesDashboard />} />
              <Route path="/documents" element={<DocumentCenter />} />
              <Route path="/ai-documents" element={<DocumentCenter />} />
              <Route path="/document-center" element={<DocumentCenter />} />
              <Route path="/digital" element={<DigitalServicesHub />} />
              <Route path="/digital-services" element={<DigitalServicesHub />} />
              <Route path="/game-pass" element={<DigitalServicesHub />} />
              <Route path="/gift-cards" element={<DigitalServicesHub />} />
              <Route path="/scan" element={<QRScanner onScan={(id) => { window.location.href = `/cod-tracking/${id}`; }} />} />

              {/* 🎰 GAMIFICATION ROUTES */}
              <Route path="/spin-wheel" element={<ProtectedRoute><SpinWheelPage /></ProtectedRoute>} />
              <Route path="/loyalty" element={<ProtectedRoute><LoyaltyPage /></ProtectedRoute>} />
              <Route path="/my-rewards" element={<ProtectedRoute><LoyaltyPage /></ProtectedRoute>} />

              {/* 🛍️ MERCHANT & SELLER ROUTES */}
              <Route path="/become-seller" element={<BecomeSellerPage />} />
              <Route path="/seller-signup" element={<BecomeSellerPage />} />
              <Route path="/merchant-dashboard" element={<ProtectedRoute><MerchantDashboard /></ProtectedRoute>} />
              <Route path="/seller-dashboard" element={<ProtectedRoute><MerchantDashboard /></ProtectedRoute>} />
              <Route path="/vendors" element={<VendorDirectoryPage />} />
              <Route path="/vendor-directory" element={<VendorDirectoryPage />} />
              <Route path="/pro-features" element={<ProStoreFeaturesPage />} />
              <Route path="/store-features" element={<ProStoreFeaturesPage />} />
              
              {/* 📧 EMAIL MARKETING */}
              <Route path="/email-campaigns" element={<ProtectedRoute><EmailCampaignsPage /></ProtectedRoute>} />
              <Route path="/marketing/email" element={<ProtectedRoute><EmailCampaignsPage /></ProtectedRoute>} />
              
              {/* 🎮 GAME PASS */}
              <Route path="/game-pass-pro" element={<GamePassProPage />} />
              <Route path="/gaming/gamepass" element={<GamePassProPage />} />

              {/* 📚 SUCCESS & HELP */}
              <Route path="/success-stories" element={<SuccessStoriesPage />} />
              <Route path="/stories" element={<SuccessStoriesPage />} />
              <Route path="/help" element={<HelpSupportPage />} />
              <Route path="/support" element={<HelpSupportPage />} />

              {/* 💰 COD MANAGEMENT */}
              <Route path="/cod-dashboard" element={<ProtectedRoute><CODDashboard /></ProtectedRoute>} />
              <Route path="/orders/cod" element={<ProtectedRoute><CODDashboard /></ProtectedRoute>} />

              {/* 💼 REFERRAL & AFFILIATE */}
              <Route path="/referral" element={<ReferralProgramPage />} />
              <Route path="/affiliate/dashboard" element={<ProtectedRoute><AffiliateDashboard /></ProtectedRoute>} />
              <Route path="/affiliate/earnings" element={<ProtectedRoute><AffiliateDashboard /></ProtectedRoute>} />
              <Route path="/referral/dashboard" element={<ProtectedRoute><AffiliateDashboard /></ProtectedRoute>} />

              {/* 🚀 SELLER ONBOARDING */}
              <Route path="/seller-onboarding" element={<SellerOnboardingPage />} />
              {/* Note: /get-started is mapped to SmartOnboarding above (line ~197).
                  Removed duplicate route here — React Router first-match means this
                  was unreachable dead code. SellerOnboardingPage is still at /seller-onboarding. */}

              {/* 🤝 PARTNERSHIPS */}
              <Route path="/partnerships" element={<PartnershipPage />} />
              <Route path="/partners" element={<PartnershipPage />} />
              <Route path="/integrations" element={<PartnershipPage />} />

              <Route path="/jobs" element={<Jobs />} />
              <Route path="/work/profile" element={<JobProfile />} />

              <Route path="/real-estate" element={<RealEstate />} />
              <Route path="/real-estate/sell" element={<ListProperty />} />
              <Route path="/real-estate/dashboard" element={<RealEstateAgentDashboard />} />
              <Route path="/real-estate/agent" element={<RealEstateAgentDashboard />} />
              <Route path="/real-estate/agent-signup" element={<RealEstateAgentDashboard />} />

              {/* Blog & Content */}
              <Route path="/search" element={<SearchResults />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/blog/location/:slug" element={<LocationBlogPost />} />

              <Route path="/admin/blog-generator" element={<ProtectedRoute><BlogGenerator /></ProtectedRoute>} />
              <Route path="/admin/blog-dashboard" element={<ProtectedRoute><AdminBlogDashboard /></ProtectedRoute>} />
              <Route path="/admin/keywords" element={<ProtectedRoute><KeywordDashboard /></ProtectedRoute>} />
            </Route>

            {/* Admin Command Center Sub-Website - No ProtectedRoute to allow bypass */}
            <Route path="/admin/command-center" element={<AdminLayout />}>
              <Route index element={<CommandCenter />} />
              <Route path="traffic-hub" element={<TrafficHub />} />
              <Route path="ads-engine" element={<AdsEngine />} />
              <Route path="video-control" element={<VideoControlCenter />} />
              <Route path="seo-keyword-hub" element={<KeywordDashboard />} />
              <Route path="content-ai-center" element={<ContentAICenter />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="marketplace-monitor" element={<MarketplaceMonitor />} />
              <Route path="jobs-monitor" element={<JobsMonitor />} />
              <Route path="real-estate-monitor" element={<RealEstateMonitor />} />
              <Route path="rideshare-fleet" element={<RideshareFleet />} />
              <Route path="tickets-events-monitor" element={<TicketsMonitor />} />
              <Route path="trust-and-safety" element={<TrustSafety />} />
              <Route path="messaging-center" element={<MessagingCenter />} />
              <Route path="finance-and-payouts" element={<FinancePayouts />} />
              <Route path="system-health" element={<SystemHealth />} />
              <Route path="automations" element={<Automations />} />
              <Route path="developer-tools" element={<DeveloperTools />} />
              <Route path="reports-and-analytics" element={<ReportsAnalytics />} />
            </Route>

            <Route element={<PageLayout />}>
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
              <Route path="/events" element={<TicketsLanding />} />
              <Route path="/contact" element={<Contact />} />

              {/* Legal Documents */}
              <Route path="/terms" element={<Legal type="terms" />} />
              <Route path="/privacy" element={<Legal type="privacy" />} />
              <Route path="/contractor-agreement" element={<ContractorSignup />} />
              <Route path="/liability-waiver" element={<Legal type="liability-waiver" />} />
              <Route path="/affiliate-terms" element={<Legal type="affiliate-terms" />} />
              <Route path="/document-disclaimer" element={<Legal type="document-disclaimer" />} />
              <Route path="/legal/all" element={<AllLegalDocuments />} />
            </Route>

            {/* AI Listing System */}
            <Route path="/ai-listings" element={<AIListingDashboard />} />

            {/* Short Slug Redirect */}
            <Route path="/s/:shortSlug" element={<ShortSlugRedirect />} />

            {/* Storefront Routes - Using V2 as primary */}
            <Route path="/store/:slug" element={<StorefrontV2 />} />
            <Route path="/store/:id/v1" element={<Storefront />} />
            <Route path="/store/preview" element={<StorefrontV2 />} />

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </main>
        <Footer />

        {/* Global Chatbot for Platform Support */}
        <ChatWidget mode="platform" />
      </div>
    </Router>
  );
};

export default App;
