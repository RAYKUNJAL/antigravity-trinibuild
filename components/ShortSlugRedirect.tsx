import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export const ShortSlugRedirect: React.FC = () => {
    const { shortSlug } = useParams<{ shortSlug: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!shortSlug) return;

        supabase
            .from('stores')
            .select('slug')
            .eq('short_slug', shortSlug)
            .single()
            .then(({ data, error: err }) => {
                if (err || !data) {
                    setError(true);
                    return;
                }
                navigate(`/store/${data.slug}`, { replace: true });
            });
    }, [shortSlug, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-6xl font-black text-gray-200 mb-4">404</h1>
                    <p className="text-lg text-gray-600 mb-6">Store not found</p>
                    <a href="/" className="text-[#E61E2B] font-bold hover:underline">
                        Go to TriniBuild Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-8 h-8 border-3 border-[#E61E2B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-500">Loading store...</p>
            </div>
        </div>
    );
};
