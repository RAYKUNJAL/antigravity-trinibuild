import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Copy, Check, Share2, X,
  MessageCircle, Facebook, Twitter, Mail,
  Download, ExternalLink, ChevronDown
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoreShareKitProps {
  storeName: string;
  slug: string;
  shortSlug?: string;
  logoUrl?: string;
  category?: string;
  description?: string;
  showBranding?: boolean;
  planTier?: string;
  onToggleBranding?: (show: boolean) => void;
}

// ─── QR Code with TriniBuild Branding ────────────────────────────────────────

const BrandedQRCode: React.FC<{
  url: string;
  storeName: string;
  logoUrl?: string;
  size?: number;
}> = ({ url, storeName, size = 200 }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=E61E2B&bgcolor=FFFFFF&margin=8&format=svg`;

  const handleDownload = async () => {
    try {
      const pngUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(url)}&color=E61E2B&bgcolor=FFFFFF&margin=12&format=png`;
      const response = await fetch(pngUrl);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${storeName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
        {/* TriniBuild header */}
        <div className="flex items-center justify-center gap-1.5 mb-3 pb-2 border-b border-gray-100">
          <div className="w-5 h-5 bg-[#E61E2B] rounded-md flex items-center justify-center">
            <span className="text-white text-[8px] font-black">TB</span>
          </div>
          <span className="text-[10px] font-bold text-gray-800 tracking-wide uppercase">TriniBuild</span>
        </div>

        {/* QR Code */}
        <img
          src={qrUrl}
          alt={`QR code for ${storeName}`}
          className="w-[180px] h-[180px] mx-auto"
          loading="eager"
        />

        {/* Store name below QR */}
        <p className="text-center text-xs font-semibold text-gray-700 mt-2 truncate max-w-[180px]">
          {storeName}
        </p>
        <p className="text-center text-[10px] text-gray-400 mt-0.5">
          Scan to visit store
        </p>
      </div>

      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#E61E2B] transition-colors"
      >
        <Download size={14} />
        Download QR Code
      </button>
    </div>
  );
};

// ─── Share Button Row ────────────────────────────────────────────────────────

const ShareButtons: React.FC<{
  url: string;
  storeName: string;
  description?: string;
}> = ({ url, storeName, description }) => {
  const [copied, setCopied] = useState(false);
  const text = description || `Check out ${storeName} on TriniBuild!`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: storeName, text, url });
      } catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(storeName)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`, '_blank');
  };

  const buttons = [
    { icon: copied ? Check : Copy, label: copied ? 'Copied!' : 'Copy Link', action: copyLink, color: copied ? 'text-green-600' : 'text-gray-600', bg: copied ? 'bg-green-50' : 'bg-gray-50' },
    { icon: MessageCircle, label: 'WhatsApp', action: shareWhatsApp, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Facebook, label: 'Facebook', action: shareFacebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Twitter, label: 'X / Twitter', action: shareTwitter, color: 'text-gray-800', bg: 'bg-gray-100' },
    { icon: Mail, label: 'Email', action: shareEmail, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-3">
      {/* Quick link bar */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
        <div className="flex-1 text-sm text-gray-500 truncate pl-2 font-mono">
          {url.replace('https://', '')}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={copyLink}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-[#E61E2B] text-white hover:bg-red-700'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </motion.button>
        {'share' in navigator && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={shareNative}
            className="p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <Share2 size={16} className="text-gray-600" />
          </motion.button>
        )}
      </div>

      {/* Social buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {buttons.map((btn) => (
          <motion.button
            key={btn.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={btn.action}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${btn.bg} ${btn.color} text-xs font-semibold whitespace-nowrap transition-colors hover:opacity-80`}
          >
            <btn.icon size={14} />
            {btn.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ─── TriniBuild Branding Badge (for storefronts) ────────────────────────────

export const TriniBuildBadge: React.FC<{
  variant?: 'light' | 'dark' | 'minimal';
}> = ({ variant = 'light' }) => {
  const styles = {
    light: 'bg-white/90 text-gray-600 border border-gray-200 backdrop-blur-sm',
    dark: 'bg-black/80 text-white/70 backdrop-blur-sm',
    minimal: 'bg-transparent text-gray-400',
  };

  return (
    <motion.a
      href="https://trinibuild.com"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium ${styles[variant]} hover:opacity-100 transition-opacity`}
    >
      <div className="w-4 h-4 bg-[#E61E2B] rounded flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[6px] font-black leading-none">TB</span>
      </div>
      Powered by TriniBuild
    </motion.a>
  );
};

// ─── Branding Toggle (Settings page for paid stores) ─────────────────────────

export const BrandingToggle: React.FC<{
  showBranding: boolean;
  planTier: string;
  onToggle: (show: boolean) => void;
}> = ({ showBranding, planTier, onToggle }) => {
  const isPaid = ['pro', 'premium', 'business'].includes(planTier);

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-semibold text-gray-800">TriniBuild Branding</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {isPaid
            ? 'Remove "Powered by TriniBuild" from your storefront'
            : 'Upgrade to a paid plan to remove branding'
          }
        </p>
      </div>
      <button
        onClick={() => isPaid && onToggle(!showBranding)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          isPaid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
        } ${showBranding ? 'bg-[#E61E2B]' : 'bg-gray-300'}`}
      >
        <motion.div
          animate={{ x: showBranding ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        />
      </button>
    </div>
  );
};

// ─── Full Share Modal ────────────────────────────────────────────────────────

export const StoreShareModal: React.FC<
  StoreShareKitProps & { isOpen: boolean; onClose: () => void }
> = ({ isOpen, onClose, storeName, slug, shortSlug, logoUrl, description }) => {
  const storeUrl = `https://trinibuild.com/store/${slug}`;
  const shortUrl = shortSlug ? `https://trinibuild.com/s/${shortSlug}` : storeUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#E61E2B] rounded-lg flex items-center justify-center">
                  <Share2 size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Share Your Store</h3>
                  <p className="text-[11px] text-gray-400">{storeName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Short link highlight */}
              {shortSlug && (
                <div className="text-center">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Your short link</p>
                  <p className="text-lg font-black text-[#E61E2B] font-mono">
                    trinibuild.com/s/{shortSlug}
                  </p>
                </div>
              )}

              {/* QR Code */}
              <BrandedQRCode
                url={shortUrl}
                storeName={storeName}
                logoUrl={logoUrl}
              />

              {/* Share Buttons */}
              <ShareButtons
                url={shortUrl}
                storeName={storeName}
                description={description}
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">
                A product of R&R Digital Solutions · TriniBuild
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Inline QR Section (for storefront pages) ───────────────────────────────

export const StoreQRSection: React.FC<{
  storeName: string;
  slug: string;
  shortSlug?: string;
  logoUrl?: string;
}> = ({ storeName, slug, shortSlug, logoUrl }) => {
  const storeUrl = shortSlug
    ? `https://trinibuild.com/s/${shortSlug}`
    : `https://trinibuild.com/store/${slug}`;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* QR */}
        <BrandedQRCode url={storeUrl} storeName={storeName} logoUrl={logoUrl} size={160} />

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Share This Store</h3>
          <p className="text-sm text-gray-500 mb-3">
            Scan the QR code or share the link to spread the word
          </p>

          {shortSlug && (
            <div className="inline-flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg mb-3">
              <span className="text-sm font-bold text-[#E61E2B] font-mono">
                trinibuild.com/s/{shortSlug}
              </span>
            </div>
          )}

          <ShareButtons url={storeUrl} storeName={storeName} />
        </div>
      </div>
    </div>
  );
};

// ─── Default Export ──────────────────────────────────────────────────────────

export default StoreShareModal;
