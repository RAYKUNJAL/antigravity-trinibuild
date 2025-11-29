import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Coins, X } from 'lucide-react';

export const DailyRewards: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scratched, setScratched] = useState(false);
    const [reward, setReward] = useState<{ type: string; value: string } | null>(null);

    useEffect(() => {
        // Check if user has already claimed today
        const lastClaim = localStorage.getItem('daily_reward_claim_date');
        const today = new Date().toDateString();

        if (lastClaim !== today) {
            // Show reward popup after a short delay
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleScratch = () => {
        // Simulate scratch effect
        setScratched(true);

        // Random reward logic
        const rewards = [
            { type: 'coupon', value: '5% OFF' },
            { type: 'coins', value: '10 TriniCoins' },
            { type: 'coins', value: '50 TriniCoins' },
            { type: 'shipping', value: 'Free Shipping' }
        ];
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        setReward(randomReward);

        // Save claim
        localStorage.setItem('daily_reward_claim_date', new Date().toDateString());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative">
                <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close Reward Popup"
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 z-10"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="bg-gradient-to-r from-trini-red to-pink-600 p-6 text-center text-white">
                    <Gift className="h-12 w-12 mx-auto mb-2 animate-bounce" />
                    <h3 className="text-2xl font-bold">Daily Login Bonus!</h3>
                    <p className="text-white/80 text-sm">Come back every day for free rewards.</p>
                </div>

                <div className="p-8 text-center">
                    {!scratched ? (
                        <div
                            onClick={handleScratch}
                            className="bg-gray-200 rounded-xl aspect-video flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                            <div className="relative z-10">
                                <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2 group-hover:text-gray-500" />
                                <p className="font-bold text-gray-500 group-hover:text-gray-700">Click to Scratch</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl aspect-video flex flex-col items-center justify-center animate-in zoom-in duration-300">
                            <p className="text-sm font-bold text-yellow-800 uppercase mb-1">You Won</p>
                            <h4 className="text-3xl font-extrabold text-trini-black mb-2">{reward?.value}</h4>
                            {reward?.type === 'coins' && <Coins className="h-6 w-6 text-yellow-500" />}
                            <p className="text-xs text-gray-500 mt-2">Added to your wallet</p>
                        </div>
                    )}

                    <button
                        onClick={() => setIsOpen(false)}
                        className="mt-6 w-full bg-trini-black text-white py-3 rounded-lg font-bold hover:bg-gray-800"
                    >
                        {scratched ? 'Awesome!' : 'Scratch Later'}
                    </button>
                </div>
            </div>
        </div>
    );
};
