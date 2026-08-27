/**
 * /pricing — one TTD table. Paid CTAs stay hidden until bank checkout is a real path.
 */
import React from 'react';
import { Check } from 'lucide-react';
import { JuvayPriceTable } from '../components/JuvayPriceTable';
import { FREE_LISTING_LIMIT } from '../services/juvayPlans';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Start Free. Bank payment setup in progress.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            One TTD table: Free, Starter, Business. Cash pickup and COD on Free.
            No USD menu. No 0% commission claim.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        <JuvayPriceTable />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">What Free includes</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-2">
              {[
                `List up to ${FREE_LISTING_LIMIT} products`,
                'juvay.app store slug',
                'Cash at pickup',
                'Cash on delivery',
                'SSL on juvay.app',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment questions</h2>
          <dl className="space-y-4 text-sm text-gray-600">
            <div>
              <dt className="font-semibold text-gray-900">Is Free really free?</dt>
              <dd>Yes. {FREE_LISTING_LIMIT} listings, cash pickup, and COD. No credit card.</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">How do I pay for Starter or Business?</dt>
              <dd>Those CTAs stay hidden until bank checkout is a real path. A charge does not auto-upgrade a plan.</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
