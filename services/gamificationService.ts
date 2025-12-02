import { supabase } from './supabaseClient';

export interface UserBadge {
    id: string;
    user_id: string;
    badge_type: string;
    badge_name: string;
    badge_description?: string;
    badge_icon?: string;
    earned_at: string;
    metadata?: Record<string, any>;
}

export interface UserStreak {
    id: string;
    user_id: string;
    current_streak: number;
    longest_streak: number;
    last_login_date: string;
    total_logins: number;
    updated_at: string;
}

export interface UserOnboarding {
    id: string;
    user_id: string;
    step_current: number;
    step_total: number;
    steps_completed: string[];
    profile_completed: boolean;
    first_listing_created: boolean;
    first_sale_made: boolean;
    website_customized: boolean;
    started_at: string;
    completed_at?: string;
    time_to_complete_seconds?: number;
}

export interface UserRecommendation {
    id: string;
    user_id: string;
    recommendation_type: string;
    title: string;
    description?: string;
    action_url?: string;
    action_label?: string;
    priority: number;
    dismissed: boolean;
    actioned: boolean;
    created_at: string;
    expires_at?: string;
}

export interface SuccessStory {
    id: string;
    vendor_name: string;
    location?: string;
    story_text: string;
    achievement?: string;
    avatar_url?: string;
    featured: boolean;
}

export const gamificationService = {
    // Badges
    async getUserBadges(userId: string) {
        const { data, error } = await supabase
            .from('user_badges')
            .select('*')
            .eq('user_id', userId)
            .order('earned_at', { ascending: false });

        if (error) throw error;
        return data as UserBadge[];
    },

    async awardBadge(userId: string, badgeType: string, badgeName: string, description?: string, metadata?: Record<string, any>) {
        const { data, error } = await supabase
            .from('user_badges')
            .insert({
                user_id: userId,
                badge_type: badgeType,
                badge_name: badgeName,
                badge_description: description,
                metadata
            })
            .select()
            .single();

        if (error) throw error;
        return data as UserBadge;
    },

    // Streaks
    async getUserStreak(userId: string) {
        const { data, error } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as UserStreak | null;
    },

    async updateStreak(userId: string) {
        const today = new Date().toISOString().split('T')[0];
        const streak = await this.getUserStreak(userId);

        if (!streak) {
            // Create new streak
            const { data, error } = await supabase
                .from('user_streaks')
                .insert({
                    user_id: userId,
                    current_streak: 1,
                    longest_streak: 1,
                    last_login_date: today,
                    total_logins: 1
                })
                .select()
                .single();

            if (error) throw error;
            return data as UserStreak;
        }

        const lastLogin = new Date(streak.last_login_date);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

        let newStreak = streak.current_streak;
        if (daysDiff === 0) {
            // Same day, no change
            return streak;
        } else if (daysDiff === 1) {
            // Consecutive day
            newStreak = streak.current_streak + 1;
        } else {
            // Streak broken
            newStreak = 1;
        }

        const { data, error } = await supabase
            .from('user_streaks')
            .update({
                current_streak: newStreak,
                longest_streak: Math.max(newStreak, streak.longest_streak),
                last_login_date: today,
                total_logins: streak.total_logins + 1,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        // Award streak badges
        if (newStreak === 7) {
            await this.awardBadge(userId, 'streak_7', '7-Day Streak', 'Logged in for 7 days straight!', { streak: 7 });
        } else if (newStreak === 30) {
            await this.awardBadge(userId, 'streak_30', '30-Day Streak Master', 'Logged in for 30 days straight!', { streak: 30 });
        }

        return data as UserStreak;
    },

    // Onboarding
    async getUserOnboarding(userId: string) {
        const { data, error } = await supabase
            .from('user_onboarding')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as UserOnboarding | null;
    },

    async initializeOnboarding(userId: string) {
        const { data, error } = await supabase
            .from('user_onboarding')
            .insert({
                user_id: userId,
                step_current: 1,
                step_total: 5,
                steps_completed: []
            })
            .select()
            .single();

        if (error) throw error;
        return data as UserOnboarding;
    },

    async updateOnboardingStep(userId: string, stepId: string, completed: boolean = true) {
        const onboarding = await this.getUserOnboarding(userId);
        if (!onboarding) return null;

        const stepsCompleted = onboarding.steps_completed || [];
        if (completed && !stepsCompleted.includes(stepId)) {
            stepsCompleted.push(stepId);
        }

        const stepCurrent = Math.min(stepsCompleted.length + 1, onboarding.step_total);
        const isComplete = stepsCompleted.length >= onboarding.step_total;

        const updateData: any = {
            steps_completed: stepsCompleted,
            step_current: stepCurrent
        };

        if (isComplete && !onboarding.completed_at) {
            updateData.completed_at = new Date().toISOString();
            const timeToComplete = Math.floor((new Date().getTime() - new Date(onboarding.started_at).getTime()) / 1000);
            updateData.time_to_complete_seconds = timeToComplete;

            // Award completion badge
            await this.awardBadge(userId, 'onboarding_complete', 'Setup Master', 'Completed full onboarding!');
        }

        const { data, error } = await supabase
            .from('user_onboarding')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as UserOnboarding;
    },

    // Recommendations
    async getUserRecommendations(userId: string) {
        const { data, error } = await supabase
            .from('user_recommendations')
            .select('*')
            .eq('user_id', userId)
            .eq('dismissed', false)
            .order('priority', { ascending: false })
            .limit(5);

        if (error) throw error;
        return data as UserRecommendation[];
    },

    async createRecommendation(userId: string, type: string, title: string, description?: string, actionUrl?: string, actionLabel?: string, priority: number = 0) {
        const { data, error } = await supabase
            .from('user_recommendations')
            .insert({
                user_id: userId,
                recommendation_type: type,
                title,
                description,
                action_url: actionUrl,
                action_label: actionLabel,
                priority
            })
            .select()
            .single();

        if (error) throw error;
        return data as UserRecommendation;
    },

    async dismissRecommendation(recommendationId: string) {
        const { error } = await supabase
            .from('user_recommendations')
            .update({ dismissed: true })
            .eq('id', recommendationId);

        if (error) throw error;
    },

    async actionRecommendation(recommendationId: string) {
        const { error } = await supabase
            .from('user_recommendations')
            .update({ actioned: true })
            .eq('id', recommendationId);

        if (error) throw error;
    },

    // Success Stories
    async getSuccessStories(featured: boolean = false) {
        let query = supabase
            .from('success_stories')
            .select('*')
            .eq('approved', true);

        if (featured) {
            query = query.eq('featured', true);
        }

        query = query.order('display_order', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;
        return data as SuccessStory[];
    }
};
