import React from 'react';
import { Helmet } from 'react-helmet-async';
import { JuvayPriceTable } from '../components/JuvayPriceTable';
import { premiumPriceCopy, FREE_INCLUDES_COPY, PREMIUM_INCLUDES_COPY, PAID_UPGRADE_UNAVAILABLE_COPY } from '../services/juvayPlans';

export const Pricing: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Pricing | Juvay</title>
        <meta
          name="description"
          content={`Juvay Free and Premium. Free: ${FREE_INCLUDES_COPY}. Premium is ${premiumPriceCopy()}. ${PREMIUM_INCLUDES_COPY}. ${PAID_UPGRADE_UNAVAILABLE_COPY}`}
        />
        <link rel="canonical" href="https://juvay.app/pricing" />
      </Helmet>
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-gray-900 mb-3">One TTD price table</h1>
            <p className="text-gray-600">
              Free and Premium. {FREE_INCLUDES_COPY}. Premium is {premiumPriceCopy()}. {PREMIUM_INCLUDES_COPY}. {PAID_UPGRADE_UNAVAILABLE_COPY}
            </p>
          </div>
          <JuvayPriceTable />
        </div>
      </div>
    </>
  );
};
