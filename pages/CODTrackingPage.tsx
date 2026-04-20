import React from 'react';
import { useParams } from 'react-router-dom';
import { CODOrderTracking } from '../components/CODOrderTracking';
import { SEO } from '../components/SEO';

export const CODTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600">Please check your order link and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Track Your COD Order | TriniBuild"
        description="Track your Cash on Delivery order in real-time. See your driver's location and estimated delivery time."
        keywords="cod tracking, order tracking trinidad, cash on delivery tracking, trinibuild tracking"
      />
      <CODOrderTracking orderId={orderId} />
    </>
  );
};
