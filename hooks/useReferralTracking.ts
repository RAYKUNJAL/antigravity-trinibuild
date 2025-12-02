import { useEffect } from 'react';
import { viralLoopsService } from '../services/viralLoopsService';

export const useReferralTracking = () => {
    useEffect(() => {
        // Check URL for referral code
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');

        if (refCode) {
            // Track the click
            viralLoopsService.trackReferralClick(refCode).catch(console.error);
        }

        // Check localStorage for existing referral
        const storedRef = localStorage.getItem('trinibuild_ref');
        const storedTime = localStorage.getItem('trinibuild_ref_time');

        if (storedRef && storedTime) {
            // Check if referral is still valid (30 days)
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
            const timeDiff = Date.now() - parseInt(storedTime);

            if (timeDiff > thirtyDaysInMs) {
                // Expired, clear it
                localStorage.removeItem('trinibuild_ref');
                localStorage.removeItem('trinibuild_ref_time');
            }
        }
    }, []);

    const trackSignup = async (newUserId: string) => {
        const refCode = localStorage.getItem('trinibuild_ref');

        if (refCode) {
            try {
                await viralLoopsService.trackReferralSignup(refCode, newUserId);
            } catch (error) {
                console.error('Failed to track referral signup:', error);
            }
        }
    };

    const trackConversion = async (
        userId: string,
        conversionType: 'first_listing' | 'first_sale' | 'upgrade',
        value?: number
    ) => {
        try {
            await viralLoopsService.trackConversion(userId, conversionType, value);
        } catch (error) {
            console.error('Failed to track conversion:', error);
        }
    };

    return {
        trackSignup,
        trackConversion
    };
};
