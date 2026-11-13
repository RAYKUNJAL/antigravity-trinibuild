import React from 'react';
import { useNavigate } from 'react-router-dom';
import { JuvayPriceTable } from '../components/JuvayPriceTable';
import {
  PREMIUM_PRICE_COPY,
  FREE_INCLUDES_COPY,
  PREMIUM_INCLUDES_COPY,
  EXTRA_TRACKED_VEHICLE_PRICE_COPY,
  EXTRA_TRACKED_VEHICLE_INCLUDES_COPY,
  PAID_UPGRADE_UNAVAILABLE_COPY,
} from '../services/juvayPlans';

export const ProStoreFeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#E61E2B] to-red-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-6">Juvay plans</h1>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Free and Premium only. {PREMIUM_PRICE_COPY}. {PAID_UPGRADE_UNAVAILABLE_COPY}
          </p>
          <button
            onClick={() => navigate('/create-store')}
            className="bg-white text-[#E61E2B] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            Start Your Free Store
          </button>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-black mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600">{FREE_INCLUDES_COPY}</p>
            <p className="text-gray-600 mt-2">Premium: {PREMIUM_PRICE_COPY}. {PREMIUM_INCLUDES_COPY}.</p>
          </div>
          <JuvayPriceTable />
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900">Extra tracked vehicle</h3>
            <p className="text-gray-700 mt-2">{EXTRA_TRACKED_VEHICLE_PRICE_COPY}. {EXTRA_TRACKED_VEHICLE_INCLUDES_COPY}.</p>
            <p className="text-sm text-gray-500 mt-3">{PAID_UPGRADE_UNAVAILABLE_COPY}</p>
          </div>
        </div>
      </section>
    </div>
  );
};
