import { supabase } from './supabaseClient';

export interface OnboardingSession {
    id: string;
    user_id?: string;
    session_id: string;
    entry_point: 'direct' | 'referral' | 'whatsapp' | 'facebook' | 'instagram';
    referrer_code?: string;
    current_step: number;
    total_steps: number;
    completed: boolean;
    completion_time_seconds?: number;
    started_at: string;
}

export interface OnboardingStepData {
    phone?: string;
    otp?: string;
    roles?: string[];
    firstName?: string;
    businessName?: string;
    profilePic?: string;
    websiteGenerated?: boolean;
    legalAccepted?: boolean;
    firstShareAttempted?: boolean;
}

export const ONBOARDING_STEPS = {
    PHONE_VERIFICATION: { number: 1, name: 'phone_verification', title: 'Verify Phone' },
    OTP_ENTRY: { number: 2, name: 'otp_entry', title: 'Enter Code' },
    ROLE_SELECTION: { number: 3, name: 'role_selection', title: 'What You Do' },
    QUICK_PROFILE: { number: 4, name: 'quick_profile', title: 'Your Info' },
    WEBSITE_GENERATION: { number: 5, name: 'website_generation', title: 'Build Site' },
    LEGAL_CONSENT: { number: 6, name: 'legal_consent', title: 'Terms' },
    REFERRAL_NUDGE: { number: 7, name: 'referral_nudge', title: 'Share & Earn' }
};

export const ROLE_OPTIONS = [
    { id: 'seller', label: 'I want to sell/buy', icon: '🛍️' },
    { id: 'driver', label: "I'm a driver/delivery", icon: '🚗' },
    { id: 'farmer', label: "I'm a farmer", icon: '🌾' },
    { id: 'job_seeker', label: 'I need a job / hire', icon: '💼' },
    { id: 'browser', label: 'Just browsing', icon: '👀' }
];

export const onboardingService = {
    // Session Management
    async createSession(entryPoint: OnboardingSession['entry_point'], referrerCode?: string): Promise<OnboardingSession> {
        const sessionId = this.generateSessionId();

        const { data, error } = await supabase
            .from('onboarding_sessions')
            .insert({
                session_id: sessionId,
                entry_point: entryPoint,
                referrer_code: referrerCode,
                current_step: 1,
                total_steps: 7,
                device_type: this.getDeviceType(),
                user_agent: navigator.userAgent,
                country_code: 'TT' // Trinidad default
            })
            .select()
            .single();

        if (error) throw error;

        // Store in localStorage
        localStorage.setItem('onboarding_session_id', sessionId);

        return data as OnboardingSession;
    },

    async getSession(sessionId: string): Promise<OnboardingSession | null> {
        const { data, error } = await supabase
            .from('onboarding_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as OnboardingSession | null;
    },

    async updateStep(sessionId: string, stepNumber: number): Promise<void> {
        await supabase
            .from('onboarding_sessions')
            .update({ current_step: stepNumber })
            .eq('session_id', sessionId);
    },

    async trackStepEvent(
        sessionId: string,
        stepNumber: number,
        stepName: string,
        eventType: 'started' | 'completed' | 'skipped' | 'error',
        timeSpent?: number,
        metadata?: Record<string, any>
    ): Promise<void> {
        await supabase
            .from('onboarding_step_events')
            .insert({
                session_id: sessionId,
                step_number: stepNumber,
                step_name: stepName,
                event_type: eventType,
                time_spent_seconds: timeSpent,
                metadata
            });
    },

    async completeOnboarding(sessionId: string, userId: string): Promise<void> {
        // Update session with user ID
        await supabase
            .from('onboarding_sessions')
            .update({ user_id: userId })
            .eq('session_id', sessionId);

        // Call completion function
        await supabase.rpc('complete_onboarding', { p_session_id: sessionId });

        // Clear localStorage
        localStorage.removeItem('onboarding_session_id');
        localStorage.removeItem('onboarding_data');
    },

    // Phone Verification
    async sendOTP(phone: string): Promise<void> {
        // Call your OTP service (Twilio, WiPay, etc.)
        const { error } = await supabase.functions.invoke('send-otp', {
            body: { phone }
        });

        if (error) throw error;
    },

    async verifyOTP(phone: string, otp: string): Promise<boolean> {
        const { data, error } = await supabase.functions.invoke('verify-otp', {
            body: { phone, otp }
        });

        if (error) throw error;
        return data.verified;
    },

    // Role Management
    async saveUserRoles(userId: string, roles: string[]): Promise<void> {
        // Delete existing roles
        await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId);

        // Insert new roles
        const roleData = roles.map((role, index) => ({
            user_id: userId,
            role,
            primary_role: index === 0
        }));

        await supabase
            .from('user_roles')
            .insert(roleData);
    },

    // Website Generation
    async generateWebsite(
        userId: string,
        businessName: string,
        roles: string[]
    ): Promise<{ subdomain: string; url: string }> {
        // Generate subdomain
        const { data: subdomainData } = await supabase.rpc('generate_subdomain', {
            p_business_name: businessName,
            p_user_id: userId
        });

        const subdomain = subdomainData as string;

        // Call AI to generate website
        const { data: websiteData, error } = await supabase.functions.invoke('generate-website', {
            body: {
                user_id: userId,
                business_name: businessName,
                roles,
                subdomain
            }
        });

        if (error) throw error;

        // Save website
        await supabase
            .from('user_websites')
            .insert({
                user_id: userId,
                subdomain,
                business_name: businessName,
                template_id: websiteData.template_id,
                logo_url: websiteData.logo_url,
                color_scheme: websiteData.color_scheme,
                sections: websiteData.sections
            });

        return {
            subdomain,
            url: `https://${subdomain}.trinibuild.com`
        };
    },

    // Recovery
    async triggerExitIntent(sessionId: string): Promise<void> {
        await supabase
            .from('onboarding_recovery')
            .insert({
                session_id: sessionId,
                recovery_type: 'exit_intent'
            });
    },

    async scheduleSMSReminder(sessionId: string, phone: string): Promise<void> {
        await supabase.functions.invoke('schedule-sms-reminder', {
            body: {
                session_id: sessionId,
                phone,
                delay_hours: 24
            }
        });
    },

    // Helpers
    generateSessionId(): string {
        return 'onb_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    },

    getDeviceType(): string {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    },

    // Data Persistence
    saveStepData(data: Partial<OnboardingStepData>): void {
        const existing = this.getStepData();
        const updated = { ...existing, ...data };
        localStorage.setItem('onboarding_data', JSON.stringify(updated));
    },

    getStepData(): OnboardingStepData {
        const data = localStorage.getItem('onboarding_data');
        return data ? JSON.parse(data) : {};
    },

    clearStepData(): void {
        localStorage.removeItem('onboarding_data');
    },

    // Analytics
    async getCompletionRate(days: number = 7): Promise<number> {
        const { data, error } = await supabase
            .from('onboarding_analytics')
            .select('completion_rate')
            .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (error) return 0;
        return data.completion_rate || 0;
    },

    async getDropOffPoints(): Promise<Record<string, number>> {
        const { data, error } = await supabase
            .from('onboarding_analytics')
            .select('*')
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (error) return {};

        return {
            phone: data.dropped_at_phone || 0,
            otp: data.dropped_at_otp || 0,
            role: data.dropped_at_role || 0,
            profile: data.dropped_at_profile || 0,
            website: data.dropped_at_website || 0,
            legal: data.dropped_at_legal || 0,
            referral: data.dropped_at_referral || 0
        };
    }
};
