/**
 * ServicesShowcase — single source of truth for cross-linking the 7 service landing pages.
 *
 * Why this exists:
 * - Audit (Apr 25, 2026) revealed each landing page was a dead end: no cross-links to
 *   sibling services, homepage had only 1 CTA, ZERO internal link graph between landings.
 * - This component is the entire link graph in one file. Drop it into any page and
 *   that page now links to all 7 services.
 *
 * Usage:
 *   <ServicesShowcase />                         // Show all 7
 *   <ServicesShowcase currentSlug="jobs" />      // Hide the current page from the grid
 *   <ServicesShowcase variant="compact" />       // Small variant for landing page footers
 *   <ServicesShowcase title="Try another service" /> // Override headline
 *
 * Design choices:
 * - No framer-motion (it's been a crash source in critical paths). CSS transitions only.
 * - Each card has its own accent color — visual distinction at a glance.
 * - GA4 event fires on click for conversion attribution.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Briefcase,
  Ticket,
  Building2,
  ArrowRight,
} from 'lucide-react';

export type ServiceSlug =
  | 'stores'
  | 'food'
  | 'marketplace'
  | 'rides'
  | 'jobs'
  | 'tickets'
  | 'living';

interface ServiceItem {
  slug: ServiceSlug;
  icon: React.ElementType;
  title: string;
  tagline: string;
  cta: string;
  path: string;
  // Tailwind-ready accent classes — chosen so all 7 are visually distinct
  accentBg: string;
  accentText: string;
  accentBorder: string;
}

export const SERVICES: ServiceItem[] = [
  {
    slug: 'stores',
    icon: Store,
    title: 'Online Stores',
    tagline: 'Launch a free online store in 60 seconds',
    cta: 'Build a store',
    path: '/services/stores',
    accentBg: 'bg-red-50',
    accentText: 'text-red-600',
    accentBorder: 'hover:border-red-500',
  },
  {
    slug: 'food',
    icon: UtensilsCrossed,
    title: 'Food & Restaurants',
    tagline: 'Take orders, manage delivery, grow your kitchen',
    cta: 'Set up restaurant',
    path: '/services/food',
    accentBg: 'bg-orange-50',
    accentText: 'text-orange-600',
    accentBorder: 'hover:border-orange-500',
  },
  {
    slug: 'marketplace',
    icon: ShoppingBag,
    title: 'Marketplace',
    tagline: 'Sell anything across T&T — multi-vendor ready',
    cta: 'Start selling',
    path: '/services/marketplace',
    accentBg: 'bg-green-50',
    accentText: 'text-green-600',
    accentBorder: 'hover:border-green-500',
  },
  {
    slug: 'rides',
    icon: Car,
    title: 'Rides & Delivery',
    tagline: 'Drive with TriniRides — keep more of your earnings',
    cta: 'Drive with us',
    path: '/services/rides',
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-600',
    accentBorder: 'hover:border-blue-500',
  },
  {
    slug: 'jobs',
    icon: Briefcase,
    title: 'Jobs',
    tagline: 'Find work or hire skilled pros across the islands',
    cta: 'Browse jobs',
    path: '/services/jobs',
    accentBg: 'bg-purple-50',
    accentText: 'text-purple-600',
    accentBorder: 'hover:border-purple-500',
  },
  {
    slug: 'tickets',
    icon: Ticket,
    title: 'Events & Tickets',
    tagline: 'Fetes, concerts, shows — sell tickets in minutes',
    cta: 'Sell tickets',
    path: '/services/tickets',
    accentBg: 'bg-pink-50',
    accentText: 'text-pink-600',
    accentBorder: 'hover:border-pink-500',
  },
  {
    slug: 'living',
    icon: Building2,
    title: 'Real Estate',
    tagline: 'Buy, rent or list property in Trinidad & Tobago',
    cta: 'Browse listings',
    path: '/services/living',
    accentBg: 'bg-cyan-50',
    accentText: 'text-cyan-600',
    accentBorder: 'hover:border-cyan-500',
  },
];

interface Props {
  /** Hide this service from the grid (use on its own landing page) */
  currentSlug?: ServiceSlug;
  /** 'full' = hero section with headline. 'compact' = bare grid (for landing page footers) */
  variant?: 'full' | 'compact';
  /** Override the section headline */
  title?: string;
  /** Override the section subtitle */
  subtitle?: string;
}

const trackClick = (slug: string, source: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'service_click', {
      service: slug,
      source: source,
    });
  }
};

export const ServicesShowcase: React.FC<Props> = ({
  currentSlug,
  variant = 'full',
  title,
  subtitle,
}) => {
  const items = currentSlug
    ? SERVICES.filter((s) => s.slug !== currentSlug)
    : SERVICES;

  const headline =
    title ??
    (currentSlug ? 'Explore other TriniBuild services' : 'Everything you need to grow in T&T');
  const sub =
    subtitle ??
    (currentSlug
      ? 'One account, every island business tool — built for entrepreneurs.'
      : 'One platform. Seven powerful services. Built for Trinidad & Tobago entrepreneurs.');

  const isCompact = variant === 'compact';

  return (
    <section
      className={`w-full ${isCompact ? 'py-12 bg-gray-50' : 'py-16 md:py-24 bg-white'}`}
      aria-label="TriniBuild services"
    >
      <div className="max-w-6xl mx-auto px-4">
        {!isCompact && (
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-3">
              {headline}
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              {sub}
            </p>
          </div>
        )}

        {isCompact && (
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">{headline}</h3>
            {sub && <p className="text-sm text-gray-600 mt-1">{sub}</p>}
          </div>
        )}

        <div
          className={`grid gap-4 ${
            isCompact
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {items.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.slug}
                to={service.path}
                onClick={() => trackClick(service.slug, currentSlug ?? 'home')}
                className={`group block bg-white rounded-2xl border-2 border-gray-100 p-5 md:p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${service.accentBorder}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${service.accentBg} flex items-center justify-center mb-4`}
                >
                  <Icon size={24} className={service.accentText} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {service.title}
                </h3>
                {!isCompact && (
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {service.tagline}
                  </p>
                )}
                <div
                  className={`inline-flex items-center gap-1 text-sm font-bold ${service.accentText} group-hover:gap-2 transition-all`}
                >
                  {isCompact ? 'Learn more' : service.cta}
                  <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>

        {!isCompact && (
          <div className="text-center mt-10">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-trini-red"
            >
              Compare plans & pricing
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesShowcase;
