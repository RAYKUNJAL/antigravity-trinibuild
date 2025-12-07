import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { supabase } from '../../services/supabaseClient';

export const AdminSignup: React.FC = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        secretKey: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const { user, error } = await authService.login({
                email: formData.email,
                password: formData.password
            });

            if (error || !user) throw new Error(error || 'Login failed');

            // Check if user has admin role
            if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'store_admin') {
                throw new Error('Unauthorized: You do not have admin access.');
            }

            setStatus('success');
            setTimeout(() => navigate('/admin/command-center'), 1000);
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        // Validate Secret Key
        let role = 'user';
        if (formData.secretKey === 'TRINIBUILD_MASTER_KEY_2025') {
            role = 'admin';
        } else if (formData.secretKey === 'STORE_ADMIN_KEY_2025') {
            role = 'store_admin';
        } else {
            setStatus('error');
            setErrorMessage('Invalid Secret Key. Access Denied.');
            return;
        }

        try {
            const { user, error } = await authService.register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName
            });

            if (error || !user) throw new Error(error || 'Registration failed');

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: role })
                .eq('id', user.id);

            if (updateError) throw new Error('Account created but role assignment failed.');

            setStatus('success');
            setTimeout(() => navigate('/admin/command-center'), 2000);
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Left Column - Visuals */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-trini-red/20 to-gray-900/50 z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-20" />

                <div className="relative z-20 flex flex-col justify-center px-16 text-white">
                    <div className="w-20 h-20 bg-trini-red rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-trini-red/20">
                        <Shield className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Command <br /> Center <span className="text-trini-red">v2.0</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-md">
                        Manage your marketplace, monitor real-time traffic, and control system operations from one central hub.
                    </p>

                    <div className="mt-12 flex gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>Real-time Analytics</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>User Management</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-900">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10 lg:hidden">
                        <Shield className="h-12 w-12 text-trini-red mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-white">Admin Access</h1>
                    </div>

                    {/* Toggle */}
                    <div className="bg-gray-800 p-1 rounded-xl flex mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            New Admin
                        </button>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center py-12 bg-gray-800 rounded-2xl border border-gray-700">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-gray-400">Redirecting to dashboard...</p>
                        </div>
                    ) : (
                        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">
                            {status === 'error' && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400">{errorMessage}</p>
                                </div>
                            )}

                            {!isLogin && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">First Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                            <input
                                                type="text"
                                                name="firstName"
                                                required
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-trini-red focus:ring-1 focus:ring-trini-red transition-all"
                                                placeholder="John"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Last Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                            <input
                                                type="text"
                                                name="lastName"
                                                required
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-trini-red focus:ring-1 focus:ring-trini-red transition-all"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-trini-red focus:ring-1 focus:ring-trini-red transition-all"
                                        placeholder="admin@trinibuild.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-trini-red focus:ring-1 focus:ring-trini-red transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {!isLogin && (
                                <div>
                                    <label className="block text-xs font-medium text-trini-red mb-1.5">Secret Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-trini-red" />
                                        <input
                                            type="password"
                                            name="secretKey"
                                            required
                                            value={formData.secretKey}
                                            onChange={handleChange}
                                            className="w-full bg-gray-800 border border-trini-red/50 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-trini-red focus:ring-1 focus:ring-trini-red transition-all"
                                            placeholder="Enter access key"
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-trini-red text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-trini-red/25"
                            >
                                {status === 'loading' ? 'Processing...' : (isLogin ? 'Login to Dashboard' : 'Grant Admin Access')}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-600">
                            Protected by TriniBuild SiteGuardian™
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
