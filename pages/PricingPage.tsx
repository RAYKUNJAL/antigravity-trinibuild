/**
 * /pricing — one TTD table. Paid CTAs stay hidden until bank checkout is a real path.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { JuvayPriceTable } from '../components/JuvayPriceTable';
import { PremiumOffer } from '../components/PremiumOffer';
import { YouKeepCalculator } from '../components/YouKeepCalculator';
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
            Free is free, with unlimited listings and 0% on cash. Premium is the year-end paid offer
            at TT$49/month for three months, then TT$79, with a 2.5% online fee. Checkout for paid plans stays off until it is opened.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <JuvayPriceTable />
          </div>
          <PremiumOffer />
          <YouKeepCalculator defaultDollars={100} planSlug="premium" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">What Free includes</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-2">
              {[
                'Unlimited product listings',
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
          <h2 className="text-xl font-bold text-gray-900 mb-3">Transaction fees</h2>
          <p className="text-sm text-gray-600 mb-3">
            Free store, unlimited listings, 0% on cash. 4.5% on Free and 2.5% on Premium
            for successful online Wam sales, capped at TT$25. No listing, payout, or monthly fee on Free.
            30-day notice before any change. Ads optional. Discounts opt-in only.
          </p>
          <Link to="/fees" className="text-sm font-semibold text-red-600 hover:underline">See the full rate card →</Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment questions</h2>
          <dl className="space-y-4 text-sm text-gray-600">
            <div>
              <dt className="font-semibold text-gray-900">Is Free really free?</dt>
              <dd>Yes. unlimited listings, cash pickup, and COD. No credit card.</dd>
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
