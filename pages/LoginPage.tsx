import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTestHelp, setShowTestHelp] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.login({ email, password });

      if (result.error) {
        // Handle specific error cases
        let errorMessage = result.error;
        
        // If it's a schema error, it might be an email confirmation issue
        if (errorMessage.includes('schema') || errorMessage.includes('Database error')) {
          errorMessage = 'Email verification pending. Check your inbox for the confirmation link. If you don\'t see it, check spam folder.';
          setShowTestHelp(true);
        } else if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Email or password is incorrect. Please try again.';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email first. Check your inbox for confirmation link.';
          setShowTestHelp(true);
        }
        
        setError(errorMessage);
        setLoading(false);
      } else if (result.user) {
        // Success - store user in localStorage for faster loading
        try {
          localStorage.setItem('user', JSON.stringify(result.user));
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
        
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header with Back Button */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#E61E2B] font-semibold transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Home
        </motion.button>
      </div>

      {/* Main Login Container */}
      <div className="max-w-md mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-4xl md:text-5xl font-black text-gray-900 mb-3"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Welcome Back
            </h1>
            <p className="text-lg text-gray-600">
              Sign in to continue to TriniBuild
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              <p className="font-semibold text-sm">{error}</p>
              {showTestHelp && (
                <p className="text-xs mt-2 text-red-600">
                  💡 Tip: Check your email (including spam folder) for a verification link. Click it to confirm your email, then try logging in again.
                </p>
              )}
            </motion.div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email"
                className="block text-sm font-bold text-gray-700 mb-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E61E2B] focus:outline-none transition-colors text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label 
                  htmlFor="password"
                  className="block text-sm font-bold text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Password
                </label>
                <Link 
                  to="/forgot-password"
                  className="text-sm font-semibold text-[#E61E2B] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E61E2B] focus:outline-none transition-colors text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Sign In Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white font-black text-lg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/signup"
                className="text-[#E61E2B] font-bold hover:underline"
              >
                Create one for free
              </Link>
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 mb-4 font-semibold">
              Trusted by Trinidad businesses
            </p>
            <div className="flex items-center justify-center gap-6 text-gray-400">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold">Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold">Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold">Privacy</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
