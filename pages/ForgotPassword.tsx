import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim()) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://juvay.app/auth/reset',
      });

      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-10 text-center">
        <Link to="/auth" className="inline-block mb-4">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-red-600 text-xl">
              J
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">JUVAY</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="text-red-100 text-sm mt-1">We'll email you a secure link to set a new one.</p>
      </div>

      {/* Form Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {success ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-600 text-sm mb-1">
                We sent a reset link to
              </p>
              <p className="text-gray-900 font-semibold break-all mb-6">{email}</p>
              <p className="text-gray-500 text-xs mb-6">
                Didn't get it? Check your spam folder or try again in a few minutes.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
            >
              <div className="mb-5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Sending link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="mt-6 text-center">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
