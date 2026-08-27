import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';

export const TicketsLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      <SEO
        title="Event tickets | Juvay"
        description="Juvay ticket listings stay empty until a live catalog is on this origin. No invented events."
        keywords="event tickets trinidad, juvay tickets"
      />
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Event tickets</h1>
        <p className="text-lg text-gray-600 mb-8">
          Ticket listings are unavailable on this origin. There is no demo event and no invented lineup.
        </p>
        <Link to="/" className="text-trini-red font-bold hover:underline">
          Back to Juvay
        </Link>
      </div>
    </div>
  );
};
