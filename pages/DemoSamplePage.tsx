import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Labeled sample only. Not a real shop. No pay. Do not publish Doubles as live inventory.
 */
export const DemoSamplePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-amber-50 px-4 py-12">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border-2 border-amber-400 p-8">
        <p className="inline-block text-xs font-black uppercase tracking-widest bg-amber-200 text-amber-900 px-3 py-1 rounded-full mb-4">
          Sample only — not a live shop
        </p>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Island Spoon Kitchen</h1>
        <p className="text-gray-600 mb-6">
          This page is a labeled layout sample. The menu items are illustrative. You cannot pay here. Nothing here is a published Juvay store.
        </p>
        <ul className="space-y-2 text-sm text-gray-500 mb-8">
          <li>Classic Doubles — sample, not for sale</li>
          <li>No checkout. No cash collection.</li>
        </ul>
        <Link to="/signup" className="block text-center py-3 rounded-xl bg-gray-900 text-white font-semibold">
          Create a real store
        </Link>
        <Link to="/" className="block text-center mt-3 text-sm text-gray-500">
          Back to Juvay
        </Link>
      </div>
    </div>
  );
};
