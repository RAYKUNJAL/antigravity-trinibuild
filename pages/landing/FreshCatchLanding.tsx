/**
 * Honest Juvay Fresh Catch vertical page.
 * No invented depots, catch, prices, reviews, or counts.
 * The live market is on FRESH_CATCH_APP_URL (freshcatch.trinibuild.com).
 * Wam pay→fulfill is not claimed here.
 */
import React from 'react';
import { Fish, Banknote, Wallet, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { ServicesShowcase } from '../../components/ServicesShowcase';
import {
  FRESH_CATCH_APP_URL,
  FRESH_CATCH_DESCRIPTION,
  FRESH_CATCH_TAGLINE,
  FRESH_CATCH_TITLE,
} from '../../services/freshCatchLink';

export const FreshCatchLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFF8F0] font-sans text-[#141414]">
      <SEO
        title={`${FRESH_CATCH_TITLE} — seafood from local fishermen | Juvay`}
        description={FRESH_CATCH_DESCRIPTION}
        keywords="juvay fresh catch, caribbean seafood, trinidad fishermen, depot fish market, cash pickup seafood"
        url="https://juvay.app/fresh-catch"
      />

      <section className="bg-[#0b1f24] px-4 pb-16 pt-10 text-[#fff8f0] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#c9b89a] hover:text-white">
            <ArrowLeft size={14} /> Back to Juvay
          </Link>
          <p className="mt-6 inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#fde68a]">
            A Juvay market
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            {FRESH_CATCH_TITLE}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#efe4d0]">
            {FRESH_CATCH_TAGLINE}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={FRESH_CATCH_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#ce1126] px-6 text-base font-bold text-white hover:bg-[#b50f21] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c14a]"
            >
              Open Fresh Catch <ArrowRight size={16} />
            </a>
            <a
              href={`${FRESH_CATCH_APP_URL}/sell`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white/80 px-6 text-base font-bold text-white hover:bg-white/10"
            >
              List your catch
            </a>
          </div>
          <p className="mt-4 text-sm text-[#c9b89a]">
            Opens {FRESH_CATCH_APP_URL.replace('https://', '')}. Listings come from that app — this page does not show a count.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e8dcc8] bg-white p-6 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Fish size={20} />
            </span>
            <h2 className="mt-4 text-lg font-bold">What you see is what is listed</h2>
            <p className="mt-2 text-[#4a453d] leading-relaxed">
              Browse catch from fishermen and depots who have posted on Fresh Catch. If the list is empty, there is no catch for sale yet. We do not seed demo depots or invent prices.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e8dcc8] bg-white p-6 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Banknote size={20} />
            </span>
            <h2 className="mt-4 text-lg font-bold">Cash first</h2>
            <p className="mt-2 text-[#4a453d] leading-relaxed">
              Pay the seller in cash when you pick up, or use cash on delivery. Cash pickup and COD carry 0% Juvay commission.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e8dcc8] bg-white p-6 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Wallet size={20} />
            </span>
            <h2 className="mt-4 text-lg font-bold">Online Wam when it is set up</h2>
            <p className="mt-2 text-[#4a453d] leading-relaxed">
              Wallet is offered first, then card. If Wam checkout is not configured, you will see an honest “not available yet” message — we will not call a payment complete until a real Wam payment is verified. We do not take PayPal.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#e8dcc8] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0d9488]">For fishermen and depots</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">List the catch you actually have</h2>
          <p className="mt-3 text-[#4a453d] leading-relaxed">
            Open Fresh Catch, sign up as a seller, and post what is on ice today. You set the price. Juvay does not invent a listing for you.
          </p>
          <a
            href={`${FRESH_CATCH_APP_URL}/sell`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#ce1126] px-5 text-sm font-bold text-white hover:bg-[#b50f21]"
          >
            Go to seller signup <ArrowRight size={14} />
          </a>
        </div>
      </section>

      <ServicesShowcase currentSlug="fresh-catch" />
    </div>
  );
};

export default FreshCatchLanding;
