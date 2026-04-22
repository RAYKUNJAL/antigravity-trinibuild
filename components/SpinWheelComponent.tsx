/**
 * 🎡 SPIN WHEEL COMPONENT
 * Interactive spin-to-win coupon system
 * Integrated with gamificationEngineV2
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gamificationEngine } from '../services/gamificationEngineV2';
import { supabase } from '../services/supabaseClient';

interface SpinWheelProps {
  userId: string;
  onReward?: (coupon: string, discount: number) => void;
}

export const SpinWheelComponent: React.FC<SpinWheelProps> = ({ userId, onReward }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [spinsRemaining, setSpinsRemaining] = useState(1);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);

  const segments = [
    { label: 'TT$50', color: '#E61E2B', percentage: 30, value: 'consolation' },
    { label: '10% OFF', color: '#FFD700', percentage: 25, value: 'win' },
    { label: '20% OFF', color: '#1F2937', percentage: 25, value: 'big_win' },
    { label: '🎁 MEGA', color: '#E61E2B', percentage: 20, value: 'mega_win' },
  ];

  useEffect(() => {
    checkSpinsRemaining();
  }, [userId]);

  const checkSpinsRemaining = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('spin_wheel_results')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`);

      setSpinsRemaining(Math.max(0, 1 - (count || 0)));
    } catch (error) {
      console.error('Check spins error:', error);
    }
  };

  const handleSpin = async () => {
    if (isSpinning || spinsRemaining <= 0) return;

    setIsSpinning(true);
    setError('');
    setResult(null);

    try {
      // Call gamification engine
      const wheelResult = await gamificationEngine.spinWheel(userId);

      // Calculate rotation (random between 0-360, but align with result)
      const newRotation = Math.random() * 360 + rotation;
      setRotation(newRotation);

      // Animate spin (3-5 seconds)
      setTimeout(() => {
        setResult(wheelResult);
        setIsSpinning(false);
        setSpinsRemaining(0);

        // Call callback
        if (onReward) {
          onReward(wheelResult.coupon_code, wheelResult.discount_percentage);
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Spin failed');
      setIsSpinning(false);
    }
  };

  const claimReward = async () => {
    if (!result) return;

    try {
      const claimed = await gamificationEngine.claimSpinReward(userId, result.id);
      if (claimed.success) {
        alert(`🎉 Coupon claimed! Use code: ${claimed.coupon}`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-trini-red/10 to-trini-black/10 p-4">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-trini-red mb-2">SPIN TO WIN! 🎡</h1>
        <p className="text-gray-600">Get exclusive discounts every day</p>
        {spinsRemaining > 0 && (
          <p className="text-sm text-green-600 font-semibold mt-2">
            ✅ {spinsRemaining} FREE SPIN TODAY
          </p>
        )}
        {spinsRemaining === 0 && (
          <p className="text-sm text-orange-600 font-semibold mt-2">
            Come back tomorrow for another spin!
          </p>
        )}
      </div>

      {/* Wheel */}
      <div className="relative mb-8">
        <motion.div
          ref={wheelRef}
          animate={{ rotate: isSpinning ? rotation + 3600 : rotation }}
          transition={{
            duration: isSpinning ? 3 : 0.3,
            ease: isSpinning ? 'easeOut' : 'easeInOut',
          }}
          className="w-80 h-80 relative"
        >
          <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
            {/* Segments */}
            {segments.map((segment, idx) => {
              const startAngle = (idx * 360) / segments.length;
              const endAngle = startAngle + 360 / segments.length;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = 150 + 120 * Math.cos(startRad);
              const y1 = 150 + 120 * Math.sin(startRad);
              const x2 = 150 + 120 * Math.cos(endRad);
              const y2 = 150 + 120 * Math.sin(endRad);

              const largeArc = 360 / segments.length > 180 ? 1 : 0;

              const pathData = [
                `M 150 150`,
                `L ${x1} ${y1}`,
                `A 120 120 0 ${largeArc} 1 ${x2} ${y2}`,
                'Z',
              ].join(' ');

              const textAngle = startAngle + 180 / segments.length;
              const textRad = (textAngle * Math.PI) / 180;
              const textX = 150 + 70 * Math.cos(textRad);
              const textY = 150 + 70 * Math.sin(textRad);

              return (
                <g key={idx}>
                  {/* Segment */}
                  <path
                    d={pathData}
                    fill={segment.color}
                    stroke="white"
                    strokeWidth="3"
                    opacity="0.95"
                  />

                  {/* Label */}
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-black text-lg"
                    fill="white"
                    style={{
                      transform: `rotate(${textAngle}deg)`,
                      transformOrigin: `0 0`,
                    }}
                  >
                    {segment.label}
                  </text>
                </g>
              );
            })}

            {/* Center circle */}
            <circle cx="150" cy="150" r="30" fill="#E61E2B" stroke="white" strokeWidth="3" />
            <text
              x="150"
              y="150"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-black text-white text-2xl"
              fill="white"
            >
              SPIN
            </text>
          </svg>
        </motion.div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3">
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-trini-red drop-shadow-lg" />
        </div>
      </div>

      {/* Controls */}
      <div className="text-center space-y-4 mb-8">
        <button
          onClick={handleSpin}
          disabled={isSpinning || spinsRemaining <= 0}
          className="px-12 py-4 bg-trini-red text-white font-black text-lg rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg"
        >
          {isSpinning ? '🎡 SPINNING...' : spinsRemaining > 0 ? '🎯 SPIN NOW!' : '⏰ COME BACK TOMORROW'}
        </button>

        {error && (
          <p className="text-red-600 font-semibold text-sm">{error}</p>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full border-4 border-trini-red"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">
              {result.result === 'mega_win' && '🎊'}
              {result.result === 'big_win' && '🎉'}
              {result.result === 'win' && '✨'}
              {result.result === 'consolation' && '🎁'}
            </div>

            <h2 className="text-2xl font-black text-trini-red mb-2">
              {result.result === 'mega_win' && 'MEGA WIN!'}
              {result.result === 'big_win' && 'BIG WIN!'}
              {result.result === 'win' && 'YOU WON!'}
              {result.result === 'consolation' && 'TRY AGAIN TOMORROW'}
            </h2>

            <p className="text-4xl font-black text-trini-red mb-4">
              {result.discount_percentage}% OFF
            </p>

            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Your Coupon Code</p>
              <p className="text-2xl font-mono font-black text-trini-black">
                {result.coupon_code}
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Valid until {new Date(result.expires_at).toLocaleDateString()}
            </p>

            <button
              onClick={claimReward}
              className="w-full px-6 py-3 bg-trini-red text-white font-black rounded-lg hover:bg-red-700 transform hover:scale-105 transition-all"
            >
              CLAIM COUPON
            </button>
          </div>
        </motion.div>
      )}

      {/* Info */}
      <div className="mt-12 max-w-md text-center text-sm text-gray-600">
        <p>💡 One free spin per day! Bigger discounts for loyal customers.</p>
        <p className="mt-2">🎁 Win up to 50% OFF + exclusive badges!</p>
      </div>
    </div>
  );
};

export default SpinWheelComponent;
