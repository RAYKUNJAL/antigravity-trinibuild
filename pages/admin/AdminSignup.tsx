import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { supabase } from '../../services/supabaseClient';

export const AdminSignup: React.FC = () => {
    const navigate = useNavigate();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        // 1. Validate Secret Key
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
            // 2. Register User
            const { user, error } = await authService.register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName
            });

            if (error || !user) {
                throw new Error(error || 'Registration failed');
            }

            // 3. Update Role in Supabase
            // Note: authService.register creates the profile, but with default 'user' role.
            // We need to upgrade it immediately.
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: role })
                .eq('id', user.id);

            if (updateError) {
                console.error('Role update failed:', updateError);
                // Fallback: User is created but not admin. 
                // In a real app, we might want to delete the user or retry.
                throw new Error('Account created but role assignment failed. Please contact support.');
            }

            setStatus('success');

            // 4. Redirect after short delay
            setTimeout(() => {
                navigate('/admin/command-center');
            }, 2000);

        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gray-900 p-6 text-center border-b border-gray-700">
                    <div className="w-16 h-16 bg-trini-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="h-8 w-8 text-trini-red" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Access</h1>
                    <p className="text-gray-400 text-sm mt-1">Authorized Personnel Only</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    {status === 'success' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Access Granted</h2>
                            <p className="text-gray-400">Redirecting to Command Center...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {status === 'error' && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400">{errorMessage}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            type="text"
                                            name="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-trini-red"
                                            placeholder="John"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            type="text"
                                            name="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-trini-red"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-trini-red"
                                        placeholder="admin@trinibuild.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-trini-red"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-trini-red mb-1">Secret Key</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-trini-red" />
                                    <input
                                        type="password"
                                        name="secretKey"
                                        required
                                        value={formData.secretKey}
                                        onChange={handleChange}
                                        className="w-full bg-gray-900 border border-trini-red/50 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-trini-red focus:ring-1 focus:ring-trini-red"
                                        placeholder="Enter access key"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-trini-red text-white py-2.5 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                            >
                                {status === 'loading' ? 'Verifying...' : 'Grant Access'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="bg-gray-900 p-4 text-center border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                        Unauthorized access attempts are logged and monitored.
                    </p>
                </div>
            </div>
        </div>
    );
};
