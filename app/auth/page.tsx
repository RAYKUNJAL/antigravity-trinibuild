'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import { Mail, Lock, User, MessageSquare, Loader2, Check } from 'lucide-react';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || 'signup';
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      
      // OAuth will redirect automatically
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with ' + provider);
      setLoading(false);
    }
  };

  const handleWhatsAppSignup = () => {
    // WhatsApp signup flow - redirect to WhatsApp with pre-filled message
    const message = encodeURIComponent(
      "Hi! I want to sign up for TriniBuild. Please send me the signup link."
    );
    window.open(`https://wa.me/18683012345?text=${message}`, '_blank');
    setMessage('Check WhatsApp for your signup link!');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });

        if (error) throw error;
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setMessage('This email is already registered. Please sign in instead.');
        } else {
          setMessage('Check your email for the confirmation link!');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black font-inter mb-3 bg-gradient-to-r from-trini-red to-red-700 bg-clip-text text-transparent">
            TriniBuild
          </h1>
          <p className="text-gray-600 font-inter text-lg">
            {mode === 'signup' ? 'Start Your Digital Empire' : 'Welcome Back'}
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100 mb-6">
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-full font-bold font-inter hover:border-trini-red hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => handleSocialLogin('facebook')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-full font-bold font-inter hover:border-trini-red hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Continue with Facebook</span>
            </button>

            <button
              onClick={handleWhatsAppSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold font-inter hover:shadow-xl transition-all disabled:opacity-50"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Sign up with WhatsApp</span>
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-inter">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-bold font-inter mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ray Kunjal"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold font-inter mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold font-inter mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-sm text-red-700 font-inter">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-sm text-green-700 font-inter flex items-center gap-2">
                <Check className="w-4 h-4" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-trini-red to-red-700 text-white px-6 py-4 rounded-full font-black font-inter hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>
        </div>

        {/* Toggle Mode */}
        <div className="text-center">
          <button
            onClick={() => router.push(`/auth?mode=${mode === 'signup' ? 'signin' : 'signup'}`)}
            className="text-gray-600 font-inter hover:text-trini-red transition-colors"
          >
            {mode === 'signup' ? (
              <>Already have an account? <span className="font-bold">Sign In</span></>
            ) : (
              <>Don't have an account? <span className="font-bold">Sign Up</span></>
            )}
          </button>
        </div>

        {/* Trust Signals */}
        <div className="mt-8 text-center text-sm text-gray-500 font-inter">
          <p className="mb-2">🇹🇹 Made for Trinidad & Tobago</p>
          <p>Join 2,847+ entrepreneurs building their empire</p>
        </div>
      </motion.div>
    </div>
  );
}
