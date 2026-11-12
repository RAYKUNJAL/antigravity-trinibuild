import React from 'react';
import { Helmet } from 'react-helmet-async';
import { JuvayPriceTable } from '../components/JuvayPriceTable';
import { premiumPriceCopy } from '../services/juvayPlans';

export const Pricing: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Pricing | Juvay</title>
        <meta
          name="description"
          content={`Juvay Free and Premium. Free includes unlimited listings, cash pickup, and COD. Premium is ${premiumPriceCopy()}, with a 2.5% online Wam fee capped at TT$25. Checkout is not open yet.`}
        />
        <link rel="canonical" href="https://juvay.app/pricing" />
      </Helmet>
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-gray-900 mb-3">One TTD price table</h1>
            <p className="text-gray-600">
              Free and Premium. Unlimited listings on Free. {premiumPriceCopy()}. 0% Juvay commission on cash. Checkout for Premium is not open yet.
            </p>
          </div>
          <JuvayPriceTable />
        </div>
      </div>
    </>
  );
};
