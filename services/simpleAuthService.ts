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

      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
        }),
      });

      console.log('🔐 [simpleAuthService] signup response status:', response.status);

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMsg = result.error || `Signup failed with status ${response.status}`;
        console.error('🔴 [simpleAuthService] Backend error:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!result.token || !result.user?.id) {
        throw new Error('Signup did not return an account.');
      }

      const userData = result.user;
      const user: SimpleUser = {
        id: userData.id,
        email: userData.email || email,
        name: userData.full_name || name || email.split('@')[0],
        role: userData.role || 'user',
      };

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authToken', result.token);

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
      localStorage.setItem('authToken', result.data.token || '');

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
      localStorage.removeItem('authToken');
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
    const token = localStorage.getItem('authToken');
    return !!(user && token);
  }
};
