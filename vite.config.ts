import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': { target: 'http://localhost:5000', changeOrigin: true, secure: false },
        '/ai':  { target: 'http://localhost:8000', changeOrigin: true, secure: false }
      }
    },
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) return 'vendor-react';
            if (id.includes('node_modules/@supabase/')) return 'vendor-supabase';
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-charts';
            if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'vendor-maps';
            if (id.includes('node_modules/framer-motion')) return 'vendor-animation';
            if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
            if (id.includes('node_modules/')) return 'vendor-misc';
            if (id.includes('/pages/admin/') || id.includes('/pages/CommandCenter') || id.includes('/components/admin/')) return 'app-admin';
            if (id.includes('/pages/AdsPortal') || id.includes('/pages/CaribAds') || id.includes('/components/ads/') || id.includes('/services/metaAds') || id.includes('/services/adAgent')) return 'app-ads';
            if (id.includes('/pages/StoreBuilder') || id.includes('/pages/StoreCreator') || id.includes('/pages/StoreDashboard')) return 'app-store-builder';
            if (id.includes('/pages/Jobs') || id.includes('/pages/Rides') || id.includes('/pages/Driver') || id.includes('/pages/RealEstate') || id.includes('/pages/Tickets') || id.includes('/pages/Classifieds')) return 'app-verticals';
            if (id.includes('/pages/AITools') || id.includes('/pages/ToolDetail') || id.includes('/pages/AIListing') || id.includes('/pages/AIProduct') || id.includes('/pages/DocumentCenter') || id.includes('/pages/DigitalServices')) return 'app-ai-tools';
            if (id.includes('/pages/Auth') || id.includes('/pages/Signup') || id.includes('/pages/Login') || id.includes('/pages/ForgotPassword') || id.includes('/pages/ResetPassword') || id.includes('/pages/JuvayOnboarding')) return 'app-auth';
            if (id.includes('/pages/Affiliate') || id.includes('/pages/Referral') || id.includes('/components/SpinWheel') || id.includes('/components/Loyalty') || id.includes('/services/gamification')) return 'app-growth';
            if (id.includes('/pages/landing/') || id.includes('/pages/LandingPage') || id.includes('/pages/DriveWithUs') || id.includes('/pages/CaribAdsLanding')) return 'app-landings';
            if (id.includes('/pages/JuvayDashboard') || id.includes('/pages/StorefrontV2') || id.includes('/pages/ExplorePage') || id.includes('/pages/PricingPage')) return 'app-core';
          }
        }
      }
    }
  };
});
