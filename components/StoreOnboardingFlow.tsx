import React from 'react';
import { Navigate } from 'react-router-dom';

/** Retired second template farm. One catalog lives on /create-store. */
export const StoreOnboardingFlow: React.FC<{ onComplete?: (storeData: any) => void }> = () => (
  <Navigate to="/create-store" replace />
);

export default StoreOnboardingFlow;
