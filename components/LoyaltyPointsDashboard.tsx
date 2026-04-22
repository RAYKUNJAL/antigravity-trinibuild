/**
 * 💰 LOYALTY POINTS DASHBOARD
 * Points tracker, tier progression, redemption options
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gamificationEngine } from '../services/gamificationEngineV2';
import { supabase } from '../services/supabaseClient';

interface LoyaltyDashboardProps {
  userId: string;
}

export const LoyaltyPointsDashboard: React.FC<LoyaltyDashboardProps> = ({ userId }) => {
  const [loyalty, setLoyalty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [redeeming, setRedeeming] = useState(false);

  const TIER_COLORS = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };

  const TIER_THRESHOLDS = {
    bronze: 0,
    silver: 2000,
    gold: 5000,
    platinum: 10000,
  };

  const REDEMPTION_OPTIONS = [
    { points: 100, reward: 'TT$5 Credit', icon: '💳' },
    { points: 200, reward: 'TT$15 Credit', icon: '💳' },
    { points: 500, reward: 'TT$50 Credit', icon: '💳' },
    { points: 1000, reward: 'TT$100 Credit', icon: '💳' },
    { points: 250, reward: 'Free Shipping', icon: '🚚' },
    { points: 500, reward: 'Pro Month (1 mo)', icon: '⭐' },
  ];

  useEffect(() => {
    loadLoyaltyData();
  }, [userId]);

  const loadLoyaltyData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Initialize if doesn't exist
        const initialized = await gamificationEngine.initializeLoyalty(userId);
        setLoyalty(initialized);
      } else {
        setLoyalty(data);
      }
    } catch (error) {
      console.error('Load loyalty error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (option: any) => {
    if (!loyalty || loyalty.available_points < option.points) {
      alert('Insufficient points!');
      return;
    }

    setRedeeming(true);

    try {
      const updated = await gamificationEngine.redeemPoints(
        userId,
        option.points,
        option.reward
      );
      setLoyalty(updated);
      setSelectedReward(null);
      alert(`✅ Redeemed! ${option.reward} added to your account.`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setRedeeming(false);
    }
  };

  const getProgressPercentage = () => {
    const current = loyalty?.total_points || 0;
    const nextTier = Object.entries(TIER_THRESHOLDS)
      .filter(([_, threshold]) => threshold > current)
      .map(([_, threshold]) => threshold)[0];

    if (!nextTier) return 100; // Platinum

    const current_threshold =
      Object.entries(TIER_THRESHOLDS).find(([_, threshold]) => threshold <= current)?.[1] || 0;

    return ((current - current_threshold) / (nextTier - current_threshold)) * 100;
  };

  if (loading) {
    return <div className="text-center py-8">Loading loyalty data...</div>;
  }

  if (!loyalty) {
    return <div className="text-center py-8 text-red-600">Failed to load loyalty data</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-trini-black mb-2">Your Loyalty Points</h1>
        <p className="text-gray-600">Earn points on every purchase and unlock rewards</p>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      >
        {/* Points Display */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-lg border-l-8 border-trini-red">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Available Points</p>
              <p className="text-6xl font-black text-trini-red">
                {loyalty.available_points.toLocaleString()}
              </p>
            </div>

            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-4xl"
              style={{ backgroundColor: TIER_COLORS[loyalty.tier] }}
            >
              {loyalty.tier === 'platinum' && '👑'}
              {loyalty.tier === 'gold' && '🏆'}
              {loyalty.tier === 'silver' && '⭐'}
              {loyalty.tier === 'bronze' && '🎖️'}
            </div>
          </div>

          {/* Tier Progress */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 capitalize">
                {loyalty.tier} TIER
              </span>
              <span className="text-sm text-gray-600">
                {loyalty.total_points.toLocaleString()} points total
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-trini-red to-orange-500"
              />
            </div>
          </div>

          {/* Tier Info */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
            <div className={loyalty.tier === 'bronze' ? 'text-trini-black' : 'text-gray-400'}>
              Bronze<br />0 pts
            </div>
            <div className={loyalty.tier === 'silver' ? 'text-trini-black' : 'text-gray-400'}>
              Silver<br />2K pts
            </div>
            <div className={loyalty.tier === 'gold' ? 'text-trini-black' : 'text-gray-400'}>
              Gold<br />5K pts
            </div>
            <div className={loyalty.tier === 'platinum' ? 'text-trini-black' : 'text-gray-400'}>
              Platinum<br />10K pts
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-gray-600 mb-2">Lifetime Purchases</p>
            <p className="text-4xl font-black text-trini-black">
              TT${(loyalty.lifetime_purchases || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-gray-600 mb-2">Current Streak</p>
            <p className="text-4xl font-black text-orange-500">
              {loyalty.streak_count || 0} 📅
            </p>
          </div>
        </div>
      </motion.div>

      {/* Redemption Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-trini-black mb-6">Redeem Your Points</h2>

        {selectedReward ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 shadow-lg border-4 border-trini-red"
          >
            <button
              onClick={() => setSelectedReward(null)}
              className="text-sm text-gray-600 mb-6 hover:text-trini-red"
            >
              ← Back
            </button>

            <div className="text-center mb-8">
              <p className="text-6xl mb-4">{selectedReward.icon}</p>
              <h3 className="text-3xl font-black text-trini-black mb-2">{selectedReward.reward}</h3>
              <p className="text-2xl font-black text-trini-red">
                {selectedReward.points} Points
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-center text-gray-600">
                {loyalty.available_points >= selectedReward.points
                  ? '✅ You have enough points!'
                  : `❌ You need ${selectedReward.points - loyalty.available_points} more points`}
              </p>

              <button
                onClick={() => handleRedeem(selectedReward)}
                disabled={
                  redeeming ||
                  loyalty.available_points < selectedReward.points
                }
                className="w-full py-4 bg-trini-red text-white font-black rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {redeeming ? '⏳ Redeeming...' : '✅ Confirm Redemption'}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REDEMPTION_OPTIONS.map((option, idx) => (
              <motion.button
                key={idx}
                onClick={() => setSelectedReward(option)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-2xl p-6 shadow-lg transition-all text-center ${
                  loyalty.available_points >= option.points
                    ? 'bg-white cursor-pointer hover:shadow-xl'
                    : 'bg-gray-100 cursor-not-allowed opacity-50'
                }`}
              >
                <p className="text-4xl mb-3">{option.icon}</p>
                <p className="text-lg font-black text-trini-black mb-2">{option.reward}</p>
                <p
                  className={`font-bold ${
                    loyalty.available_points >= option.points
                      ? 'text-trini-red'
                      : 'text-gray-400'
                  }`}
                >
                  {option.points} pts
                </p>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-black text-trini-black mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🛍️</div>
            <p className="font-bold text-trini-black mb-2">Shop & Earn</p>
            <p className="text-sm text-gray-600">Earn 1 point per TT$1 spent</p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-3">📈</div>
            <p className="font-bold text-trini-black mb-2">Level Up</p>
            <p className="text-sm text-gray-600">Reach Gold & Platinum tiers for bonuses</p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-3">🎁</div>
            <p className="font-bold text-trini-black mb-2">Redeem</p>
            <p className="text-sm text-gray-600">Cash out points for rewards</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPointsDashboard;
