import React, { useEffect, useState } from 'react';
import { CheckCircle, Circle, Zap, X } from 'lucide-react';
import { gamificationService, UserOnboarding } from '../services/gamificationService';
import { authService } from '../services/auth';

const ONBOARDING_STEPS = [
    { id: 'profile', label: 'Complete Profile', description: 'Add your business info' },
    { id: 'listing', label: 'Create First Listing', description: 'List your first item' },
    { id: 'customize', label: 'Customize Website', description: 'Make it yours' },
    { id: 'payment', label: 'Setup Payments', description: 'Start accepting money' },
    { id: 'share', label: 'Share Your Site', description: 'Get your first customer' }
];

export const OnboardingProgress: React.FC = () => {
    const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        loadOnboarding();
    }, []);

    const loadOnboarding = async () => {
        try {
            const user = authService.getCurrentUser();
            if (!user) return;

            let data = await gamificationService.getUserOnboarding(user.id);
            if (!data) {
                data = await gamificationService.initializeOnboarding(user.id);
            }
            setOnboarding(data);
        } catch (error) {
            console.error('Failed to load onboarding:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !onboarding || onboarding.completed_at || dismissed) {
        return null;
    }

    const progress = (onboarding.steps_completed.length / onboarding.step_total) * 100;
    const timeRemaining = Math.max(0, 5 - Math.floor((onboarding.steps_completed.length / onboarding.step_total) * 5));

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjQwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')]"></div>
            </div>

            {/* Close button */}
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                aria-label="Dismiss"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl">Build Your Site in {timeRemaining} Minutes</h3>
                        <p className="text-white/80 text-sm">
                            {onboarding.steps_completed.length} of {onboarding.step_total} steps completed
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                    <div className="bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                        <div
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="h-full w-full bg-white/30 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-right text-sm mt-1 text-white/80 font-bold">{Math.round(progress)}% Complete</p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {ONBOARDING_STEPS.map((step, index) => {
                        const isCompleted = onboarding.steps_completed.includes(step.id);
                        const isCurrent = index === onboarding.steps_completed.length;

                        return (
                            <div
                                key={step.id}
                                className={`p-3 rounded-lg transition-all ${isCompleted
                                        ? 'bg-green-500/30 border-2 border-green-400'
                                        : isCurrent
                                            ? 'bg-white/20 border-2 border-white animate-pulse'
                                            : 'bg-white/10 border-2 border-transparent'
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    {isCompleted ? (
                                        <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-white/60 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{step.label}</p>
                                        <p className="text-xs text-white/70 truncate">{step.description}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                {progress < 100 && (
                    <div className="mt-4 text-center">
                        <p className="text-sm text-white/90">
                            Complete setup to unlock <span className="font-bold text-yellow-300">exclusive badges</span> and{' '}
                            <span className="font-bold text-yellow-300">priority support</span>!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
