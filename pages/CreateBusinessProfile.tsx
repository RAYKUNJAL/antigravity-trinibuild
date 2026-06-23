import React from 'react';
import { BusinessProfileWizard } from '../components/business/BusinessProfileWizard';

export const CreateBusinessProfile: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Your Business Profile</h1>
      <BusinessProfileWizard />
    </div>
  );
};
