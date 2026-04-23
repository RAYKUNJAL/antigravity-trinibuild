/**
 * SimpleAuthService - Minimal, working auth without complexity
 * No triggers, no fancy features - just login/signup that works
 */

import { supabase } from './supabaseClient';

export interface SimpleUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const simpleAuthService = {
  /**
   * Sign up new user
   */
  signup: async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: SimpleUser }> => {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'user'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. Store in localStorage immediately (don't wait for profile)
      const user: SimpleUser = {
        id: authData.user.id,
        email: authData.user.email || email,
        name: name || email.split('@')[0],
        role: 'user'
      };

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authToken', authData.session?.access_token || '');

      return { success: true, user };
    } catch (err: any) {
      console.error('Signup error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Login existing user
   */
  login: async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: SimpleUser }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error from Supabase:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Login failed - no user returned');
      }

      // Create user object
      const user: SimpleUser = {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: data.user.user_metadata?.role || 'user'
      };

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authToken', data.session?.access_token || '');

      return { success: true, user };
    } catch (err: any) {
      console.error('Login error:', err);
      return { 
        success: false, 
        error: err.message || 'Login failed. Please check your email and password.'
      };
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      return { success: true };
    } catch (err: any) {
      console.error('Logout error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): SimpleUser | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error('Error getting current user:', err);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    return !!(user && token);
  }
};
