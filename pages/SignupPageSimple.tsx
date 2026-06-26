import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export const SignupPageSimple: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('T&T');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard/ai';

  const islandOptions = [
    'T&T 🇹🇹',
    'Jamaica 🇯🇲',
    'Barbados 🇧🇧',
    'Guyana 🇬🇾',
    'Eastern Caribbean 🌴',
    'Other',
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConfirmationMsg('');
    setLoading(true);

    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Starting signup:', { email, name: fullName, island: selectedIsland });
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            island: selectedIsland,
          },
        },
      });

      if (signUpError) {
        console.error('❌ Signup failed:', signUpError.message);
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      console.log('📝 Signup result:', data);

      if (data.user) {
        // Store user in localStorage for compatibility with existing code
        const user = {
          id: data.user.id,
          email: data.user.email || email,
          name: fullName,
          role: 'user',
        };
        localStorage.setItem('user', JSON.stringify(user));

        // If a session was returned (email confirmation disabled), navigate now
        if (data.session) {
          console.log('✅ Signup successful (session active), redirecting to:', redirect);
          navigate(redirect);
          return;
        }

        // No session → email confirmation required. Show confirmation message.
        console.log('✅ Signup successful — email confirmation required');
        setConfirmationMsg(
          'Account created! Check your email for a confirmation link to activate your account. ' +
          'After confirming, you can sign in.'
        );
      } else {
        setError('Signup failed — no user returned. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Signup exception:', err);
      setError(err?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join Juvay and start selling online</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <div className="text-red-600 text-xl">⚠️</div>
              <div>
                <p className="font-semibold text-red-900">{error}</p>
                {error.includes('email') && (
                  <p className="text-sm text-red-700 mt-1">Try a different email address</p>
                )}
              </div>
            </div>
          )}

          {/* Email Confirmation Message */}
          {confirmationMsg && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <div className="text-green-600 text-xl">✅</div>
              <p className="font-semibold text-green-900">{confirmationMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
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
                  placeholder="••••••••"
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
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Island Selector */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-trini-red text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-trini-red hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
