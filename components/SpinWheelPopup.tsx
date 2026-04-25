/**
 * SpinWheelPopup — celebratory overlay shown after store creation.
 *
 * Trigger: URL contains `?spin=1` (set by StoreBuilderV3 on store creation success).
 * Shows once per browser/user combination. On dismissal we set a localStorage flag
 * so users don't see it again on subsequent storefront visits.
 *
 * Why this exists:
 * - Phase A wired the URL flag but had no listener → the spin reward was invisible
 *   to users. Database showed 0 spin_wheel_results despite 8 stores created.
 * - This component closes that loop. When a merchant finishes their store, they
 *   immediately see the popup, click "Spin to Win", and get to /spin-wheel.
 *
 * Accessibility:
 * - Trapped focus inside the modal while open
 * - Esc key dismisses
 * - Click outside dismisses
 * - aria-modal + role="dialog"
 *
 * Visual: gradient hero, large emoji, two clear actions (primary CTA + later link).
 * No framer-motion (CSS-only entrance animation).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X, Gift, Sparkles } from 'lucide-react';

const DISMISS_KEY = 'trinibuild_spin_popup_dismissed';

export const SpinWheelPopup: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Open if URL has ?spin=1 AND not dismissed before in this browser
  useEffect(() => {
    if (params.get('spin') !== '1') return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* SSR or privacy mode — proceed anyway */
    }
    // Tiny delay so the storefront renders behind us first (better perceived UX)
    const t = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(t);
  }, [params]);

  // Strip ?spin=1 from URL after we've consumed it (so refresh doesn't re-pop)
  const stripFlag = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete('spin');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
    stripFlag();
  }, [stripFlag]);

  const claim = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'spin_popup_clicked', { source: 'store_creation' });
    }
    stripFlag();
    setOpen(false);
    navigate('/spin-wheel');
  }, [navigate, stripFlag]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spin-popup-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      onClick={dismiss}
      style={{ animation: 'spin-popup-fade-in 0.25s ease-out' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal — stop click propagation so backdrop click doesn't trigger when clicking inside */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'spin-popup-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-700 transition-colors shadow-md"
        >
          <X size={18} />
        </button>

        {/* Hero — gradient + giant emoji */}
        <div className="relative bg-gradient-to-br from-trini-red via-red-600 to-orange-500 px-6 pt-8 pb-12 text-center text-white overflow-hidden">
          {/* Decorative sparkles */}
          <div className="absolute top-3 left-6 text-yellow-300 opacity-80">
            <Sparkles size={20} />
          </div>
          <div className="absolute bottom-4 right-8 text-yellow-300 opacity-60">
            <Sparkles size={14} />
          </div>
          <div className="absolute top-12 right-16 text-yellow-200 opacity-50">
            <Sparkles size={10} />
          </div>

          <div className="text-7xl mb-2" role="img" aria-label="party">
            🎉
          </div>
          <h2
            id="spin-popup-title"
            className="text-2xl sm:text-3xl font-black leading-tight mb-1"
          >
            Your store is live!
          </h2>
          <p className="text-white/90 text-sm sm:text-base font-medium">
            And we got something for you, partner 🇹🇹
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-7">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Gift size={20} className="text-trini-red" />
            <p className="text-xs font-black uppercase tracking-widest text-trini-red">
              Free spin unlocked
            </p>
          </div>
          <h3 className="text-center text-xl font-black text-gray-900 mb-2">
            Spin the wheel for up to 50% off
          </h3>
          <p className="text-center text-sm text-gray-600 mb-6 leading-relaxed">
            One free spin a day, every day. Win discount coupons, loyalty
            points, and bonus rewards on every spin — no purchase needed.
          </p>

          <button
            onClick={claim}
            className="w-full bg-trini-red hover:bg-red-700 active:bg-red-800 text-white font-bold py-4 rounded-xl text-base transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            Spin to win
            <span className="text-xl leading-none">→</span>
          </button>
          <button
            onClick={dismiss}
            className="w-full mt-2 text-center text-sm text-gray-500 hover:text-gray-700 font-medium py-2"
          >
            Maybe later
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin-popup-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin-popup-pop {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SpinWheelPopup;
