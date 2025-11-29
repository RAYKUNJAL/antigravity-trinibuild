
import { supabase } from './supabaseClient';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar_url?: string;
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

            if (error) throw error;

            if (data.user) {
                // Fetch additional profile data if needed
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                const fullName = profile?.full_name || data.user.user_metadata.full_name || '';
                const [firstName, ...lastNameParts] = fullName.split(' ');

                const user: User = {
                    id: data.user.id,
                    email: data.user.email!,
                    firstName: firstName || '',
                    lastName: lastNameParts.join(' ') || '',
                    role: profile?.role || 'user',
                    avatar_url: profile?.avatar_url
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
        window.location.href = '/auth';
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
                avatar_url: profile?.avatar_url
            };
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        }
        return null;
    },

    // Check if user is authenticated
    isAuthenticated: async (): Promise<boolean> => {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    }
};
