import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

/**
 * Events stay empty unless a live catalog is on this origin.
 * Do not invent events. Do not advertise a host CTA.
 */
export const Events: React.FC = () => {
  const [unavailable, setUnavailable] = useState(true);

  useEffect(() => {
    setUnavailable(!isSupabaseConfigured());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-gray-900 mb-3">Events</h1>
        {unavailable ? (
          <>
            <p className="text-gray-600 mb-2">Event listings are unavailable on this origin.</p>
            <p className="text-sm text-gray-500">
              No events are shown. Juvay does not invent concerts, tickets, or a host CTA.
            </p>
          </>
        ) : (
          <p className="text-gray-600">No published events.</p>
        )}
      </div>
    </div>
  );
};
