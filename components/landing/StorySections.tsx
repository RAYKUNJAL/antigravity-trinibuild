import React, { useEffect, useRef } from 'react';

export const STORY_STEPS = [
  {
    id: 'snap',
    kicker: '1 · Snap a photo',
    title: 'Take a picture of what you sell.',
    body: 'Vision can draft a name and description. You confirm it, then you type the TT$ price. It never invents a price, and if vision is locked you just type it yourself.',
  },
  {
    id: 'live',
    kicker: '2 · Your store is live',
    title: 'A real page, with your name on it.',
    body: 'Pick a starter — doubles, street food, fashion, services and more — add your item, and you have a store you can open on a phone. Unlimited listings, no credit card.',
  },
  {
    id: 'share',
    kicker: '3 · Share on WhatsApp',
    title: 'Send your link from the stall.',
    body: 'Share your store in WhatsApp, by SMS, or on a free stall QR sign. Customers order from your page. Alerts can go out as a WhatsApp draft you send yourself.',
  },
  {
    id: 'paid',
    kicker: '4 · Get paid, cash or Wam',
    title: 'Cash is 0%. Online Wam is a disclosed cut.',
    body: 'Cash pickup and cash on delivery carry 0% commission — the money is yours when the buyer pays you. Online Wam sales are designed so the buyer pays through Wam and the fee appears on your ledger. We describe how that is designed to work; we will not call it proven until a live order has been walked through.',
  },
] as const;

type Props = {
  onProgress: (t: number) => void;
};

export const StorySections: React.FC<Props> = ({ onProgress }) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // When the top hits mid-viewport, story starts (progress ~0.2 already from hero).
      // When the bottom leaves, progress is 1.
      const start = vh * 0.55;
      const end = -r.height + vh * 0.25;
      const t = (start - r.top) / (start - end);
      onProgress(Math.min(1, Math.max(0, t)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [onProgress]);

  return (
    <div ref={wrapRef} className="relative">
      {STORY_STEPS.map((s) => (
        <section
          key={s.id}
          id={`story-${s.id}`}
          className="flex min-h-[72vh] items-center px-4 py-16 sm:px-6 lg:px-8"
        >
          <article className="mx-auto w-full max-w-lg rounded-3xl border border-white/15 bg-[#0b1f24]/92 p-6 text-[#fff8f0] shadow-2xl backdrop-blur-md sm:p-8 lg:mx-0 lg:ml-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#f5c14a]">{s.kicker}</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{s.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-[#efe4d0]">{s.body}</p>
          </article>
        </section>
      ))}
    </div>
  );
};

export default StorySections;
