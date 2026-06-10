/**
 * selfHostedApi.ts — Replaces supabaseClient.ts
 * Talks to your self-hosted API on Hetzner instead of Supabase.
 * JWT stored in localStorage, auto-attached to every request.
 */

const API_BASE = '/api';

// ─── Token management ────────────────────────────────────────
const TOKEN_KEY = 'tb_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ─── Core fetch wrapper ──────────────────────────────────────
async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ─── AUTH (replaces supabase.auth) ───────────────────────────
export const authApi = {
  async signUp(email: string, password: string, full_name?: string, phone?: string, ref?: string) {
    const data = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, full_name, phone, ref }) });
    setToken(data.token);
    return data.user;
  },
  async signIn(email: string, password: string) {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token);
    return data.user;
  },
  async getUser() {
    if (!getToken()) return null;
    try {
      const data = await request('/auth/me');
      return data.user;
    } catch {
      clearToken();
      return null;
    }
  },
  signOut() {
    clearToken();
    window.location.href = '/';
  },
};

// ─── STORES ──────────────────────────────────────────────────
export const storesApi = {
  getMine: () => request('/stores/mine'),
  create: (store: { name: string; description?: string; category?: string; phone?: string; whatsapp?: string; address?: string }) =>
    request('/stores', { method: 'POST', body: JSON.stringify(store) }),
  getBySlug: (slug: string) => request(`/stores/${slug}`),
};

// ─── PRODUCTS ────────────────────────────────────────────────
export const productsApi = {
  create: (product: Record<string, unknown>) => request('/products', { method: 'POST', body: JSON.stringify(product) }),
};

// ─── SYSTEM 1: COD ───────────────────────────────────────────
export const codApi = {
  createOrder: (order: Record<string, unknown>) => request('/cod/orders', { method: 'POST', body: JSON.stringify(order) }),
  getMyOrders: () => request('/cod/orders'),
  updateStatus: (id: string, status: string, extras?: Record<string, string>) =>
    request(`/cod/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...extras }) }),
  track: (ref: string) => request(`/cod/track/${ref}`),
};

// ─── SYSTEM 2: AFFILIATE ─────────────────────────────────────
export const affiliateApi = {
  getProfile: () => request('/affiliate/profile'),
  getReferrals: () => request('/affiliate/referrals'),
  requestPayout: (amount_ttd: number, method: string, bank_details?: Record<string, string>) =>
    request('/affiliate/payout', { method: 'POST', body: JSON.stringify({ amount_ttd, method, bank_details }) }),
  getLeaderboard: () => request('/affiliate/leaderboard'),
};

// ─── SYSTEM 3: DOCUMENTS ─────────────────────────────────────
export const documentsApi = {
  generate: (document_type: string, fields: Record<string, unknown>, system_prompt: string, is_free: boolean, price_ttd: number) =>
    request('/documents/generate', { method: 'POST', body: JSON.stringify({ document_type, fields, system_prompt, is_free, price_ttd }) }),
  getMine: () => request('/documents/mine'),
};

// ─── SYSTEM 4: SUBSCRIPTIONS ─────────────────────────────────
export const subscriptionApi = {
  getPlans: () => request('/plans'),
  getMine: () => request('/subscription'),
  createBankPayment: (plan_slug: string, months: number, bank_name: string, branch: string, account_number: string) =>
    request('/subscription/bank-pay', { method: 'POST', body: JSON.stringify({ plan_slug, months, bank_name, branch, account_number }) }),
  async uploadProof(reference_code: string, file: File) {
    const form = new FormData();
    form.append('proof', file);
    form.append('reference_code', reference_code);
    const res = await fetch(`${API_BASE}/subscription/bank-pay/proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};

export default { authApi, storesApi, productsApi, codApi, affiliateApi, documentsApi, subscriptionApi };
