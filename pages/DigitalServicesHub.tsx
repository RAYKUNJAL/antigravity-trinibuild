import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { fetchWamStatus } from '../services/wamStatus';

/**
 * Digital codes are not a live catalog on this origin.
 * PayPal is out. Wam only if the rail is actually on — no pay→fulfill.
 */
export const DigitalServicesHub: React.FC = () => {
  const [wamOn, setWamOn] = useState(false);

  useEffect(() => {
    fetchWamStatus().then((s) => setWamOn(s.configured));
  }, []);

  return (
    <>
      <Helmet>
        <title>Digital codes | Juvay</title>
        <meta name="description" content="Digital codes are not for sale on Juvay yet. No PayPal. No invented catalog." />
      </Helmet>
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <h1 className="text-3xl font-black mb-4">Digital codes</h1>
          <p className="text-gray-400 mb-4">
            There is no digital catalog on this origin. Juvay does not sell game passes or streaming codes here.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            PayPal checkout is off. {wamOn ? 'Card rail status is on the server; this page still does not take payment or deliver codes.' : 'The paid card rail is off, so there is no pay button.'}
          </p>
          <Link to="/" className="text-red-400 font-bold hover:underline">
            Back to Juvay
          </Link>
        </div>
      </div>
    </>
  );
};
