/**
 * Wrapper component for SpinWheel that gets userId from auth context
 * Handles the userId injection automatically
 */

import React from 'react';
import { SpinWheelComponent } from './SpinWheelComponent';
import { useAuth } from '../hooks/useAuth';

export const SpinWheelPage: React.FC = () => {
  const { user } = useAuth();

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return <SpinWheelComponent userId={user.id} />;
};

export default SpinWheelPage;
