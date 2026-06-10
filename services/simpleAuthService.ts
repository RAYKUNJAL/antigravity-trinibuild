import { isSupabaseConfigured, supabase } from './supabaseClient';

export interface SimpleUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const REQUEST_TIMEOUT_MS = 6000;

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Store',
    lastName: parts.slice(1).join(' ') || 'Owner',
  };
};

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const saveSession = (user: SimpleUser, token: string) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('authToken', token);
};

const createLocalLaunchUser = (email: string, name: string): SimpleUser => ({
  id: makeId(),
  email,
  name: name || email.split('@')[0],
  role: 'merchant',
});

const fetchJsonWithTimeout = async (url: string, init: RequestInit) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    return { response, payload };
  } finally {
    window.clearTimeout(timeout);
  }
};

const normalizeBackendUser = (payload: any, email: string, name: string): { user: SimpleUser; token: string } | null => {
  const rawUser = payload?.data?.user || payload?.user || payload?.data;
  if (!rawUser?.id) return null;

  return {
    user: {
      id: String(rawUser.id),
      email: rawUser.email || email,
      name: rawUser.name || rawUser.firstName || name || email.split('@')[0],
      role: rawUser.role || 'merchant',
    },
    token: payload?.data?.token || payload?.token || payload?.accessToken || `backend-${Date.now()}`,
  };
};

export const simpleAuthService = {
  signup: async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: SimpleUser }> => {
    const { firstName, lastName } = splitName(name);

    if (API_BASE_URL) try {
      const { response, payload } = await fetchJsonWithTimeout(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone: '',
        }),
      });

      if (response.ok) {
        const normalized = normalizeBackendUser(payload, email, name);
        if (normalized) {
          saveSession(normalized.user, normalized.token);
          return { success: true, user: normalized.user };
        }
      }

      console.warn('[simpleAuthService] Backend signup unavailable:', payload?.error || response.status);
    } catch (error) {
      console.warn('[simpleAuthService] Backend signup failed, trying Supabase/local fallback:', error);
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              first_name: firstName,
              last_name: lastName,
              role: 'merchant',
            },
          },
        });

        if (error) throw error;
        if (data.user) {
          const user: SimpleUser = {
            id: data.user.id,
            email: data.user.email || email,
            name: name || email.split('@')[0],
            role: 'merchant',
          };
          saveSession(user, data.session?.access_token || `supabase-${Date.now()}`);
          return { success: true, user };
        }
      } catch (error) {
        console.warn('[simpleAuthService] Supabase signup failed, using launch fallback:', error);
      }
    }

    const localUser = createLocalLaunchUser(email, name);
    saveSession(localUser, `local-launch-${Date.now()}`);
    localStorage.setItem('trinibuild_launch_account', 'true');
    return { success: true, user: localUser };
  },

  login: async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: SimpleUser }> => {
    if (API_BASE_URL) try {
      const { response, payload } = await fetchJsonWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const normalized = normalizeBackendUser(payload, email, email.split('@')[0]);
        if (normalized) {
          saveSession(normalized.user, normalized.token);
          return { success: true, user: normalized.user };
        }
      }
    } catch (error) {
      console.warn('[simpleAuthService] Backend login failed:', error);
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const user: SimpleUser = {
            id: data.user.id,
            email: data.user.email || email,
            name: (data.user.user_metadata?.full_name as string) || email.split('@')[0],
            role: (data.user.user_metadata?.role as string) || 'merchant',
          };
          saveSession(user, data.session?.access_token || `supabase-${Date.now()}`);
          return { success: true, user };
        }
      } catch (error) {
        console.warn('[simpleAuthService] Supabase login failed:', error);
      }
    }

    const current = simpleAuthService.getCurrentUser();
    if (current?.email?.toLowerCase() === email.toLowerCase()) {
      saveSession(current, `local-login-${Date.now()}`);
      return { success: true, user: current };
    }

    return {
      success: false,
      error: 'Login failed. Create an account first or check your email and password.',
    };
  },

  logout: async () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('trinibuild_launch_account');
      return { success: true };
    } catch (err: any) {
      console.error('Logout error:', err);
      return { success: false, error: err.message };
    }
  },

  getCurrentUser: (): SimpleUser | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error('Error getting current user:', err);
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return Boolean(localStorage.getItem('user') && localStorage.getItem('authToken'));
  },
};
