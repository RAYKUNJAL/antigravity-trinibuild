import { RateLimiter } from './rateLimiter';

/**
 * SimpleAuthService - Minimal, working auth without complexity
 * Uses backend Express.js API for authentication instead of Supabase
 */

export interface SimpleUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const API_BASE_URL = '/api';

export const simpleAuthService = {
  /**
   * Sign up new user via backend API
   */
  signup: async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: SimpleUser }> => {
    try {
      console.log('🔐 [simpleAuthService] signup START:', { email, name });

      // Call backend registration endpoint
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName: name.split(' ')[0] || name,
          lastName: name.split(' ').slice(1).join(' ') || '',
          phone: ''
        })
      });

      console.log('🔐 [simpleAuthService] signup response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || `Signup failed with status ${response.status}`;
        console.error('🔴 [simpleAuthService] Backend error:', errorMsg);
        throw new Error(errorMsg);
      }

      const result = await response.json();

      if (!result.data || !result.data.user) {
        throw new Error('No user returned from signup');
      }

      const userData = result.data.user;

      // Create user object
      const user: SimpleUser = {
        id: userData.id,
        email: userData.email || email,
        name: name || email.split('@')[0],
        role: userData.role || 'user'
      };

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('authToken', result.data.token || '');

      console.log('✅ [simpleAuthService] signup SUCCESS');
      return { success: true, user };
    } catch (err: any) {
      const errorMsg = err?.message || String(err) || 'Unknown signup error';
      console.error('❌ [simpleAuthService] signup FAILED:', errorMsg, err);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Login existing user via backend API
   */
  login: async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: SimpleUser }> => {
    try {
      console.log('🔐 [simpleAuthService] login START:', { email });

      const limit = RateLimiter.checkLoginLimit(email);
      if (!limit.allowed) {
        return {
          success: false,
          error: `Too many login attempts. Try again in ${RateLimiter.formatResetTime(limit.resetAt)}.`
        };
      }

      RateLimiter.recordLoginAttempt(email);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || 'Login failed';
        console.error('Login error from backend:', errorMsg);
        throw new Error(errorMsg);
      }

      const result = await response.json();

      if (!result.data || !result.data.user) {
        throw new Error('Login failed - no user returned');
      }

      const userData = result.data.user;

      // Create user object
      const user: SimpleUser = {
        id: userData.id,
        email: userData.email || email,
        name: userData.firstName || email.split('@')[0],
        role: userData.role || 'user'
      };

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('authToken', result.data.token || '');
      RateLimiter.clearLoginAttempts(email);

      console.log('✅ [simpleAuthService] login SUCCESS');
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
      localStorage.removeItem('user');
      sessionStorage.removeItem('authToken');
      console.log('✅ [simpleAuthService] logout SUCCESS');
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
    const token = sessionStorage.getItem('authToken');
    return !!(user && token);
  }
};
