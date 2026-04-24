import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * SuccessStoriesPage — pre-launch placeholder.
 *
 * This page used to contain 6 fabricated merchant testimonials with specific
 * revenue numbers ("Maria Santos: +1,600% growth", etc.) and a fake metrics
 * block ("5,000+ Active Merchants", "2.5M+ Total Orders"). None of those
 * merchants or numbers existed. Under Trinidad & Tobago consumer protection
 * norms (and US FTC rules which Google, Facebook, and Meta Ads enforce),
 * fabricated endorsements are a hard no — they carry fines and ad account
 * suspensions, not just reputational risk.
 *
 * The routes `/success-stories` and `/stories` still point here so we don't
 * break any inbound links, but the content is now honest: we're pre-launch,
 * we don't have customers yet, and we're inviting founding merchants to be
 * the first success story.
 *
 * When real customers opt in to share their story, this file gets a proper
 * rewrite with their actual names, photos (with permission), and quotes.
 */
export const SuccessStoriesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-trini-red font-semibold text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Pre-launch · Be one of our first stories
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
            Merchant success stories — coming soon
          </h1>

          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            TriniBuild is a brand-new Trinidad-built platform. We don't have a stable of
            testimonials yet, and we won't invent any. What we do have: a working store
            builder, AI product listing, cash-on-delivery checkout, and a founding offer
            for the first 100 merchants.
          </p>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-8 sm:p-10 text-left mb-8">
            <h2 className="text-2xl font-bold mb-4">Founding merchant offer</h2>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-trini-red text-xl leading-none mt-0.5">✓</span>
                <span className="text-gray-200">Free Pro plan for 6 months (TT$1,194 value) — unlimited products, AI listing tool, analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-trini-red text-xl leading-none mt-0.5">✓</span>
                <span className="text-gray-200">Direct WhatsApp line to the founding team</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-trini-red text-xl leading-none mt-0.5">✓</span>
                <span className="text-gray-200">Featured placement on the marketplace at launch</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-trini-red text-xl leading-none mt-0.5">✓</span>
                <span className="text-gray-200">Your story featured here — with your permission — once you start selling</span>
              </li>
            </ul>
            <p className="text-sm text-gray-400 italic border-t border-gray-700 pt-4">
              Limited to the first 100 merchants who create a store and list at least one product.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-trini-red hover:bg-red-700 text-white font-bold transition-colors"
            >
              Claim my founding spot
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/18680000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp the team
            </a>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default SuccessStoriesPage;
