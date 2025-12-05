import React, { useState, useEffect } from 'react';
import {
    Shield,
    ShieldCheck,
    ShieldAlert,
    Award,
    Star,
    CheckCircle,
    AlertTriangle,
    User,
    Verified,
    Info
} from 'lucide-react';
import {
    getTrustDisplayInfo,
    TrustDisplayInfo,
    getScoreColor,
    getScoreBgColor,
    TRUST_LEVELS
} from '../services/trustScoreService';

// ============================================
// TYPES
// ============================================

interface TrustBadgeProps {
    userId: string;
    size?: 'sm' | 'md' | 'lg';
    showScore?: boolean;
    showLabel?: boolean;
    showTooltip?: boolean;
    className?: string;
}

interface TrustScoreDisplayProps {
    score: number;
    level: number;
    size?: 'sm' | 'md' | 'lg';
    showBreakdown?: boolean;
}

// ============================================
// SIZE CONFIGS
// ============================================

const sizeConfigs = {
    sm: {
        badge: 'h-5 w-5',
        text: 'text-xs',
        container: 'gap-1 px-1.5 py-0.5',
        score: 'text-xs font-medium'
    },
    md: {
        badge: 'h-6 w-6',
        text: 'text-sm',
        container: 'gap-1.5 px-2 py-1',
        score: 'text-sm font-bold'
    },
    lg: {
        badge: 'h-8 w-8',
        text: 'text-base',
        container: 'gap-2 px-3 py-1.5',
        score: 'text-lg font-bold'
    }
};

// ============================================
// TRUST BADGE COMPONENT
// ============================================

export const TrustBadge: React.FC<TrustBadgeProps> = ({
    userId,
    size = 'md',
    showScore = true,
    showLabel = false,
    showTooltip = true,
    className = ''
}) => {
    const [trustInfo, setTrustInfo] = useState<TrustDisplayInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTooltipPopup, setShowTooltipPopup] = useState(false);

    useEffect(() => {
        const loadTrust = async () => {
            try {
                const info = await getTrustDisplayInfo(userId);
                setTrustInfo(info);
            } catch (err) {
                console.error('Error loading trust info:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadTrust();
    }, [userId]);

    const config = sizeConfigs[size];

    if (isLoading) {
        return (
            <div className={`inline-flex items-center ${config.container} bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse`}>
                <div className={`${config.badge} bg-gray-300 dark:bg-gray-600 rounded-full`} />
            </div>
        );
    }

    if (!trustInfo) {
        return (
            <div className={`inline-flex items-center ${config.container} bg-gray-100 dark:bg-gray-800 rounded-full`}>
                <User className={`${config.badge} text-gray-400`} />
                {showLabel && <span className={`${config.text} text-gray-500`}>New User</span>}
            </div>
        );
    }

    const getBadgeIcon = () => {
        switch (trustInfo.level) {
            case 3:
                return <Award className={`${config.badge} text-yellow-500`} />;
            case 2:
                return <ShieldCheck className={`${config.badge} text-green-500`} />;
            case 1:
                return <Verified className={`${config.badge} text-blue-500`} />;
            default:
                if (trustInfo.score >= 80) return <Shield className={`${config.badge} text-green-500`} />;
                if (trustInfo.score >= 60) return <Shield className={`${config.badge} text-yellow-500`} />;
                if (trustInfo.score >= 40) return <Shield className={`${config.badge} text-orange-500`} />;
                return <ShieldAlert className={`${config.badge} text-red-500`} />;
        }
    };

    const getBgColor = () => {
        if (trustInfo.level >= 3) return 'bg-yellow-500/10 border-yellow-500/30';
        if (trustInfo.level >= 2) return 'bg-green-500/10 border-green-500/30';
        if (trustInfo.level >= 1) return 'bg-blue-500/10 border-blue-500/30';
        if (trustInfo.score >= 80) return 'bg-green-500/10 border-green-500/30';
        if (trustInfo.score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
        if (trustInfo.score >= 40) return 'bg-orange-500/10 border-orange-500/30';
        return 'bg-red-500/10 border-red-500/30';
    };

    return (
        <div className="relative inline-block">
            <div
                className={`inline-flex items-center ${config.container} ${getBgColor()} border rounded-full cursor-pointer transition-all hover:shadow-md ${className}`}
                onMouseEnter={() => showTooltip && setShowTooltipPopup(true)}
                onMouseLeave={() => setShowTooltipPopup(false)}
                role="button"
                tabIndex={0}
                aria-label={`Trust Score: ${trustInfo.score} - ${trustInfo.label}`}
            >
                {getBadgeIcon()}

                {showScore && (
                    <span className={`${config.score} ${getScoreColor(trustInfo.score)}`}>
                        {trustInfo.score}
                    </span>
                )}

                {showLabel && (
                    <span className={`${config.text} text-gray-700 dark:text-gray-300`}>
                        {trustInfo.label}
                    </span>
                )}
            </div>

            {/* Tooltip */}
            {showTooltipPopup && showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                    <div className="bg-gray-900 text-white rounded-xl p-4 shadow-xl min-w-[240px]">
                        <div className="flex items-center gap-3 mb-3">
                            {getBadgeIcon()}
                            <div>
                                <div className="font-bold text-lg">{trustInfo.score}/100</div>
                                <div className="text-sm text-gray-400">{trustInfo.label}</div>
                            </div>
                        </div>

                        {/* Verification Level */}
                        <div className="flex items-center gap-2 text-sm mb-2">
                            <CheckCircle className={`h-4 w-4 ${trustInfo.level >= 1 ? 'text-green-500' : 'text-gray-500'}`} />
                            <span className={trustInfo.level >= 1 ? 'text-white' : 'text-gray-500'}>
                                {TRUST_LEVELS[trustInfo.level as keyof typeof TRUST_LEVELS].label}
                            </span>
                        </div>

                        {/* Badges */}
                        {trustInfo.badges.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-700">
                                <div className="text-xs text-gray-400 mb-1">Badges</div>
                                <div className="flex flex-wrap gap-1">
                                    {trustInfo.badges.slice(0, 3).map((badge, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 bg-gray-800 rounded text-xs"
                                        >
                                            {badge.badge_name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Arrow */}
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2">
                            <div className="w-3 h-3 bg-gray-900 rotate-45" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// TRUST SCORE DISPLAY (Larger version for profiles)
// ============================================

export const TrustScoreDisplay: React.FC<TrustScoreDisplayProps> = ({
    score,
    level,
    size = 'md',
    showBreakdown = false
}) => {
    const radius = size === 'lg' ? 50 : size === 'md' ? 40 : 30;
    const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    const getGradientColors = () => {
        if (score >= 80) return ['#10B981', '#34D399'];
        if (score >= 60) return ['#F59E0B', '#FBBF24'];
        if (score >= 40) return ['#F97316', '#FB923C'];
        return ['#EF4444', '#F87171'];
    };

    const [color1, color2] = getGradientColors();
    const levelInfo = TRUST_LEVELS[level as keyof typeof TRUST_LEVELS];

    return (
        <div className="flex flex-col items-center">
            {/* Circular Progress */}
            <div className="relative">
                <svg
                    width={(radius + strokeWidth) * 2}
                    height={(radius + strokeWidth) * 2}
                    className="transform -rotate-90"
                >
                    <defs>
                        <linearGradient id={`trustGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={color1} />
                            <stop offset="100%" stopColor={color2} />
                        </linearGradient>
                    </defs>

                    {/* Background circle */}
                    <circle
                        cx={radius + strokeWidth}
                        cy={radius + strokeWidth}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-gray-200 dark:text-gray-700"
                    />

                    {/* Progress circle */}
                    <circle
                        cx={radius + strokeWidth}
                        cy={radius + strokeWidth}
                        r={radius}
                        fill="none"
                        stroke={`url(#trustGradient-${score})`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-bold ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'}`}>
                        {score}
                    </span>
                    <span className="text-xs text-gray-500">Trust Score</span>
                </div>
            </div>

            {/* Level Badge */}
            <div className={`mt-3 px-3 py-1 rounded-full text-sm font-medium ${level >= 3 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                    level >= 2 ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                        level >= 1 ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                            'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                }`}>
                {levelInfo.label}
            </div>

            {/* Breakdown */}
            {showBreakdown && (
                <div className="mt-4 w-full max-w-xs space-y-2">
                    <ScoreBreakdownBar label="Transactions" value={75} />
                    <ScoreBreakdownBar label="Performance" value={82} />
                    <ScoreBreakdownBar label="Reviews" value={90} />
                    <ScoreBreakdownBar label="Profile" value={65} />
                </div>
            )}
        </div>
    );
};

// ============================================
// SCORE BREAKDOWN BAR
// ============================================

const ScoreBreakdownBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${getScoreBgColor(value)}`}
                style={{ width: `${value}%` }}
            />
        </div>
    </div>
);

// ============================================
// VERIFICATION STATUS BADGE
// ============================================

interface VerificationStatusProps {
    status: 'unverified' | 'basic' | 'id_verified' | 'trusted_pro';
    size?: 'sm' | 'md';
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
    status,
    size = 'md'
}) => {
    const configs = {
        unverified: {
            icon: <AlertTriangle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
            label: 'Unverified',
            className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        },
        basic: {
            icon: <CheckCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
            label: 'Basic Verified',
            className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        },
        id_verified: {
            icon: <ShieldCheck className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
            label: 'ID Verified',
            className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
        },
        trusted_pro: {
            icon: <Award className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
            label: 'Trusted Pro',
            className: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
        }
    };

    const config = configs[status];

    return (
        <span className={`inline-flex items-center gap-1 ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'} rounded-full font-medium ${config.className}`}>
            {config.icon}
            {config.label}
        </span>
    );
};

// ============================================
// MINI TRUST INDICATOR (for listings)
// ============================================

interface MiniTrustIndicatorProps {
    score: number;
    verified?: boolean;
}

export const MiniTrustIndicator: React.FC<MiniTrustIndicatorProps> = ({
    score,
    verified = false
}) => {
    return (
        <div className="flex items-center gap-1">
            <Shield className={`h-3.5 w-3.5 ${getScoreColor(score)}`} />
            <span className={`text-xs font-medium ${getScoreColor(score)}`}>{score}</span>
            {verified && (
                <CheckCircle className="h-3 w-3 text-blue-500" />
            )}
        </div>
    );
};

export default TrustBadge;
