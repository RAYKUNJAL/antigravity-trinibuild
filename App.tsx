
import React from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Directory } from './pages/Directory';
import { StoreCreator } from './pages/StoreCreator';
import { Dashboard } from './pages/Dashboard';
import { Storefront } from './pages/Storefront';
import { AdminDashboard } from './pages/AdminDashboard';
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
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { Legal } from './pages/Legal';
import { RealEstate } from './pages/RealEstate';
import { RealEstateAgentDashboard } from './pages/RealEstateAgentDashboard';
import { Tickets } from './pages/Tickets';
import { UserProfile } from './pages/UserProfile';
import { Classifieds } from './pages/Classifieds';
import { AffiliateProgram } from './pages/AffiliateProgram';

// Landing Pages (NLP Optimized)
import { MarketplaceLanding } from './pages/landing/MarketplaceLanding';
import { RidesLanding } from './pages/landing/RidesLanding';
import { JobsLanding } from './pages/landing/JobsLanding';
import { TicketsLanding } from './pages/landing/TicketsLanding';
import { PromoterOnboarding } from './pages/PromoterOnboarding';
import { LivingLanding } from './pages/landing/LivingLanding';

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
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen font-sans text-gray-900 bg-white">
        <LocationLogger />
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Home Page has its own layout (hero goes under navbar) */}
            <Route path="/" element={<Home />} />

            {/* Pages with padding */}
            <Route element={<PageLayout />}>
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/create-store" element={<StoreCreator />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/bot-settings" element={<StoreBotSettings />} />
              <Route path="/classifieds" element={<Classifieds />} />

              {/* Landing Pages - The "Sales" Layer */}
              <Route path="/solutions/marketplace" element={<MarketplaceLanding />} />
              <Route path="/solutions/rides" element={<RidesLanding />} />
              <Route path="/solutions/jobs" element={<JobsLanding />} />
              <Route path="/solutions/living" element={<LivingLanding />} />

              {/* Ticket Ecosystem */}
              <Route path="/solutions/tickets" element={<TicketsLanding />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/tickets/onboarding" element={<PromoterOnboarding />} />

              {/* Functional App Pages - The "Utility" Layer */}
              <Route path="/earn" element={<Earn />} />

              {/* Support & Content */}
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/terms" element={<Legal type="terms" />} />
              <Route path="/privacy" element={<Legal type="privacy" />} />
              <Route path="/contractor-agreement" element={<Legal type="contractor-agreement" />} />
              <Route path="/liability-waiver" element={<Legal type="liability-waiver" />} />
              <Route path="/affiliate-terms" element={<Legal type="affiliate-terms" />} />
              <Route path="/document-disclaimer" element={<Legal type="document-disclaimer" />} />
            </Route>

            {/* Storefront Route */}
            <Route path="/store/:id" element={<Storefront />} />
            <Route path="/store/preview" element={<Storefront />} />

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
