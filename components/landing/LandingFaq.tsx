/**
 * Objection-handling FAQ. Honest about fees, cash, Wam coverage and
 * the fact that online Wam pay→fulfill is how it is designed to work —
 * not claimed as already proven on live.
 */
import React, { useId, useState } from 'react';
import { adsAvailabilityCopy, tier1Countries, WAM_COUNTRIES } from '../../services/wamCountries';
import { FEE_DEFAULTS, formatFeePercent, formatTtdCents } from '../../services/juvayFees';

function useItems(): Array<{ q: string; a: React.ReactNode }> {
  const freePct = formatFeePercent(FEE_DEFAULTS.juvayFeeBpsFree);
  const premPct = formatFeePercent(FEE_DEFAULTS.juvayFeeBpsPremium);
  const cap = formatTtdCents(FEE_DEFAULTS.juvayFeeCapCents);
  const t1 = tier1Countries();
  const t2 = WAM_COUNTRIES.filter((c) => c.tier === 'tier2_global' && c.active);
  const t3 = WAM_COUNTRIES.filter((c) => c.tier === 'tier3_case' && c.active);

  return [
    {
      q: 'Is it really free?',
      a: (
        <>
          Yes. Every Caribbean seller can create a free website and store, with Unlimited products, 1 store, Wam online checkout at 4.5% fee (capped TT$25/order), 0% on cash/COD, and no credit card. Juvay
          earns {freePct} only when a buyer pays you online with Wam, capped at {cap} per order.
        </>
      ),
    },
    {
      q: 'What are the fees?',
      a: (
        <>
          On a successful online Wam sale, Juvay takes {freePct} on the Free plan and {premPct} on Premium, capped at {cap}.
          There is no listing fee, no payout fee and no monthly fee on Free. Wam also charges its own processing fee — about
          2% on Wam wallet and 3% plus TT$1.50 on cards, with the card flat paid by the buyer by default. Those are Wam&apos;s
          published rates and still need to be confirmed with Wam for this account. A proposed buyer-paid COD handling fee
          (around TT$8–15) is not a Juvay commission. We give 30 days&apos; notice before any Juvay fee change.
        </>
      ),
    },
    {
      q: 'How do I get paid?',
      a: (
        <>
          Cash pickup and cash on delivery: the buyer pays you in cash, and that money is yours immediately — it never goes
          through Juvay or Wam. Online Wam payments are designed so the buyer pays through Wam, the order is marked paid, and
          the fee shows on your seller ledger. Wam describes wallet payments as instant and card payments as settling in two
          business days. We will not advertise online Wam as proven until a live pay-to-fulfill order has been walked through.
          Cash and COD are available to use now.
        </>
      ),
    },
    {
      q: 'Do I need a credit card or a bank account?',
      a: (
        <>
          No credit card is required to create your store or to take cash orders. A Wam account is what vendors use to get
          paid out on online sales, in countries where Wam is available. You can start with cash pickup and cash on delivery
          alone.
        </>
      ),
    },
    {
      q: 'Where does Wam work?',
      a: (
        <>
          {adsAvailabilityCopy()} {t1.map((c) => c.name).join(', ')} is tier 1. {t2.length} markets are on Wam global
          accounts
          {t3.length ? `, and ${t3.length} are listed as case-by-case` : ''}. Payout rails differ by country — we do not
          promise a local bank payout outside tier 1.
        </>
      ),
    },
    {
      q: 'How do cash pickup and cash on delivery work?',
      a: (
        <>
          The buyer orders on your store, chooses cash pickup or cash on delivery, and pays you in cash when they collect or
          when the order is delivered. Juvay takes 0% on those orders. You arrange your own pickup hours or delivery — this
          page does not quote a delivery fare.
        </>
      ),
    },
    {
      q: 'Can I share my store on WhatsApp?',
      a: (
        <>
          Yes. Your store has a link you can share in WhatsApp, by SMS or on a stall QR sign. Customers order from your page.
          Order alerts can be prepared as a WhatsApp draft you send yourself. Automatic sending needs a connected message
          sender, which is not assumed to be on for every store.
        </>
      ),
    },
    {
      q: 'What is Premium?',
      a: (
        <>
          Premium is TT$49 a month for the first three months, then TT$79, and it lowers the Juvay fee on online Wam sales to{' '}
          {premPct} (still capped at {cap}). The buy button is not open yet. We will turn it on after online payments are
          ready.
        </>
      ),
    },
  ];
}

export const LandingFaq: React.FC = () => {
  const items = useItems();
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" className="bg-[#FFF8F0] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0d9488]">Questions</p>
          <h2 className="text-3xl font-black tracking-tight text-[#141414] sm:text-4xl">
            Straight answers before you start
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {items.map((item, i) => {
            const expanded = open === i;
            const panelId = `${baseId}-panel-${i}`;
            const btnId = `${baseId}-btn-${i}`;
            return (
              <div key={item.q} className="overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white">
                <button
                  type="button"
                  id={btnId}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpen(expanded ? null : i)}
                  className="flex min-h-[52px] w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold text-[#141414] hover:bg-[#faf7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ce1126]"
                >
                  <span>{item.q}</span>
                  <span aria-hidden className="text-xl leading-none text-[#0d9488]">
                    {expanded ? '−' : '+'}
                  </span>
                </button>
                {expanded && (
                  <div id={panelId} role="region" aria-labelledby={btnId} className="border-t border-[#e8dcc8] px-5 py-4 text-[#3d3932] leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingFaq;
