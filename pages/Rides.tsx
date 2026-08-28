import React, { useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

/**
 * Rides stay empty unless live drivers are on this origin.
 * Do not invent drivers, fares, or a live booking button.
 */
export const Rides: React.FC = () => {
  const [unavailable, setUnavailable] = useState(true);

  useEffect(() => {
    setUnavailable(!isSupabaseConfigured());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-gray-900 mb-3">Rides</h1>
        {unavailable ? (
          <>
            <p className="text-gray-600 mb-2">Rides are unavailable on this origin.</p>
            <p className="text-sm text-gray-500">
              No drivers are listed. Juvay does not invent a fare or a live booking button.
            </p>
          </>
        ) : (
          <p className="text-gray-600">No drivers are online.</p>
        )}
      </div>
    </div>
  );
};
