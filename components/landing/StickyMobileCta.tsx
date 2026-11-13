import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Appears after the hero CTA leaves the viewport. Mobile-first, 44px taps,
 * respects safe-area. Hidden when the primary hero CTA is still on screen.
 */
export const StickyMobileCta: React.FC<{ heroCtaId?: string }> = ({ heroCtaId = 'juvay-hero-cta' }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroCtaId);
    if (!hero || typeof IntersectionObserver === 'undefined') {
      const onScroll = () => setShow(window.scrollY > 420);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }
    const io = new IntersectionObserver(
      (entries) => {
        setShow(entries.every((e) => !e.isIntersecting));
      },
      { threshold: 0.15 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [heroCtaId]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8dcc8] bg-white/95 px-3 py-2 shadow-[0_-6px_24px_rgba(11,31,36,0.12)] backdrop-blur md:hidden" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex max-w-lg gap-2">
        <Link
          to="/create-store"
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#ce1126] px-3 text-center text-sm font-bold text-white hover:bg-[#b50f21] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1f24]"
        >
          Create your free store
        </Link>
        <Link
          to="/templates"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-[#0b1f24] px-3 text-sm font-bold text-[#0b1f24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ce1126]"
        >
          See templates
        </Link>
      </div>
    </div>
  );
};

export default StickyMobileCta;
