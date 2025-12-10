import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, PenTool, Image as ImageIcon, Rocket, CheckCircle2 } from 'lucide-react';

const GENERATION_STEPS = [
    { icon: Brain, text: "Analyzing business category..." },
    { icon: Search, text: "Researching local T&T market trends..." },
    { icon: PenTool, text: "Drafting compelling product descriptions..." },
    { icon: ImageIcon, text: "Selecting high-conversion imagery..." },
    { icon: Rocket, text: "Optimizing store performance..." },
];

export const AIGeneratingOverlay = ({ businessName, businessType }: { businessName: string, businessType: string }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Visual progression loop
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="max-w-md w-full">

                {/* Central Icon Animation */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-4 border-l-4 border-red-600"
                    />
                    <motion.div
                        animate={{ rotate: -180 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border-r-4 border-b-4 border-purple-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="w-10 h-10 text-gray-800" />
                    </div>
                </div>

                {/* Dynamic Text */}
                <div className="h-20 mb-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {GENERATION_STEPS[currentStep].text}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Building <span className="font-semibold text-red-600">{businessName}</span>
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${((currentStep + 1) / GENERATION_STEPS.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-red-600 to-purple-600"
                    />
                </div>

                {/* Steps List */}
                <div className="space-y-3 text-left pl-4">
                    {GENERATION_STEPS.map((step, idx) => (
                        <div key={idx} className={`flex items-center space-x-3 transition-all duration-500 ${idx <= currentStep ? 'opacity-100 transform translate-x-0' : 'opacity-30 transform -translate-x-2'}`}>
                            {idx < currentStep ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : idx === currentStep ? (
                                <step.icon className="w-5 h-5 text-red-600 animate-pulse" />
                            ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                            )}
                            <span className={`text-sm font-medium ${idx === currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                                {step.text}
                            </span>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};
