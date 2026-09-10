import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi, setToken } from '../services/selfHostedApi';
import { track } from '../services/eventTracker';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const GoogleMark = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
    <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
    <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
    <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
  </svg>
);

const PASSWORD_MIN = 8;

export const SignupPageSimple: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIsland, setSelectedIsland] = useState('T&T');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('next') || searchParams.get('redirect') || '/get-started';
  const googleDest = searchParams.get('next') || searchParams.get('redirect') || '/onboarding';

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Social login is not configured on this origin.');
      }
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${googleDest}`,
        },
      });
      if (oauthError) throw oauthError;
      if (!data?.url) {
        throw new Error('Social login is not configured on this origin.');
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
      setLoading(false);
    }
  };

  const islandOptions = [
    'T&T 🇹🇹',
    'Jamaica 🇯🇲',
    'Barbados 🇧🇧',
    'Guyana 🇬🇾',
    'Eastern Caribbean 🌴',
    'Other',
  ];

  React.useEffect(() => {
    fetch('/api/', { headers: { Accept: 'application/json' } })
      .then(async (r) => {
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          setError('Signup API is not mounted on this origin yet. GET /api/ must return JSON, not the site shell.');
        }
      })
      .catch(() => {
        setError('Cannot reach POST /api/signup on this origin. The site shell is not the API.');
      });
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters`);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          island: selectedIsland,
          ref: searchParams.get('ref') || undefined,
        }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Signup API is not mounted. GET /api/ must return JSON, not the site shell.');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Signup failed (${res.status})`);
      if (!data.token || !data.user?.id) throw new Error('Signup did not return an account.');
      if (data.token) setToken(data.token);
      const user = data.user || {};
      const sessionUser = {
        id: user.id,
        email: user.email || email,
        name: user.full_name || fullName,
        role: user.role || 'user',
      };
      localStorage.setItem('user', JSON.stringify(sessionUser));
      track('user_signup', 'auth', { method: 'email', island: selectedIsland });
      navigate(redirect);
    } catch (err: any) {
      const msg = err?.message || 'Signup failed. Please try again.';
      setError(msg === 'Failed to fetch' ? 'Cannot reach the Juvay API on this site. Try again in a minute.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join Juvay and start selling online</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-900">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all font-semibold text-gray-700 disabled:opacity-50"
          >
            <GoogleMark />
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum {PASSWORD_MIN} characters</p>
            </div>

            <div>
              <label htmlFor="island" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Island / Region
              </label>
              <select
                id="island"
                value={selectedIsland}
                onChange={(e) => setSelectedIsland(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent bg-white text-gray-900"
              >
                {islandOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-trini-red text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            By signing up you agree to Juvay{' '}
            <a href="/terms" className="text-trini-red font-semibold hover:underline">Terms</a>,{' '}
            <a href="/privacy" className="text-trini-red font-semibold hover:underline">Privacy</a>, and{' '}
            <a href="/refund" className="text-trini-red font-semibold hover:underline">Refund</a>.
          </p>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-trini-red hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
