import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AIProductListing } from '../components/AIProductListing';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

/**
 * /products/ai-add — route-level wrapper.
 *
 * Accepts ?storeId=... so the merchant dashboard can deep-link here and skip
 * the "find your store" resolve step in the component. If no storeId is
 * given, the component itself resolves the user's most recently-created store.
 *
 * If the user isn't logged in, we bounce them to /login first.
 */
export const AIProductListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const storeIdParam = params.get('storeId') || undefined;

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const timeout = new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), 5000);
      });
      const authResult = await Promise.race([
        supabase.auth.getUser().then(({ data }) => data.user).catch(() => null),
        timeout,
      ]);

      if (cancelled) return;
      if (!authResult) {
        navigate('/login?redirect=/products/ai-add');
        return;
      }
      setCheckingAuth(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking your account…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#E61E2B] font-semibold transition-colors"
            >
              <ArrowLeft size={18} /> Back
            </motion.button>
            <div className="h-5 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E61E2B]" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">AI Product Lister</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AIProductListing storeId={storeIdParam} />
        </motion.div>
      </div>
    </div>
  );
};

export default AIProductListingPage;
