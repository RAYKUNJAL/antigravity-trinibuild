import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { enforceRateLimit, RATE_LIMITS } from '../_utils/rateLimit';

function buildSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase auth environment is not configured.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getProfileName(userMetadata: Record<string, any> | null | undefined) {
  return userMetadata?.full_name || userMetadata?.name || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceRateLimit(req, res, { ...RATE_LIMITS.login, keyPrefix: 'auth-login' })) {
    return;
  }

  const { email, password } = req.body || {};

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const supabase = buildSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message = error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')
        ? 'Please verify your email address before signing in. Check your inbox for the confirmation link.'
        : 'Email or password is incorrect. Please try again.';

      return res.status(401).json({ error: message });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ error: 'Login failed.' });
    }

    const fullName = getProfileName(data.user.user_metadata);
    const [firstName, ...lastNameParts] = fullName.split(' ').filter(Boolean);

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: firstName || '',
        lastName: lastNameParts.join(' '),
        role: data.user.user_metadata?.role || 'user',
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Login service unavailable.',
      message: error.message,
    });
  }
}
