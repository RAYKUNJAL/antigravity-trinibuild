/**
 * Juvay home — immersive, 3D, high-converting landing.
 * Honesty: no invented stats, reviews, seller counts or proven pay→fulfill claims.
 */
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HeroStage } from '../components/landing/HeroStage';
import { StorySections } from '../components/landing/StorySections';
import { TemplateShowcase } from '../components/landing/TemplateShowcase';
import { FeeKeepCalculator } from '../components/landing/FeeKeepCalculator';
import { LandingFaq } from '../components/landing/LandingFaq';
import { StickyMobileCta } from '../components/landing/StickyMobileCta';
import { VisionDemo } from '../components/landing/VisionDemo';
import { FEE_DEFAULTS, formatFeePercent, formatTtdCents } from '../services/juvayFees';
import { FRESH_CATCH_APP_URL, FRESH_CATCH_PATH, FRESH_CATCH_TAGLINE, FRESH_CATCH_TITLE } from '../services/freshCatchLink';

function useDesktopHero() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return desktop;
}


const HOW = [
  {
    n: '1',
    title: 'Create your free store',
    body: 'Pick a starter, name your shop and you have a page. No credit card. Unlimited products.',
  },
  {
    n: '2',
    title: 'Add what you sell',
    body: 'Snap a photo to draft a name, then you type the TT$ price. Or type everything yourself.',
  },
  {
    n: '3',
    title: 'Share and get paid',
    body: 'Send your link on WhatsApp. Take cash pickup or cash on delivery at 0%. Sell online with Wam when you are ready.',
  },
];

const OG_IMAGE = 'https://juvay.app/og-juvay-home.png';
const TITLE = 'Your free Caribbean store — no credit card | Juvay';
const DESCRIPTION =
  'Juvay is the Amazon for the Caribbean. Every seller gets a free website and store — Unlimited products, 1 store, Wam online checkout at 4.5% fee (capped TT$25/order), 0% on cash/COD. No credit card. Sell online with Wam when you are ready.';

const faqJson = () => {
  const freePct = formatFeePercent(FEE_DEFAULTS.juvayFeeBpsFree);
  const cap = formatTtdCents(FEE_DEFAULTS.juvayFeeCapCents);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is it really free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes. Every Caribbean seller can create a free website and store. Unlimited products, 1 store, Wam online checkout at 4.5% fee (capped TT$25/order), 0% on cash/COD. No credit card. Juvay earns ${freePct} only when a buyer pays you online with Wam, capped at ${cap} per order.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need a credit card or a bank account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No credit card is required to create your store or to take cash orders. A Wam account is what vendors use to get paid out on online sales, in countries where Wam is available. You can start with cash pickup and cash on delivery alone.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get paid?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cash pickup and cash on delivery: the buyer pays you in cash, and that money is yours immediately. Online Wam payments are designed so the buyer pays through Wam, the order is marked paid, and the fee shows on your seller ledger. Cash and COD are available to use now.',
        },
      },
    ],
  };
};

function removeLcpShell() {
  const shell = document.getElementById('juvay-lcp-shell');
  if (shell) shell.remove();
}

export const LandingPageCRO: React.FC = () => {
  const [progress, setProgress] = useState(0.5);
  const onProgress = useCallback((t: number) => {
    // Hero opens on a finished stall (~0.5). The story adds products, phone, chat and pay.
    setProgress(0.5 + t * 0.5);
  }, []);

  const desktopHero = useDesktopHero();

  useLayoutEffect(() => {
    removeLcpShell();
  }, []);

  const freePct = formatFeePercent(FEE_DEFAULTS.juvayFeeBpsFree);

  return (
    <>
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href="https://juvay.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Juvay" />
        <meta property="og:title" content="Your free Caribbean store — no credit card" />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:url" content="https://juvay.app/" />
        <meta property="og:locale" content="en_TT" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your free Caribbean store — no credit card" />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Juvay',
            description: DESCRIPTION,
            url: 'https://juvay.app/',
            applicationCategory: 'ECommerce',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'TTD',
              description: 'Free online store. Unlimited products, 1 store, Wam online checkout at 4.5% fee (capped TT$25/order), 0% on cash/COD. No credit card required.',
            },
          })}
        </script>
        <script type="application/ld+json">{JSON.stringify(faqJson())}</script>
      </Helmet>

      <a
        href="#juvay-hero-copy"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-[#141414]"
      >
        Skip to content
      </a>

      <div className="bg-[#0b1f24] font-sans text-[#141414] pb-20 md:pb-0">
        {/* Mobile: compact CTA near the top, then a real-height stall (poster fallback stays). */}
        {!desktopHero ? (
        <div>
          <section className="bg-[#0b1f24] px-5 pb-4 pt-20 text-[#fff8f0] sm:px-8">
            <div id="juvay-hero-copy" className="mx-auto w-full max-w-xl">
              <p className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#fde68a]">
                The Amazon for the Caribbean
              </p>
              <h1 className="mt-4 text-[2.05rem] font-black leading-[1.08] tracking-tight">
                Your free store.
                <br />
                <span className="text-[#f5c14a]">No credit card.</span>
              </h1>
              <div id="juvay-hero-cta" className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/create-store"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#ce1126] px-6 py-3 text-base font-bold text-white shadow-lg hover:bg-[#b50f21] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c14a]"
                >
                  Create your free store
                </Link>
                <Link
                  to="/templates"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white/80 px-6 py-3 text-base font-bold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c14a]"
                >
                  See templates
                </Link>
              </div>
            </div>
          </section>
          <div className="relative h-[58svh] min-h-[380px] w-full">
            <HeroStage progress={progress} />
          </div>
          <div className="bg-[#0b1f24] px-5 pb-10 pt-6 text-[#fff8f0] sm:px-8">
            <div className="mx-auto w-full max-w-xl">
              <p className="text-base leading-relaxed text-[#efe4d0]">
                Every Caribbean seller gets a free website and store — doubles vendors, corn soup and fried chicken, fish
                and market stalls, boutiques. Unlimited products. 0% on cash and COD. Sell
                online with Wam when you are ready.
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#efe4d0]">
                <li className="flex items-center gap-1.5">
                  <CheckIcon /> Unlimited products
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckIcon /> No credit card
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckIcon /> 0% on cash
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckIcon /> Be one of the first sellers
                </li>
              </ul>
              <p className="mt-4 text-sm text-[#c9b89a]">
                Free to start. Juvay takes {freePct} only on online Wam sales, capped at{' '}
                {formatTtdCents(FEE_DEFAULTS.juvayFeeCapCents)}.
              </p>
            </div>
          </div>
          <StorySections onProgress={onProgress} />
        </div>
        ) : (
        <div className="relative pb-[100svh] -mb-[100svh]">
          <div className="sticky top-0 z-0 h-[100svh] w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[46%] bg-[#0b1f24]" />
            <div className="absolute inset-y-0 left-[46%] w-[54%]">
              <HeroStage progress={progress} />
            </div>
          </div>

          <div className="relative z-10 -mt-[100svh]">
            <section className="grid min-h-[100svh] grid-cols-[minmax(0,46%)_minmax(0,54%)]">
              <div id="juvay-hero-copy" className="flex bg-[#0b1f24] items-center px-12 pt-24 pb-16 text-[#fff8f0]">
                <div className="mx-auto w-full max-w-xl">
                  <p className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#fde68a]">
                    The Amazon for the Caribbean
                  </p>
                  <h1 className="mt-5 text-6xl font-black leading-[1.08] tracking-tight">
                    Your free store.
                    <br />
                    <span className="text-[#f5c14a]">No credit card.</span>
                  </h1>
                  <p className="mt-5 text-lg leading-relaxed text-[#efe4d0]">
                    Every Caribbean seller gets a free website and store — doubles vendors, corn soup and fried chicken, fish
                    and market stalls, boutiques. Unlimited products. 0% on cash and COD. Sell
                    online with Wam when you are ready.
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#efe4d0]">
                    <li className="flex items-center gap-1.5">
                      <CheckIcon /> Unlimited products
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckIcon /> No credit card
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckIcon /> 0% on cash
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckIcon /> Be one of the first sellers
                    </li>
                  </ul>
                  <div id="juvay-hero-cta" className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/create-store"
                      className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#ce1126] px-6 py-3 text-base font-bold text-white shadow-lg hover:bg-[#b50f21] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c14a]"
                    >
                      Create your free store
                    </Link>
                    <Link
                      to="/templates"
                      className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white/80 px-6 py-3 text-base font-bold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c14a]"
                    >
                      See templates
                    </Link>
                  </div>
                  <p className="mt-4 text-sm text-[#c9b89a]">
                    Free to start. Juvay takes {freePct} only on online Wam sales, capped at{' '}
                    {formatTtdCents(FEE_DEFAULTS.juvayFeeCapCents)}.
                  </p>
                </div>
              </div>
              <div className="pointer-events-none" aria-hidden />
            </section>

            <StorySections onProgress={onProgress} />
          </div>
        </div>
        )}

        {/* How it works — 3 clear steps, solid surface after the 3D story */}
        <section id="how-it-works" className="scroll-mt-20 bg-[#FFF8F0] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0d9488]">How it works</p>
              <h2 className="text-3xl font-black tracking-tight text-[#141414] sm:text-4xl">
                Three steps, from stall to store
              </h2>
            </div>
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {HOW.map((s) => (
                <li key={s.n} className="rounded-2xl border border-[#e8dcc8] bg-white p-6 shadow-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ce1126] font-black text-white">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-[#141414]">{s.title}</h3>
                  <p className="mt-2 text-[#4a453d] leading-relaxed">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>


        {/* Lead magnets — honest, not a live Premium checkout */}
        <section id="bring-store" className="bg-[#FFF8F0] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e8dcc8] bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0d9488]">Free for every seller</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-[#141414]">5 free photo listings</h2>
              <p className="mt-3 text-[#4a453d] leading-relaxed">
                Snap a photo to draft a name and description. You type the TT$ price. Vision never sets the price. After five,
                unlimited photo listings come with Premium.
              </p>
              <Link
                to="/create-store"
                className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#ce1126] px-5 text-sm font-bold text-white hover:bg-[#b50f21]"
              >
                Try a photo listing
              </Link>
            </div>
            <div className="rounded-2xl border border-[#e8dcc8] bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0d9488]">Coming with Premium</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-[#141414]">Bring my store over</h2>
              <p className="mt-3 text-[#4a453d] leading-relaxed">
                Point us at a public store URL, upload a CSV, or add bulk photos. Everything lands as a draft you review and
                confirm. Prices are kept only when they are on the source or typed by you.
              </p>
              <Link
                to="/import-store"
                className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-[#141414] px-5 text-sm font-bold text-[#141414] hover:bg-[#141414] hover:text-white"
              >
                See how import works
              </Link>
            </div>
          </div>
        </section>

        <TemplateShowcase />
        <FeeKeepCalculator />

        {/* Cash-first reassurance */}
        <section className="bg-[#0b1f24] px-4 py-16 text-[#fff8f0] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Cash first. Online when you are ready.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#efe4d0]">
              Plenty of Caribbean sellers live on cash — and that is fine. Cash pickup and cash on delivery stay free, with 0% on cash and COD.
              Online Wam payments are how buyers can pay you by wallet or card later. We explain how that is
              designed to work; we will not call it proven until a live order has been walked through.
            </p>
          </div>
        </section>


        {/* Fresh Catch vertical — honest entry, no invented depot counts */}
        <section id="fresh-catch" className="scroll-mt-20 bg-[#FFF8F0] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#e8dcc8] bg-[#0b1f24] text-[#fff8f0] shadow-sm">
            <div className="grid gap-8 p-8 md:grid-cols-2 md:items-center md:p-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#fde68a]">A Juvay market</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{FRESH_CATCH_TITLE}</h2>
                <p className="mt-4 text-lg leading-relaxed text-[#efe4d0]">{FRESH_CATCH_TAGLINE}</p>
                <p className="mt-3 text-sm text-[#c9b89a]">
                  0% on cash and COD. Online Wam when it is set up. We do not take PayPal.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={FRESH_CATCH_PATH}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#ce1126] px-6 text-base font-bold text-white hover:bg-[#b50f21]"
                  >
                    About Fresh Catch
                  </Link>
                  <a
                    href={FRESH_CATCH_APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white/80 px-6 text-base font-bold text-white hover:bg-white/10"
                  >
                    Open the market
                  </a>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-bold uppercase tracking-widest text-[#fde68a]">How it stays honest</p>
                <ul className="mt-4 space-y-3 text-[#efe4d0]">
                  <li>Only catch that a fisherman or depot has listed is shown.</li>
                  <li>If nothing is listed, the market is empty — we do not fill it with demo shops.</li>
                  <li>You set your own prices. Juvay does not invent them.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <VisionDemo />
        <LandingFaq />

        {/* Final CTA */}
        <section className="bg-[#0b1f24] px-4 py-20 text-center text-[#fff8f0] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[#fde68a]">Be one of the first sellers</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Open your free Caribbean store</h2>
            <p className="mt-5 text-lg text-[#efe4d0]">
              No credit card. Unlimited products. Cash pickup and cash on delivery at 0%. From a doubles stall to a boutique —
              your page, your prices, your customers.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/create-store"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#ce1126] px-8 py-3.5 text-lg font-bold text-white hover:bg-[#b50f21] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c14a]"
              >
                Create your free store
              </Link>
              <Link
                to="/templates"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white/80 px-8 py-3.5 text-lg font-bold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c14a]"
              >
                See templates
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-[#071518] px-4 py-10 text-sm text-[#c9b89a] sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
            <p>© {new Date().getFullYear()} Juvay. A free store for every Caribbean seller.</p>
            <nav className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/fees" className="hover:text-white">
                Fees
              </Link>
              <Link to="/fresh-catch" className="hover:text-white">
                Fresh Catch
              </Link>
              <Link to="/templates" className="hover:text-white">
                Templates
              </Link>
              <a href="/terms.html" className="hover:text-white">
                Terms
              </a>
              <a href="/privacy.html" className="hover:text-white">
                Privacy
              </a>
              <a href="mailto:support@juvay.app" className="hover:text-white">
                support@juvay.app
              </a>
            </nav>
          </div>
        </footer>

        <StickyMobileCta />
      </div>
    </>
  );
};

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0 text-[#2dd4bf]">
      <path
        fill="currentColor"
        d="M13.2 4.2a.75.75 0 0 1 0 1.06l-6.2 6.2a.75.75 0 0 1-1.06 0l-3-3A.75.75 0 0 1 4 7.4l2.47 2.47 5.67-5.67a.75.75 0 0 1 1.06 0Z"
      />
    </svg>
  );
}

export default LandingPageCRO;
