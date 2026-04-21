import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TRINIDAD_TEMPLATES, StoreTemplate } from '../services/templateService';
import { Sparkles, Store, TrendingUp, Zap } from 'lucide-react';

const TemplatePreview: React.FC<{ template: StoreTemplate }> = ({ template }) => {
  const id = template.id;

  // Food & Beverage previews
  if (id === 'roti_shop_pro' || id === 'doubles_breakfast_pro') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#FFF8F0"/>
        {/* Hero banner */}
        <rect width="320" height="70" fill="#C41E3A"/>
        <rect x="20" y="16" width="140" height="10" rx="5" fill="rgba(255,255,255,0.9)"/>
        <rect x="20" y="32" width="90" height="7" rx="3" fill="rgba(255,255,255,0.6)"/>
        <rect x="20" y="48" width="60" height="14" rx="7" fill="#FFD700"/>
        {/* Food image placeholder */}
        <circle cx="270" cy="35" r="30" fill="rgba(255,255,255,0.15)"/>
        <text x="270" y="42" textAnchor="middle" fontSize="24">🍽️</text>
        {/* Menu cards */}
        <rect x="12" y="80" width="88" height="62" rx="8" fill="white" filter="url(#shadow)"/>
        <rect x="12" y="80" width="88" height="30" rx="8" fill="#E61E2B"/>
        <text x="56" y="100" textAnchor="middle" fontSize="16">🥙</text>
        <rect x="20" y="118" width="70" height="6" rx="3" fill="#333"/>
        <rect x="28" y="130" width="52" height="5" rx="2" fill="#999"/>

        <rect x="116" y="80" width="88" height="62" rx="8" fill="white"/>
        <rect x="116" y="80" width="88" height="30" rx="8" fill="#FF6B35"/>
        <text x="160" y="100" textAnchor="middle" fontSize="16">🥘</text>
        <rect x="124" y="118" width="70" height="6" rx="3" fill="#333"/>
        <rect x="132" y="130" width="52" height="5" rx="2" fill="#999"/>

        <rect x="220" y="80" width="88" height="62" rx="8" fill="white"/>
        <rect x="220" y="80" width="88" height="30" rx="8" fill="#2D9E6B"/>
        <text x="264" y="100" textAnchor="middle" fontSize="16">☕</text>
        <rect x="228" y="118" width="70" height="6" rx="3" fill="#333"/>
        <rect x="236" y="130" width="52" height="5" rx="2" fill="#999"/>

        {/* Reviews row */}
        <rect x="12" y="154" width="296" height="36" rx="8" fill="white"/>
        <text x="24" y="174" fontSize="12">⭐⭐⭐⭐⭐</text>
        <rect x="130" y="165" width="120" height="6" rx="3" fill="#e5e7eb"/>
        <rect x="130" y="177" width="80" height="5" rx="2" fill="#e5e7eb"/>
        <defs><filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/></filter></defs>
      </svg>
    );
  }

  if (id === 'restaurant_premium') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#1a0a00"/>
        {/* Dark luxury restaurant hero */}
        <rect width="320" height="90" fill="url(#restaurantGrad)"/>
        <rect x="80" y="20" width="160" height="12" rx="6" fill="rgba(255,215,0,0.9)"/>
        <rect x="100" y="38" width="120" height="7" rx="3" fill="rgba(255,255,255,0.7)"/>
        <rect x="110" y="54" width="100" height="16" rx="8" fill="#FFD700"/>
        <rect x="118" y="58" width="84" height="8" rx="4" fill="#1a0a00"/>
        {/* Menu grid */}
        <rect x="12" y="100" width="72" height="52" rx="6" fill="#2d1a0a"/>
        <text x="48" y="134" textAnchor="middle" fontSize="28">🥩</text>
        <rect x="92" y="100" width="72" height="52" rx="6" fill="#2d1a0a"/>
        <text x="128" y="134" textAnchor="middle" fontSize="28">🦞</text>
        <rect x="172" y="100" width="72" height="52" rx="6" fill="#2d1a0a"/>
        <text x="208" y="134" textAnchor="middle" fontSize="28">🍷</text>
        <rect x="252" y="100" width="56" height="52" rx="6" fill="#2d1a0a"/>
        <text x="280" y="134" textAnchor="middle" fontSize="20">🎂</text>
        {/* Reservation bar */}
        <rect x="12" y="162" width="296" height="30" rx="8" fill="#FFD700"/>
        <rect x="24" y="171" width="80" height="12" rx="6" fill="#1a0a00"/>
        <rect x="140" y="171" width="60" height="12" rx="6" fill="#1a0a00"/>
        <rect x="240" y="168" width="56" height="18" rx="9" fill="#E61E2B"/>
        <rect x="248" y="172" width="40" height="10" rx="5" fill="white"/>
        <defs><linearGradient id="restaurantGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3d1a00"/><stop offset="100%" stopColor="#1a0a00"/></linearGradient></defs>
      </svg>
    );
  }

  // Retail previews
  if (id === 'clothing_store_pro') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#fdf2f8"/>
        {/* Fashion hero */}
        <rect width="320" height="60" fill="#1a1a2e"/>
        <rect x="20" y="14" width="120" height="10" rx="5" fill="white"/>
        <rect x="20" y="30" width="80" height="7" rx="3" fill="rgba(255,255,255,0.6)"/>
        <rect x="20" y="44" width="50" height="12" rx="6" fill="#E61E2B"/>
        {/* Nav icons */}
        <circle cx="270" cy="30" r="10" fill="rgba(255,255,255,0.1)"/>
        <circle cx="292" cy="30" r="10" fill="rgba(255,255,255,0.1)"/>
        {/* Product grid */}
        <rect x="12" y="72" width="90" height="110" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
        <rect x="12" y="72" width="90" height="68" rx="8" fill="#f3e8ff"/>
        <text x="57" y="116" textAnchor="middle" fontSize="32">👗</text>
        <rect x="20" y="148" width="70" height="7" rx="3" fill="#1a1a2e"/>
        <rect x="20" y="160" width="40" height="7" rx="3" fill="#E61E2B"/>
        <rect x="20" y="172" width="55" height="6" rx="3" fill="#9ca3af"/>

        <rect x="115" y="72" width="90" height="110" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
        <rect x="115" y="72" width="90" height="68" rx="8" fill="#fef3c7"/>
        <text x="160" y="116" textAnchor="middle" fontSize="32">👟</text>
        <rect x="123" y="148" width="70" height="7" rx="3" fill="#1a1a2e"/>
        <rect x="123" y="160" width="40" height="7" rx="3" fill="#E61E2B"/>

        <rect x="218" y="72" width="90" height="110" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
        <rect x="218" y="72" width="90" height="68" rx="8" fill="#dcfce7"/>
        <text x="263" y="116" textAnchor="middle" fontSize="32">👜</text>
        <rect x="226" y="148" width="70" height="7" rx="3" fill="#1a1a2e"/>
        <rect x="226" y="160" width="40" height="7" rx="3" fill="#E61E2B"/>
      </svg>
    );
  }

  if (id === 'pharmacy_health') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#f0fdf4"/>
        <rect width="320" height="56" fill="#16a34a"/>
        {/* Cross symbol */}
        <rect x="20" y="20" width="16" height="16" rx="3" fill="white"/>
        <rect x="24" y="17" width="8" height="22" rx="2" fill="#16a34a"/>
        <rect x="17" y="24" width="22" height="8" rx="2" fill="#16a34a"/>
        <rect x="44" y="18" width="120" height="10" rx="5" fill="white"/>
        <rect x="44" y="32" width="80" height="7" rx="3" fill="rgba(255,255,255,0.7)"/>
        <rect x="240" y="18" width="68" height="20" rx="10" fill="white"/>
        <rect x="252" y="22" width="44" height="12" rx="6" fill="#16a34a"/>
        {/* Categories */}
        {[0,1,2,3].map(i => (
          <g key={i}>
            <rect x={12 + i*78} y="68" width="70" height="50" rx="8" fill="white" stroke="#bbf7d0" strokeWidth="1.5"/>
            <text x={47 + i*78} y="100" textAnchor="middle" fontSize="22">{['💊','🩺','🧴','🌿'][i]}</text>
            <rect x={20 + i*78} y="108" width="54" height="6" rx="3" fill="#e5e7eb"/>
          </g>
        ))}
        {/* Product list */}
        {[0,1,2].map(i => (
          <rect key={i} x="12" y={128+i*22} width="296" height="18" rx="6" fill="white" stroke="#bbf7d0" strokeWidth="1"/>
        ))}
        <rect x="20" y="132" width="100" height="6" rx="3" fill="#374151"/>
        <rect x="270" y="132" width="30" height="6" rx="3" fill="#16a34a"/>
        <rect x="20" y="154" width="80" height="6" rx="3" fill="#374151"/>
        <rect x="270" y="154" width="30" height="6" rx="3" fill="#16a34a"/>
        <rect x="20" y="176" width="120" height="6" rx="3" fill="#374151"/>
        <rect x="270" y="176" width="30" height="6" rx="3" fill="#16a34a"/>
      </svg>
    );
  }

  if (id === 'electronics_tech') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#0f172a"/>
        <rect width="320" height="52" fill="#1e293b"/>
        <rect x="12" y="16" width="80" height="10" rx="5" fill="#3b82f6"/>
        <rect x="110" y="18" width="50" height="7" rx="3" fill="#94a3b8"/>
        <rect x="170" y="18" width="50" height="7" rx="3" fill="#94a3b8"/>
        <rect x="230" y="18" width="50" height="7" rx="3" fill="#94a3b8"/>
        <rect x="12" y="32" width="130" height="7" rx="3" fill="#475569"/>
        {/* Hero product */}
        <rect x="12" y="62" width="200" height="80" rx="8" fill="#1e293b"/>
        <text x="112" y="110" textAnchor="middle" fontSize="40">💻</text>
        <rect x="220" y="62" width="88" height="38" rx="8" fill="#1e293b"/>
        <text x="264" y="88" textAnchor="middle" fontSize="24">📱</text>
        <rect x="220" y="104" width="88" height="38" rx="8" fill="#1e293b"/>
        <text x="264" y="130" textAnchor="middle" fontSize="24">🖥️</text>
        {/* Specs bar */}
        <rect x="12" y="150" width="200" height="12" rx="6" fill="#3b82f6"/>
        <rect x="220" y="150" width="88" height="12" rx="6" fill="#1e293b"/>
        {/* Price + cart */}
        <rect x="12" y="170" width="80" height="20" rx="10" fill="#3b82f6"/>
        <rect x="100" y="170" width="112" height="20" rx="10" fill="#1e293b"/>
        <rect x="220" y="170" width="88" height="20" rx="10" fill="#1e293b"/>
      </svg>
    );
  }

  if (id === 'hardware_home') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#fefce8"/>
        <rect width="320" height="54" fill="#92400e"/>
        <rect x="12" y="16" width="140" height="10" rx="5" fill="white"/>
        <rect x="12" y="32" width="100" height="7" rx="3" fill="rgba(255,255,255,0.7)"/>
        <rect x="240" y="16" width="68" height="22" rx="11" fill="#FFD700"/>
        <rect x="252" y="21" width="44" height="12" rx="6" fill="#92400e"/>
        {/* Category icons */}
        {['🔧','🪚','🔩','🏠','💡','🎨'].map((emoji, i) => (
          <g key={i}>
            <rect x={12 + (i%3)*104} y={68 + Math.floor(i/3)*66} width="96" height="56" rx="8" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
            <text x={60 + (i%3)*104} y={100 + Math.floor(i/3)*66} textAnchor="middle" fontSize="24">{emoji}</text>
            <rect x={20 + (i%3)*104} y={110 + Math.floor(i/3)*66} width="72" height="6" rx="3" fill="#e5e7eb"/>
          </g>
        ))}
      </svg>
    );
  }

  if (id === 'bakery_desserts') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#fff7ed"/>
        {/* Pink hero */}
        <rect width="320" height="64" fill="url(#bakeryGrad)"/>
        <rect x="60" y="14" width="200" height="12" rx="6" fill="white"/>
        <rect x="90" y="30" width="140" height="7" rx="3" fill="rgba(255,255,255,0.8)"/>
        <rect x="115" y="44" width="90" height="14" rx="7" fill="#FFD700"/>
        {/* Showcase items */}
        {['🍰','🧁','🍩','🍪'].map((e, i) => (
          <g key={i}>
            <rect x={12 + i*76} y="78" width="68" height="80" rx="10" fill="white" stroke="#fce7f3" strokeWidth="1.5"/>
            <rect x={12 + i*76} y="78" width="68" height="48" rx="10" fill="#fdf2f8"/>
            <text x={46 + i*76} y="112" textAnchor="middle" fontSize="28">{e}</text>
            <rect x={20 + i*76} y="134" width="52" height="6" rx="3" fill="#374151"/>
            <rect x={20 + i*76} y="144" width="34" height="6" rx="3" fill="#db2777"/>
            <rect x={20 + i*76} y="154" width="52" height="10" rx="5" fill="#fce7f3"/>
          </g>
        ))}
        <defs><linearGradient id="bakeryGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#db2777"/><stop offset="100%" stopColor="#9333ea"/></linearGradient></defs>
      </svg>
    );
  }

  // Services previews
  if (id === 'salon_barber_pro') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#1a1a1a"/>
        <rect width="320" height="60" fill="#111"/>
        <rect x="20" y="16" width="110" height="10" rx="5" fill="#FFD700"/>
        <rect x="20" y="32" width="80" height="7" rx="3" fill="#6b7280"/>
        <rect x="230" y="18" width="78" height="24" rx="12" fill="#E61E2B"/>
        <rect x="246" y="23" width="46" height="14" rx="7" fill="white"/>
        {/* Services list */}
        {['✂️ Haircut', '💈 Fade', '🪒 Shave', '💆 Treatment'].map((s, i) => (
          <rect key={i} x="12" y={70 + i*28} width="180" height="22" rx="6" fill="#262626"/>
        ))}
        <text x="28" y="86" fontSize="11" fill="white">✂️  Haircut</text>
        <text x="28" y="114" fontSize="11" fill="white">💈  Fade & Lineup</text>
        <text x="28" y="142" fontSize="11" fill="white">🪒  Hot Shave</text>
        <text x="28" y="170" fontSize="11" fill="white">💆  Scalp Treatment</text>
        {/* Booking panel */}
        <rect x="200" y="70" width="108" height="120" rx="10" fill="#262626"/>
        <rect x="208" y="78" width="92" height="10" rx="5" fill="#FFD700"/>
        <rect x="208" y="96" width="92" height="24" rx="6" fill="#1a1a1a"/>
        <rect x="208" y="126" width="44" height="20" rx="5" fill="#333"/>
        <rect x="256" y="126" width="44" height="20" rx="5" fill="#333"/>
        <rect x="208" y="154" width="92" height="28" rx="14" fill="#E61E2B"/>
        <rect x="228" y="162" width="52" height="12" rx="6" fill="white"/>
      </svg>
    );
  }

  if (id === 'auto_parts') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#111827"/>
        <rect width="320" height="58" fill="#1f2937"/>
        <rect x="12" y="16" width="120" height="10" rx="5" fill="#f97316"/>
        <rect x="12" y="32" width="90" height="7" rx="3" fill="#6b7280"/>
        <rect x="220" y="16" width="88" height="26" rx="6" fill="#f97316"/>
        <rect x="228" y="22" width="72" height="14" rx="7" fill="#111827"/>
        {/* Car hero */}
        <rect x="12" y="68" width="296" height="72" rx="8" fill="#1f2937"/>
        <text x="160" y="116" textAnchor="middle" fontSize="48">🚗</text>
        {/* Parts grid */}
        {['🔧','⚙️','🛞','🔋'].map((e, i) => (
          <g key={i}>
            <rect x={12 + i*76} y="150" width="68" height="40" rx="6" fill="#1f2937"/>
            <text x={46 + i*76} y="177" textAnchor="middle" fontSize="20">{e}</text>
          </g>
        ))}
      </svg>
    );
  }

  if (id === 'gym_fitness') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#0a0a0a"/>
        <rect width="320" height="64" fill="url(#gymGrad)"/>
        <rect x="20" y="16" width="130" height="12" rx="6" fill="white"/>
        <rect x="20" y="34" width="90" height="7" rx="3" fill="rgba(255,255,255,0.7)"/>
        <rect x="20" y="48" width="70" height="12" rx="6" fill="#FFD700"/>
        <text x="270" y="44" textAnchor="middle" fontSize="32">💪</text>
        {/* Stats row */}
        {['3 Plans','24/7 Access','50+ Classes','Free Trial'].map((s, i) => (
          <g key={i}>
            <rect x={12+i*76} y="74" width="68" height="40" rx="6" fill="#1a1a1a"/>
            <rect x={20+i*76} y="82" width="52" height="8" rx="4" fill="#ef4444"/>
            <rect x={20+i*76} y="96" width="40" height="6" rx="3" fill="#374151"/>
          </g>
        ))}
        {/* Membership cards */}
        <rect x="12" y="124" width="92" height="64" rx="10" fill="#1a1a1a" stroke="#374151" strokeWidth="1"/>
        <rect x="116" y="124" width="92" height="64" rx="10" fill="#E61E2B"/>
        <rect x="220" y="124" width="88" height="64" rx="10" fill="#FFD700"/>
        <rect x="22" y="136" width="72" height="8" rx="4" fill="#374151"/>
        <rect x="126" y="136" width="72" height="8" rx="4" fill="rgba(255,255,255,0.9)"/>
        <rect x="230" y="136" width="68" height="8" rx="4" fill="#1a1a1a"/>
        <rect x="22" y="152" width="50" height="16" rx="8" fill="#374151"/>
        <rect x="126" y="152" width="50" height="16" rx="8" fill="rgba(255,255,255,0.9)"/>
        <rect x="230" y="152" width="50" height="16" rx="8" fill="#1a1a1a"/>
        <defs><linearGradient id="gymGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7f1d1d"/><stop offset="100%" stopColor="#1a1a1a"/></linearGradient></defs>
      </svg>
    );
  }

  if (id === 'jewelry_luxury') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#0c0c0c"/>
        <rect width="320" height="56" fill="#0c0c0c" stroke="#FFD700" strokeWidth="0"/>
        <rect x="100" y="12" width="120" height="12" rx="6" fill="#FFD700"/>
        <rect x="110" y="30" width="100" height="7" rx="3" fill="#6b7280"/>
        <rect x="130" y="44" width="60" height="10" rx="5" fill="none" stroke="#FFD700" strokeWidth="1"/>
        {/* Product showcase */}
        {['💍','📿','⌚'].map((e, i) => (
          <g key={i}>
            <rect x={12 + i*102} y="66" width="94" height="94" rx="10" fill="#1a1708"/>
            <rect x={12 + i*102} y="66" width="94" height="94" rx="10" fill="none" stroke="#FFD700" strokeWidth="0.5"/>
            <text x={59 + i*102} y="120" textAnchor="middle" fontSize="36">{e}</text>
            <rect x={22 + i*102} y="148" width="74" height="6" rx="3" fill="#FFD700"/>
          </g>
        ))}
        {/* Bottom bar */}
        <rect x="12" y="170" width="296" height="22" rx="6" fill="#1a1708" stroke="#FFD700" strokeWidth="0.5"/>
        <rect x="24" y="177" width="120" height="8" rx="4" fill="#374151"/>
        <rect x="230" y="175" width="66" height="12" rx="6" fill="#FFD700"/>
      </svg>
    );
  }

  if (id === 'multi_location_enterprise') {
    return (
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="320" height="200" fill="#f8fafc"/>
        <rect width="320" height="54" fill="#0f172a"/>
        <rect x="12" y="14" width="100" height="10" rx="5" fill="#3b82f6"/>
        <rect x="12" y="30" width="70" height="7" rx="3" fill="#475569"/>
        <rect x="220" y="14" width="88" height="26" rx="13" fill="#3b82f6"/>
        <rect x="232" y="19" width="64" height="16" rx="8" fill="white"/>
        {/* Metrics row */}
        {['12\nLocations','$2.4M\nRevenue','98%\nSatisfied','4.8★\nRating'].map((s, i) => (
          <g key={i}>
            <rect x={12+i*76} y="64" width="68" height="48" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
            <rect x={20+i*76} y="72" width="30" height="10" rx="5" fill="#3b82f6"/>
            <rect x={20+i*76} y="88" width="50" height="6" rx="3" fill="#e2e8f0"/>
            <rect x={20+i*76} y="100" width="40" height="5" rx="2" fill="#e2e8f0"/>
          </g>
        ))}
        {/* Location map */}
        <rect x="12" y="122" width="180" height="68" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
        <rect x="12" y="122" width="180" height="68" rx="8" fill="#eff6ff"/>
        <circle cx="60" cy="156" r="8" fill="#E61E2B"/>
        <circle cx="120" cy="148" r="8" fill="#E61E2B"/>
        <circle cx="160" cy="165" r="8" fill="#E61E2B"/>
        <circle cx="90" cy="172" r="6" fill="#3b82f6"/>
        {/* Side panel */}
        <rect x="200" y="122" width="108" height="68" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
        <rect x="208" y="130" width="92" height="8" rx="4" fill="#e2e8f0"/>
        <rect x="208" y="144" width="92" height="8" rx="4" fill="#e2e8f0"/>
        <rect x="208" y="158" width="92" height="8" rx="4" fill="#e2e8f0"/>
        <rect x="208" y="172" width="92" height="12" rx="6" fill="#3b82f6"/>
      </svg>
    );
  }

  // Default / Basic storefront
  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="320" height="200" fill="#f9fafb"/>
      <rect width="320" height="56" fill="#E61E2B"/>
      <rect x="20" y="16" width="130" height="10" rx="5" fill="white"/>
      <rect x="20" y="32" width="90" height="7" rx="3" fill="rgba(255,255,255,0.7)"/>
      <rect x="230" y="16" width="78" height="24" rx="12" fill="white"/>
      <rect x="242" y="21" width="54" height="14" rx="7" fill="#E61E2B"/>
      {/* Product grid */}
      {[0,1,2,3,4,5].map(i => (
        <g key={i}>
          <rect x={12+(i%3)*102} y={68+Math.floor(i/3)*66} width="94" height="56" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
          <rect x={12+(i%3)*102} y={68+Math.floor(i/3)*66} width="94" height="34" rx="8" fill="#f3f4f6"/>
          <rect x={20+(i%3)*102} y={110+Math.floor(i/3)*66} width="60" height="6" rx="3" fill="#374151"/>
          <rect x={20+(i%3)*102} y={120+Math.floor(i/3)*66} width="40" height="5" rx="2" fill="#9ca3af"/>
        </g>
      ))}
    </svg>
  );
};

interface TemplateGalleryProps {
  onSelectTemplate?: (template: StoreTemplate) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Templates', icon: Store },
    { id: 'Food & Beverage', name: 'Food & Drinks', icon: Sparkles },
    { id: 'Retail', name: 'Retail Shops', icon: TrendingUp },
    { id: 'Services', name: 'Services', icon: Zap },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? TRINIDAD_TEMPLATES 
    : TRINIDAD_TEMPLATES.filter(t => t.category === selectedCategory);

  const getTierBadge = (tier: 'free' | 'pro' | 'premium') => {
    const styles = {
      free: 'bg-gray-100 text-gray-700 border-gray-300',
      pro: 'bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white border-[#E61E2B]',
      premium: 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black border-[#FFD700]'
    };
    
    const labels = {
      free: 'FREE',
      pro: 'PRO',
      premium: 'PREMIUM'
    };

    return (
      <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border-2 ${styles[tier]}`}>
        {labels[tier]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-black mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Trinidad Store Templates
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
              Professional, conversion-optimized templates for Trinidad businesses. 
              Launch your store in minutes.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap
                    flex items-center gap-2 transition-all
                    ${isActive 
                      ? 'bg-[#E61E2B] text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <Icon size={18} />
                  {category.name}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              className="group relative"
            >
              {/* Template Card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-[#E61E2B]">
                {/* Real Template Preview */}
                <div className="relative h-56 overflow-hidden bg-gray-900">
                  <TemplatePreview template={template} />
                  
                  {/* Tier Badge Overlay */}
                  <div className="absolute top-4 right-4">
                    {getTierBadge(template.tier)}
                  </div>

                  {/* Hover Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredTemplate === template.id ? 1 : 0 }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onSelectTemplate?.(template)}
                      className="px-6 py-3 bg-white text-[#E61E2B] font-black rounded-full hover:bg-[#E61E2B] hover:text-white transition-colors"
                    >
                      Use This Template
                    </motion.button>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 font-semibold">
                        {template.category}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Features Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.features.slice(0, 3).map((feature, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* CRO Badge */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <Zap size={14} className="text-[#FFD700]" />
                    <span className="text-xs font-bold text-gray-600">
                      {template.mobile_first ? 'Mobile-First' : 'Desktop-First'} • 
                      {template.load_time_target}s Load Time
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-20">
            <Store size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-black text-gray-400 mb-2">No templates found</h3>
            <p className="text-gray-500">Try selecting a different category</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Can't Find What You Need?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Upgrade to Premium for custom template design tailored to your brand.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white text-[#E61E2B] font-black rounded-full text-lg hover:bg-gray-100 transition-colors"
          >
            Get Custom Template - $299
          </motion.button>
        </div>
      </div>
    </div>
  );
};
