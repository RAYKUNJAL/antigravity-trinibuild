/**
 * Free printable stall QR sign. Uses the existing public QR image service.
 * Print / Save as PDF via the browser. No new PDF dependency.
 * Honest copy only — cash rails that are on, no invented reviews or ETAs.
 */
import React from 'react';

export interface StallSignProps {
  storeName: string;
  slug: string;
  url?: string;
  acceptsCashPickup?: boolean;
  acceptsCod?: boolean;
  whatsappE164?: string;
}

export function stallSignUrl(slug: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/store/${slug}`;
  }
  return `https://juvay.app/store/${slug}`;
}

export const StallQrSign: React.FC<StallSignProps> = ({
  storeName,
  slug,
  url,
  acceptsCashPickup,
  acceptsCod,
}) => {
  const href = url || stallSignUrl(slug);
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(href)}&color=111111&bgcolor=FFFFFF&margin=8&format=png`;
  const display = href.replace(/^https?:\/\//, '');

  return (
    <div className="stall-sign bg-white text-gray-900 max-w-[420px] mx-auto border-2 border-gray-900 rounded-3xl p-8 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-600 mb-2">Juvay</p>
      <h1 className="text-3xl font-black leading-tight">{storeName || 'Our shop'}</h1>
      <p className="mt-2 text-sm font-semibold text-gray-700">Scan to order</p>
      <img
        src={qr}
        alt={`QR code for ${storeName} at ${display}`}
        width={280}
        height={280}
        className="mx-auto my-6 w-[280px] h-[280px]"
      />
      <p className="text-base font-bold break-all">{display}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {acceptsCashPickup !== false && (
          <span className="text-[11px] font-bold uppercase tracking-wide border border-gray-900 rounded-full px-3 py-1">Cash on pickup</span>
        )}
        {acceptsCod && (
          <span className="text-[11px] font-bold uppercase tracking-wide border border-gray-900 rounded-full px-3 py-1">Cash on delivery</span>
        )}
      </div>
      <p className="mt-6 text-xs text-gray-500">Free stall sign · juvay.app</p>
    </div>
  );
};

export const StallSignActions: React.FC<{ slug: string }> = ({ slug }) => (
  <div className="flex flex-wrap gap-3 justify-center print:hidden">
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-[44px] px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold"
    >
      Print / Save as PDF
    </button>
    <a
      href={`/store/${slug}/sign`}
      className="min-h-[44px] px-5 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 inline-flex items-center"
    >
      Open full-page sign
    </a>
  </div>
);

export default StallQrSign;
