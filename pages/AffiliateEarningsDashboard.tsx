import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Users, Calendar, Download, 
  CreditCard, AlertCircle, CheckCircle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface EarningRecord {
  id: string;
  referralName: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'failed';
  tier: 'bronze' | 'silver' | 'gold';
}

export const AffiliateEarningsDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    monthlyEarnings: 0,
    totalReferrals: 0,
    activeTier: 'bronze'
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      await loadEarnings(user.id);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEarnings = async (userId: string) => {
    try {
      // Mock earnings data for demo
      const mockEarnings: EarningRecord[] = [
        {
          id: '1',
          referralName: 'Caribbean Fashion Co.',
          amount: 1200,
          date: '2026-04-20',
          status: 'paid',
          tier: 'silver'
        },
        {
          id: '2',
          referralName: 'Island Eats Kitchen',
          amount: 950,
          date: '2026-04-18',
          status: 'paid',
          tier: 'bronze'
        },
        {
          id: '3',
          referralName: 'TechHub Trinidad',
          amount: 2100,
          date: '2026-04-15',
          status: 'paid',
          tier: 'gold'
        },
        {
          id: '4',
          referralName: 'Green Thumb Gardens',
          amount: 650,
          date: '2026-04-10',
          status: 'pending',
          tier: 'bronze'
        }
      ];

      setEarnings(mockEarnings);
      
      const totalEarnings = mockEarnings.reduce((sum, e) => sum + e.amount, 0);
      const monthlyEarnings = mockEarnings
        .filter(e => {
          const date = new Date(e.date);
          const now = new Date();
          return date.getMonth() === now.getMonth();
        })
        .reduce((sum, e) => sum + e.amount, 0);

      setStats({
        totalEarnings,
        monthlyEarnings,
        totalReferrals: mockEarnings.length,
        activeTier: 'silver'
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E61E2B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your earnings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        className="bg-white border-b border-gray-200 sticky top-16 z-40"
        variants={item}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-black text-gray-900">Affiliate Earnings</h1>
          <p className="text-gray-600 mt-2">Track your referrals and commissions</p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={item} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Earnings</p>
                <p className="text-3xl font-black text-gray-900">
                  TT${stats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">This Month</p>
                <p className="text-3xl font-black text-gray-900">
                  TT${stats.monthlyEarnings.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600" />
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Referrals</p>
                <p className="text-3xl font-black text-gray-900">{stats.totalReferrals}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600" />
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Current Tier</p>
                <p className="text-2xl font-black text-[#E61E2B] capitalize">
                  {stats.activeTier}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-[#E61E2B]" />
            </div>
          </motion.div>
        </motion.div>

        {/* Period Selector */}
        <motion.div 
          className="bg-white rounded-lg p-6 mb-8 border border-gray-200"
          variants={item}
          initial="hidden"
          animate="visible"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Earnings History</h2>
            <div className="flex gap-2">
              {['month', 'quarter', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period as any)}
                  className={`px-4 py-2 rounded-lg font-bold transition ${
                    selectedPeriod === period
                      ? 'bg-[#E61E2B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Earnings Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Referral</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-900">Tier</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-900">Amount</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-900">Date</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((earning) => (
                  <tr key={earning.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="py-4 px-4 font-bold text-gray-900">{earning.referralName}</td>
                    <td className="text-center py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        earning.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                        earning.tier === 'silver' ? 'bg-gray-200 text-gray-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {earning.tier}
                      </span>
                    </td>
                    <td className="text-right py-4 px-4 font-bold text-green-600">
                      TT${earning.amount.toLocaleString()}
                    </td>
                    <td className="text-center py-4 px-4 text-gray-600">
                      {new Date(earning.date).toLocaleDateString()}
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        earning.status === 'paid' ? 'bg-green-100 text-green-700' :
                        earning.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {earning.status === 'paid' && <CheckCircle className="w-4 h-4" />}
                        {earning.status === 'pending' && <Calendar className="w-4 h-4" />}
                        {earning.status === 'failed' && <AlertCircle className="w-4 h-4" />}
                        {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Payout Info */}
        <motion.div 
          className="bg-blue-50 border border-blue-200 rounded-lg p-6"
          variants={item}
          initial="hidden"
          animate="visible"
        >
          <div className="flex gap-4">
            <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Next Payout</h3>
              <p className="text-blue-800">Your May earnings will be paid on June 1st via bank transfer to the account ending in ****2345.</p>
              <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
