/**
 * Real store starters from services/storeStarters.ts — no invented shops.
 * Hero images are illustrative template art, labeled as such.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { starterList, type StarterId } from '../../services/storeStarters';

const FEATURED: StarterId[] = [
  'doubles',
  'street_food',
  'food',
  'fashion',
  'services',
  'general',
  'beauty',
  'home',
  'electronics',
  'auto',
];

export const TemplateShowcase: React.FC = () => {
  const starters = starterList().filter((s) => FEATURED.includes(s.id));
  // Keep FEATURED order
  const ordered = FEATURED.map((id) => starters.find((s) => s.id === id)).filter(Boolean) as typeof starters;

  return (
    <section id="templates" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0d9488]">Store starters</p>
          <h2 className="text-3xl font-black tracking-tight text-[#141414] sm:text-4xl">
            Built for stalls, shops and boutiques
          </h2>
          <p className="mt-4 text-lg text-[#4a453d]">
            Ten starters you can make your own. Photos on this page are illustrative template art — your store starts empty until
            you add a real item.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {ordered.map((s) => (
            <Link
              key={s.id}
              to={`/templates/${s.id}`}
              className="group overflow-hidden rounded-2xl border border-[#e8dcc8] bg-[#FFF8F0] shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ce1126]"
            >
              <div className="relative h-36 overflow-hidden" style={{ background: s.palette.heroBg }}>
                <img
                  src={s.heroImage}
                  alt=""
                  loading="lazy"
                  width={400}
                  height={220}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#141414]">
                  Starter
                </span>
                <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Illustrative
                </span>
              </div>
              <div className="p-3.5">
                <h3 className="font-bold text-[#141414]">{s.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-[#5c574e]">{s.useWhen}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/templates"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-[#0b1f24] px-6 py-3 font-bold text-[#0b1f24] hover:bg-[#0b1f24] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ce1126]"
          >
            See all templates
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TemplateShowcase;
