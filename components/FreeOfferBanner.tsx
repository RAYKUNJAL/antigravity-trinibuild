import React from 'react';
import { Gift, Zap, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FreeOfferBanner: React.FC = () => {
    return (
        <div className="bg-gradient-to-r from-trini-red via-red-600 to-trini-red text-white py-3 px-4 shadow-lg relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTMwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMzAgMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] animate-pulse"></div>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                {/* Left: Main Offer */}
                <div className="flex items-center gap-3 flex-1">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Gift className="h-6 w-6 animate-bounce" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg md:text-xl flex items-center gap-2">
                            🎁 FREE Lifetime Website + 10 Listings + 5 Marketplace Spots
                            <span className="bg-yellow-400 text-gray-900 text-xs px-2 py-0.5 rounded-full font-black animate-pulse">LIMITED</span>
                        </h3>
                        <p className="text-white/90 text-sm hidden md:block">
                            No credit card required • Setup in 5 minutes • Cancel anytime
                        </p>
                    </div>
                </div>

                {/* Right: CTA */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-bold">5 min setup</span>
                    </div>
                    <Link
                        to="/auth?mode=signup"
                        className="bg-white text-trini-red px-6 py-3 rounded-full font-bold text-sm md:text-base shadow-lg hover:bg-gray-100 transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                    >
                        Claim Your Free Site <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};
