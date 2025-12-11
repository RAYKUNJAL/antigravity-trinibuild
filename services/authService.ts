
import { supabase } from './supabaseClient';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar_url?: string;
    subscription_tier?: string;
}

export interface AuthResponse {
    user: User | null;
    token: string | null;
    error?: string;
}

export const authService = {
    // Register a new user
    register: async (userData: any): Promise<AuthResponse> => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        full_name: `${userData.firstName} ${userData.lastName}`,
                        role: 'user', // Default role
                    },
                },
            });

            if (error) throw error;

            if (data.user) {
                const user: User = {
                    id: data.user.id,
                    email: data.user.email!,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: 'user',
                    subscription_tier: 'Community Plan'
                };

                // Supabase handles session persistence automatically, 
                // but we keep this for compatibility with existing code if needed
                localStorage.setItem('user', JSON.stringify(user));

                return { user, token: data.session?.access_token || '' };
            }
            return { user: null, token: null, error: 'Registration failed' };

        } catch (error: any) {
            console.error("Registration Error:", error);
            return { user: null, token: null, error: error.message };
        }
    },

    // Login an existing user
    login: async (credentials: any): Promise<AuthResponse> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (error) {
                // Handle email confirmation error specifically
                if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
                    throw new Error('Please verify your email address before signing in. Check your inbox for the confirmation link.');
                }
                throw error;
            }

            if (data.user) {
                // Try to fetch profile data, but don't fail if it doesn't exist
                let profile = null;
                try {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();
                    profile = profileData;
                } catch (e) {
                    console.warn('Could not fetch profile (non-critical):', e);
                }

                const fullName = profile?.full_name || data.user.user_metadata.full_name || '';
                const [firstName, ...lastNameParts] = fullName.split(' ');

                // Priority: user metadata > localStorage > profile table > default
                const storedUser = localStorage.getItem('user');
                const storedRole = storedUser ? JSON.parse(storedUser).role : null;

                const user: User = {
                    id: data.user.id,
                    email: data.user.email!,
                    firstName: firstName || '',
                    lastName: lastNameParts.join(' ') || '',
                    role: data.user.user_metadata.role || storedRole || profile?.role || 'user',
                    avatar_url: profile?.avatar_url,
                    subscription_tier: profile?.subscription_tier || 'Community Plan'
                };

                localStorage.setItem('user', JSON.stringify(user));
                return { user, token: data.session?.access_token || '' };
            }
            return { user: null, token: null, error: 'Login failed' };

        } catch (error: any) {
            console.error("Login Error:", error);
            return { user: null, token: null, error: error.message };
        }
    },

    // Logout the user
    logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // Clear legacy token if any
        window.location.href = '/#/auth';
    },

    // Get current user from local storage (or Supabase session)
    getCurrentUser: async (): Promise<User | null> => {
        // First check memory/local storage for speed
        const localUser = localStorage.getItem('user');
        if (localUser) return JSON.parse(localUser);

        // Fallback to checking active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            const fullName = profile?.full_name || session.user.user_metadata.full_name || '';
            const [firstName, ...lastNameParts] = fullName.split(' ');

            const user: User = {
                id: session.user.id,
                email: session.user.email!,
                firstName: firstName || '',
                lastName: lastNameParts.join(' ') || '',
                role: profile?.role || 'user',
                avatar_url: profile?.avatar_url,
                subscription_tier: profile?.subscription_tier || 'Community Plan'
            };
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        }
        return null;
    },

    // Resend confirmation email
    resendConfirmation: async (email: string): Promise<{ error?: string; success?: boolean }> => {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error("Resend Confirmation Error:", error);
            return { error: error.message, success: false };
        }
    },

    // Update Subscription Tier
    updateSubscription: async (planName: string): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // Map display names to plan IDs
        const planMap: Record<string, string> = {
            'The Hustle': 'hustle',
            'The Storefront': 'storefront',
            'The Growth': 'growth',
            'The Empire': 'empire',
            'Community Plan': 'hustle', // Legacy fallback
            'Growth': 'growth', // Legacy fallback
            'Empire': 'empire' // Legacy fallback
        };

        const planId = planMap[planName] || 'hustle';

        try {
            // 1. Get the user's store
            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (storeError || !store) {
                console.error("Store not found for user:", storeError);
                return false;
            }

            // 2. Update the subscription
            const { error: subError } = await supabase
                .from('store_subscriptions')
                .upsert({
                    store_id: store.id,
                    plan_id: planId,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'store_id' });

            if (subError) {
                console.error("Failed to update subscription:", subError);
                return false;
            }

            // 3. Update local user state for immediate UI feedback
            const localUser = localStorage.getItem('user');
            if (localUser) {
                const parsed = JSON.parse(localUser);
                parsed.subscription_tier = planName;
                localStorage.setItem('user', JSON.stringify(parsed));
            }

            return true;

        } catch (error) {
            console.error("Error in updateSubscription:", error);
            return false;
        }
    },

    // Check if user is authenticated
    isAuthenticated: async (): Promise<boolean> => {
        // First check localStorage for bypass/emergency admin access
        const localUser = localStorage.getItem('user');
        if (localUser) {
            try {
                const user = JSON.parse(localUser);
                // If we have a valid user object in localStorage, consider them authenticated
                if (user && user.id && user.email) {
                    return true;
                }
            } catch (e) {
                console.warn('Invalid user data in localStorage:', e);
            }
        }

        // Fallback to Supabase session check
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    }
};
