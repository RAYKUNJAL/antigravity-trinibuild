import React from 'react';
import { Helmet } from 'react-helmet-async';
import { JuvayPriceTable } from '../components/JuvayPriceTable';
import { FREE_LISTING_LIMIT } from '../services/juvayPlans';

export const Pricing: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Pricing | Juvay</title>
        <meta
          name="description"
          content={`Juvay Free / Starter / Business. Free plan includes ${FREE_LISTING_LIMIT} listings. Cash pickup and COD. Paid plans open when Wam can take the money.`}
        />
        <link rel="canonical" href="https://juvay.app/pricing" />
      </Helmet>
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-gray-900 mb-3">One TTD price table</h1>
            <p className="text-gray-600">
              Free, Starter, and Business. {FREE_LISTING_LIMIT} listings on Free. No USD menu. No 0% commission claim.
            </p>
          </div>
          <JuvayPriceTable />
        </div>
      </div>
    </>
  );
};
