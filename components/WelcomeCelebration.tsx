'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Users, Zap, Trophy, ArrowRight } from 'lucide-react';

interface WelcomeCelebrationProps {
  userName?: string;
  onComplete: () => void;
}

export default function WelcomeCelebration({ userName, onComplete }: WelcomeCelebrationProps) {
  const [step, setStep] = useState(0);
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    // Trigger confetti explosion
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Trinidad flag colors: Red, White, Black, Gold
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#E61E2B', '#FFFFFF', '#000000', '#FFD700'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#E61E2B', '#FFFFFF', '#000000', '#FFD700'],
      });
    }, 250);

    // Progression sequence
    const timer1 = setTimeout(() => setStep(1), 1500);
    const timer2 = setTimeout(() => setStep(2), 3500);
    const timer3 = setTimeout(() => setShowChecklist(true), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-trini-black via-gray-900 to-trini-black z-50 flex items-center justify-center overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-trini-gold rounded-full opacity-20"
            animate={{
              y: ['0vh', '100vh'],
              x: [
                `${Math.random() * 100}vw`,
                `${Math.random() * 100}vw`,
              ],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="space-y-6"
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-24 h-24 text-trini-gold mx-auto" />
              </motion.div>
              <h1 className="text-6xl md:text-8xl font-black text-white font-inter">
                Welcome{userName ? `, ${userName}` : ''}!
              </h1>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="bg-gradient-to-r from-trini-red via-red-600 to-trini-red text-white px-8 py-4 rounded-full inline-block mb-6 shadow-2xl">
                  <span className="text-2xl font-black font-inter flex items-center gap-2">
                    <Trophy className="w-8 h-8" />
                    You're Now Part of Something Bigger
                  </span>
                </div>
              </motion.div>

              <h2 className="text-5xl md:text-7xl font-black text-transparent bg-gradient-to-r from-trini-gold via-yellow-300 to-trini-gold bg-clip-text font-inter leading-tight">
                Your Digital Empire
                <br />
                Starts Today
              </h2>

              <p className="text-2xl text-gray-300 font-inter max-w-2xl mx-auto">
                Join <motion.span
                  key={Math.random()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-trini-gold font-bold"
                >
                  2,847
                </motion.span> Trinidad & Tobago entrepreneurs building their brands online
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: Zap, label: 'Store Live in 5 Minutes', color: 'from-yellow-400 to-orange-500' },
                  { icon: Users, label: 'Community Support 24/7', color: 'from-blue-400 to-indigo-500' },
                  { icon: Trophy, label: 'First to Market Advantage', color: 'from-green-400 to-emerald-500' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white font-bold text-lg font-inter">{item.label}</p>
                  </motion.div>
                ))}
              </div>

              {showChecklist && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-8 shadow-2xl max-w-2xl mx-auto"
                >
                  <h3 className="text-3xl font-black text-gray-900 font-inter mb-6">
                    Let's Get You Started
                  </h3>

                  <div className="space-y-4 mb-8">
                    {[
                      { label: '✓ Account Created', done: true },
                      { label: 'Choose Your Template', done: false },
                      { label: 'Add Your First Product', done: false },
                      { label: 'Go Live & Start Selling', done: false },
                    ].map((task, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className={`flex items-center gap-3 p-4 rounded-xl ${
                          task.done
                            ? 'bg-green-50 border-2 border-green-500'
                            : 'bg-gray-50 border-2 border-gray-200'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          task.done ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {task.done && <span className="text-white text-sm">✓</span>}
                        </div>
                        <span className={`font-inter font-semibold ${
                          task.done ? 'text-green-900' : 'text-gray-700'
                        }`}>
                          {task.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    onClick={onComplete}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gradient-to-r from-trini-red to-red-700 text-white px-8 py-4 rounded-full font-black text-xl font-inter shadow-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>Let's Build Your Empire</span>
                    <ArrowRight className="w-6 h-6" />
                  </motion.button>

                  <p className="text-gray-500 text-sm font-inter mt-4">
                    🔒 No credit card required • Cancel anytime
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
