import React, { useEffect, useState } from 'react';
import { X, Gift, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ExitIntentPopup: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasShown, setHasShown] = useState(false);

    useEffect(() => {
        // Check if already shown in this session
        const shown = sessionStorage.getItem('exit_popup_shown');
        if (shown) {
            setHasShown(true);
            return;
        }

        const handleMouseLeave = (e: MouseEvent) => {
            // Only trigger if mouse is leaving from the top of the page
            if (e.clientY <= 0 && !hasShown) {
                setIsVisible(true);
                setHasShown(true);
                sessionStorage.setItem('exit_popup_shown', 'true');
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [hasShown]);

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-4">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-trini-red via-red-600 to-trini-red text-white p-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTMwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMzAgMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] animate-pulse"></div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
                        aria-label="Close"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                            <Gift className="h-8 w-8 animate-bounce" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-2">Wait! Don't Leave Empty-Handed!</h2>
                        <p className="text-xl text-white/90">Your FREE website is just one click away</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Offer highlights */}
                    <div className="mb-8">
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="h-8 w-8 text-yellow-600" />
                                <h3 className="text-2xl font-bold text-gray-900">Limited Time Offer</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-gray-900">FREE Lifetime Website</p>
                                        <p className="text-sm text-gray-600">Your own professional Trinidad business site</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-gray-900">10 FREE Listings</p>
                                        <p className="text-sm text-gray-600">List your products or services immediately</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-gray-900">5 Marketplace Spots</p>
                                        <p className="text-sm text-gray-600">Reach thousands of Trinidad shoppers</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-gray-900">No Credit Card Required</p>
                                        <p className="text-sm text-gray-600">Start selling in 5 minutes, completely free</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social proof */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <p className="text-center text-sm text-gray-600">
                                <span className="font-bold text-trini-red">5,000+ Trini vendors</span> already building their business on TriniBuild
                            </p>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-3">
                        <Link
                            to="/auth?mode=signup"
                            onClick={handleClose}
                            className="w-full bg-gradient-to-r from-trini-red to-red-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                        >
                            Yes! Claim My Free Website Now <ArrowRight className="h-5 w-5" />
                        </Link>
                        <button
                            onClick={handleClose}
                            className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
                        >
                            No thanks, I'll pass on this free offer
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>100% Free</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>No Credit Card</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>5 Min Setup</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
