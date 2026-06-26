import React from 'react';
import { Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Deals: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon + Title */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg mb-8">
          <Tag className="h-10 w-10 text-white transform -rotate-12" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          Flash Deals — Coming Soon 🔥
        </h1>

        <p className="text-xl text-gray-600 mb-10 max-w-lg mx-auto">
          The best deals from Caribbean merchants, delivered daily. Check back soon.
        </p>

        <Link
          to="/directory"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          Browse Stores
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};
