/**
 * Wrapper component for LoyaltyPointsDashboard that gets userId from Supabase auth
 * Handles the userId injection automatically
 */

import React, { useEffect, useState } from 'react';
import { LoyaltyPointsDashboard } from './LoyaltyPointsDashboard';
import { supabase } from '../services/supabaseClient';

export const LoyaltyPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return <LoyaltyPointsDashboard userId={userId} />;
};

export default LoyaltyPage;
