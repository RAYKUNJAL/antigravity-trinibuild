/**
 * Wrapper component for LoyaltyPointsDashboard that gets userId from auth context
 * Handles the userId injection automatically
 */

import React from 'react';
import { LoyaltyPointsDashboard } from './LoyaltyPointsDashboard';
import { useAuth } from '../hooks/useAuth';

export const LoyaltyPage: React.FC = () => {
  const { user } = useAuth();

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return <LoyaltyPointsDashboard userId={user.id} />;
};

export default LoyaltyPage;
