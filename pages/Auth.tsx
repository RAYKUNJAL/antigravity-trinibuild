import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Phone, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);

  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');

  // Status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- Actions ---

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'spotify') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}${searchParams.get('redirect') || '/dashboard'}`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // LOGIN
        const { error, data } = await authService.login({ email, password });
        if (error) throw new Error(error);
        if (data.user) {
          navigate(searchParams.get('redirect') || '/dashboard');
        }
      } else {
        // SIGN UP
        const names = fullName.split(' ');
        const res = await authService.register({
          email,
          password,
          firstName: names[0] || 'User',
          lastName: names.slice(1).join(' ') || ''
        });

        if (res.error) throw new Error(res.error);

        setSuccessMsg("Success! Please check your email to confirm your account.");
        setIsLogin(true); // Switch to login view
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mock Phone Auth for now (Supabase Phone Auth requires extra setup)
    setTimeout(() => {
      setError("WhatsApp/Phone login needs Twilio configuration. Please use Email or Google for now.");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* LEFT: Brand Section (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 text-white relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold text-xl">TB</div>
            <span className="text-2xl font-bold tracking-tight">TriniBuild</span>
          </div>

          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Build your Trini empire <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              in minutes.
            </span>
          </h1>

          <ul className="space-y-4 text-lg text-gray-300">
            <li className="flex items-center gap-3">
              <CheckCircle className="text-green-500 w-6 h-6" />
              <span>AI-Powered Store Building</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="text-green-500 w-6 h-6" />
              <span>Local Payments (Linx/Credit Card)</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="text-green-500 w-6 h-6" />
              <span>Instant Delivery Network</span>
            </li>
          </ul>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute right-0 top-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black"></div>
          <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          © 2025 TriniBuild Ltd. Port of Spain.
        </div>
      </div>

      {/* RIGHT: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-8">

          {/* Header (Mobile Logo) */}
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white text-2xl">TB</div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-2 text-gray-600">
              {isLogin ? "Enter your details to access your dashboard." : "Get started with your free store today."}
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              <p className="text-sm text-green-700">{successMsg}</p>
            </div>
          )}

          {/* Social Login Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white text-gray-700 font-medium text-sm"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-2" alt="Google" />
              Google
            </button>
            <button
              onClick={() => handleSocialLogin('facebook')}
              className="flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white text-gray-700 font-medium text-sm"
            >
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5 mr-2" alt="Facebook" />
              Facebook
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
          </div>

          {/* Auth Method Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setAuthMethod('email')}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${authMethod === 'email' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Email Address
            </button>
            <button
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${authMethod === 'phone' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4" /> WhatsApp / Phone
              </span>
            </button>
          </div>

          {/* Email Form */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-4 pt-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow outline-none"
                      placeholder="Eg. Ray Kunjal"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow outline-none"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                {isLogin && (
                  <div className="text-right mt-1">
                    <a href="#" className="text-xs text-red-600 hover:underline">Forgot password?</a>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Free Account'} <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Phone/WhatsApp Form */}
          {authMethod === 'phone' && (
            <form onSubmit={handlePhoneAuth} className="space-y-4 pt-4">
              <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start mb-4">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  We'll send a one-time code to your WhatsApp or SMS. Standard rates may apply.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 overflow-hidden">
                  <div className="bg-gray-100 px-3 py-3 border-r border-gray-300 text-gray-600 font-medium">
                    +1 (868)
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 outline-none"
                    placeholder="XXX-XXXX"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-5 h-5 brightness-0 invert" />
                    Continue with WhatsApp
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle Login/Signup */}
          <div className="text-center pt-2">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isLogin ? "New here? " : "Already have an account? "}
              <span className="font-bold text-red-600 hover:underline">
                {isLogin ? "Create an account" : "Sign in"}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};