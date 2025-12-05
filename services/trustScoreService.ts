/**
 * TriniBuild Trust Score System Service
 * Key: we_trust_score
 * 
 * Universal trust rating for all users: drivers, vendors, landlords, job posters, etc.
 */

import { supabase } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export type VerificationLevel = 0 | 1 | 2 | 3;
export type VerificationStatus = 'unverified' | 'basic' | 'id_verified' | 'trusted_pro';

export interface TrustScore {
    id: string;
    user_id: string;
    score: number;
    verification_level: VerificationLevel;
    verification_status: VerificationStatus;

    // Component scores
    transaction_score: number;
    performance_score: number;
    review_score: number;
    profile_score: number;
    age_score: number;

    // Metrics
    total_transactions: number;
    successful_transactions: number;
    cancelled_transactions: number;
    on_time_deliveries: number;
    late_deliveries: number;
    total_reviews: number;
    positive_reviews: number;
    negative_reviews: number;
    disputes_opened: number;
    disputes_lost: number;

    // Verification flags
    email_verified: boolean;
    phone_verified: boolean;
    national_id_verified: boolean;
    address_verified: boolean;
    business_docs_verified: boolean;
    bank_account_linked: boolean;

    // Profile
    profile_completeness: number;
    has_profile_photo: boolean;
    has_bio: boolean;
    has_location: boolean;

    // Account
    account_age_days: number;
    last_activity_at: string;

    // Flags
    is_flagged: boolean;
    flag_reason?: string;
    is_suspended: boolean;
    suspension_reason?: string;

    created_at: string;
    updated_at: string;
}

export interface TrustScoreHistory {
    id: string;
    user_id: string;
    previous_score: number;
    new_score: number;
    score_change: number;
    change_reason: string;
    change_type: string;
    related_entity_type?: string;
    related_entity_id?: string;
    created_at: string;
}

export interface VerificationRequest {
    id: string;
    user_id: string;
    verification_type: string;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
    document_url?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    rejection_reason?: string;
    submitted_at: string;
}

export interface TrustBadge {
    id: string;
    user_id: string;
    badge_type: string;
    badge_name: string;
    badge_description?: string;
    badge_icon?: string;
    earned_at: string;
    expires_at?: string;
    is_active: boolean;
}

export interface TrustDisplayInfo {
    score: number;
    level: VerificationLevel;
    status: VerificationStatus;
    label: string;
    color: string;
    icon: string;
    badges: TrustBadge[];
}

// ============================================
// TRUST SCORE LABELS & COLORS
// ============================================

export const TRUST_LEVELS = {
    0: { label: 'Unverified', color: 'gray', icon: 'user' },
    1: { label: 'Basic Verified', color: 'blue', icon: 'check' },
    2: { label: 'ID Verified', color: 'green', icon: 'shield-check' },
    3: { label: 'Trusted Pro', color: 'gold', icon: 'award' }
};

export const getScoreLabel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'Excellent', color: 'emerald' };
    if (score >= 80) return { label: 'Very Good', color: 'green' };
    if (score >= 70) return { label: 'Good', color: 'lime' };
    if (score >= 60) return { label: 'Fair', color: 'yellow' };
    if (score >= 50) return { label: 'Average', color: 'orange' };
    if (score >= 40) return { label: 'Below Average', color: 'red' };
    return { label: 'Poor', color: 'red' };
};

export const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
};

export const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get trust score for a user
 */
export const getTrustScore = async (userId: string): Promise<TrustScore | null> => {
    const { data, error } = await supabase
        .from('trust_scores')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;
    return data as TrustScore;
};

/**
 * Get trust display info for UI
 */
export const getTrustDisplayInfo = async (userId: string): Promise<TrustDisplayInfo | null> => {
    const score = await getTrustScore(userId);
    if (!score) return null;

    const badges = await getTrustBadges(userId);
    const levelInfo = TRUST_LEVELS[score.verification_level];
    const scoreInfo = getScoreLabel(score.score);

    return {
        score: score.score,
        level: score.verification_level,
        status: score.verification_status,
        label: score.verification_level >= 2 ? levelInfo.label : scoreInfo.label,
        color: score.verification_level >= 2 ? levelInfo.color : scoreInfo.color,
        icon: levelInfo.icon,
        badges
    };
};

/**
 * Get trust badges for a user
 */
export const getTrustBadges = async (userId: string): Promise<TrustBadge[]> => {
    const { data, error } = await supabase
        .from('trust_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('earned_at', { ascending: false });

    if (error || !data) return [];
    return data as TrustBadge[];
};

/**
 * Get trust score history
 */
export const getTrustHistory = async (
    userId: string,
    limit = 20
): Promise<TrustScoreHistory[]> => {
    const { data, error } = await supabase
        .from('trust_score_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !data) return [];
    return data as TrustScoreHistory[];
};

// ============================================
// UPDATE FUNCTIONS
// ============================================

/**
 * Update profile completeness
 */
export const updateProfileCompleteness = async (
    userId: string,
    profile: {
        has_photo?: boolean;
        has_bio?: boolean;
        has_location?: boolean;
        has_phone?: boolean;
        has_skills?: boolean;
    }
): Promise<void> => {
    const fields = Object.values(profile);
    const completeness = (fields.filter(Boolean).length / fields.length) * 100;

    await supabase
        .from('trust_scores')
        .update({
            profile_completeness: Math.round(completeness),
            has_profile_photo: profile.has_photo || false,
            has_bio: profile.has_bio || false,
            has_location: profile.has_location || false,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
};

/**
 * Record a completed transaction
 */
export const recordTransaction = async (
    userId: string,
    successful: boolean,
    onTime: boolean
): Promise<void> => {
    const { data: current } = await supabase
        .from('trust_scores')
        .select('total_transactions, successful_transactions, on_time_deliveries, late_deliveries')
        .eq('user_id', userId)
        .single();

    if (!current) return;

    await supabase
        .from('trust_scores')
        .update({
            total_transactions: current.total_transactions + 1,
            successful_transactions: successful ? current.successful_transactions + 1 : current.successful_transactions,
            on_time_deliveries: onTime ? current.on_time_deliveries + 1 : current.on_time_deliveries,
            late_deliveries: !onTime ? current.late_deliveries + 1 : current.late_deliveries,
            last_activity_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    // Recalculate score via RPC
    await supabase.rpc('record_trust_change', {
        p_user_id: userId,
        p_change_type: successful ? 'transaction_complete' : 'transaction_cancelled',
        p_reason: successful ? 'Transaction completed successfully' : 'Transaction was cancelled'
    });
};

/**
 * Record a review received
 */
export const recordReview = async (
    userId: string,
    rating: number,
    reviewId: string
): Promise<void> => {
    const isPositive = rating >= 4;
    const isNegative = rating <= 2;

    const { data: current } = await supabase
        .from('trust_scores')
        .select('total_reviews, positive_reviews, negative_reviews')
        .eq('user_id', userId)
        .single();

    if (!current) return;

    await supabase
        .from('trust_scores')
        .update({
            total_reviews: current.total_reviews + 1,
            positive_reviews: isPositive ? current.positive_reviews + 1 : current.positive_reviews,
            negative_reviews: isNegative ? current.negative_reviews + 1 : current.negative_reviews,
            last_activity_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    await supabase.rpc('record_trust_change', {
        p_user_id: userId,
        p_change_type: 'review_received',
        p_reason: `Received ${rating}-star review`,
        p_entity_type: 'review',
        p_entity_id: reviewId
    });
};

/**
 * Mark email as verified
 */
export const verifyEmail = async (userId: string): Promise<void> => {
    await supabase
        .from('trust_scores')
        .update({ email_verified: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

    await supabase.rpc('update_verification_level', { p_user_id: userId });
};

/**
 * Mark phone as verified
 */
export const verifyPhone = async (userId: string): Promise<void> => {
    await supabase
        .from('trust_scores')
        .update({ phone_verified: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

    await supabase.rpc('update_verification_level', { p_user_id: userId });
};

/**
 * Request ID verification
 */
export const requestIdVerification = async (
    userId: string,
    documentType: 'national_id' | 'passport' | 'drivers_license',
    documentUrl: string
): Promise<{ success: boolean; requestId?: string; error?: string }> => {
    const { data, error } = await supabase
        .from('verification_requests')
        .insert({
            user_id: userId,
            verification_type: documentType,
            document_url: documentUrl,
            status: 'pending'
        })
        .select('id')
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, requestId: data.id };
};

/**
 * Get pending verification requests for a user
 */
export const getPendingVerifications = async (userId: string): Promise<VerificationRequest[]> => {
    const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'under_review'])
        .order('submitted_at', { ascending: false });

    if (error || !data) return [];
    return data as VerificationRequest[];
};

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Approve ID verification (admin only)
 */
export const approveVerification = async (
    requestId: string,
    adminId: string
): Promise<void> => {
    const { data: request } = await supabase
        .from('verification_requests')
        .select('user_id, verification_type')
        .eq('id', requestId)
        .single();

    if (!request) return;

    // Update request status
    await supabase
        .from('verification_requests')
        .update({
            status: 'approved',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

    // Update trust score flags
    if (request.verification_type === 'national_id' ||
        request.verification_type === 'passport' ||
        request.verification_type === 'drivers_license') {
        await supabase
            .from('trust_scores')
            .update({
                national_id_verified: true,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', request.user_id);
    }

    // Update verification level
    await supabase.rpc('update_verification_level', { p_user_id: request.user_id });

    // Award badge
    await supabase
        .from('trust_badges')
        .insert({
            user_id: request.user_id,
            badge_type: 'id_verified',
            badge_name: 'ID Verified',
            badge_description: 'This user has verified their identity',
            badge_icon: 'shield-check'
        });
};

/**
 * Reject verification request
 */
export const rejectVerification = async (
    requestId: string,
    adminId: string,
    reason: string
): Promise<void> => {
    await supabase
        .from('verification_requests')
        .update({
            status: 'rejected',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: reason
        })
        .eq('id', requestId);
};

/**
 * Flag a user
 */
export const flagUser = async (
    userId: string,
    reason: string
): Promise<void> => {
    await supabase
        .from('trust_scores')
        .update({
            is_flagged: true,
            flag_reason: reason,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    await supabase.rpc('record_trust_change', {
        p_user_id: userId,
        p_change_type: 'penalty',
        p_reason: `User flagged: ${reason}`
    });
};

/**
 * Suspend a user
 */
export const suspendUser = async (
    userId: string,
    reason: string
): Promise<void> => {
    await supabase
        .from('trust_scores')
        .update({
            is_suspended: true,
            suspension_reason: reason,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
};

// ============================================
// LEADERBOARD
// ============================================

/**
 * Get top trusted users
 */
export const getTopTrustedUsers = async (
    limit = 10
): Promise<{ user_id: string; score: number; level: VerificationLevel }[]> => {
    const { data, error } = await supabase
        .from('trust_scores')
        .select('user_id, score, verification_level')
        .eq('is_suspended', false)
        .order('score', { ascending: false })
        .limit(limit);

    if (error || !data) return [];
    return data as { user_id: string; score: number; level: VerificationLevel }[];
};

// ============================================
// EXPORTS
// ============================================

export default {
    getTrustScore,
    getTrustDisplayInfo,
    getTrustBadges,
    getTrustHistory,
    updateProfileCompleteness,
    recordTransaction,
    recordReview,
    verifyEmail,
    verifyPhone,
    requestIdVerification,
    getPendingVerifications,
    approveVerification,
    rejectVerification,
    flagUser,
    suspendUser,
    getTopTrustedUsers,
    getScoreLabel,
    getScoreColor,
    getScoreBgColor,
    TRUST_LEVELS
};
