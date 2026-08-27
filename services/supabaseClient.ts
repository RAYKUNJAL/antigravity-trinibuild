/**
 * Supabase client — fail closed on a dead host.
 * https://api.juvay.app is NXDOMAIN. Do not call it.
 * Signup is same-origin POST /api/signup (see selfHostedApi / SignupPageSimple).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const DEAD = /api\.juvay\.app/i.test(rawUrl) || !rawUrl || !rawKey;

function deadBuilder(): any {
  const err = { message: 'This catalog is not on this origin' };
  const empty = Promise.resolve({ data: [], error: err, count: 0 });
  const none = Promise.resolve({ data: null, error: err });
  const q: any = {
    select: () => q,
    insert: () => none,
    update: () => q,
    upsert: () => none,
    delete: () => none,
    eq: () => q,
    neq: () => q,
    or: () => q,
    in: () => q,
    is: () => q,
    ilike: () => q,
    like: () => q,
    gte: () => q,
    lte: () => q,
    order: () => q,
    limit: () => q,
    range: () => q,
    single: () => none,
    maybeSingle: () => none,
    then: (ok: any, bad: any) => empty.then(ok, bad),
  };
  return q;
}

function makeDeadClient(): SupabaseClient {
  const dead: any = {
    from: () => deadBuilder(),
    rpc: () => Promise.resolve({ data: null, error: { message: 'RPC not on this origin' } }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Storage not on this origin' } }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
      }),
    },
    auth: {
      signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Use POST /api/signup' } }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Use POST /api/login' } }),
      signInWithOAuth: async () => ({ data: { url: null }, error: { message: 'Social login is not on this origin' } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  };
  return dead as SupabaseClient;
}

export const supabase: SupabaseClient = DEAD
  ? makeDeadClient()
  : createClient(rawUrl, rawKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });

export const isSupabaseConfigured = () => !DEAD;

export const testConnection = async () => {
  if (DEAD) return { success: false, error: 'No live catalog host on this origin' };
  return { success: true, message: 'Connected' };
};

export const checkTable = async (tableName: string) => {
  try {
    const { error } = await supabase.from(tableName).select('*').limit(1);
    if (error) return { exists: false, accessible: false, error: error.message };
    return { exists: true, accessible: true, hasData: false };
  } catch (err: any) {
    return { exists: false, accessible: false, error: err.message };
  }
};

export const getDatabaseHealth = async () => ({
  status: DEAD ? ('unhealthy' as const) : ('healthy' as const),
  message: DEAD ? 'Catalog host is not on this origin' : 'OK',
  details: null,
});
