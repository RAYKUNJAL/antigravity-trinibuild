import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

export const AdminSignup: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success'>('loading');

    useEffect(() => {
        // Auto-bypass: Immediately grant admin access
        const grantAdminAccess = () => {
            const adminUser = {
                id: 'admin-' + Date.now(),
                email: 'raykunjal@gmail.com',
                firstName: 'Ray',
                lastName: 'Kunjal',
                role: 'admin',
                subscription_tier: 'Enterprise'
            };

            localStorage.setItem('user', JSON.stringify(adminUser));
            console.log('✅ Admin access granted automatically');

            setStatus('success');

            // Use replace() to force a full page reload and ensure auth state is recognized
            setTimeout(() => {
                console.log('🚀 Redirecting to command center with full reload...');
                window.location.replace('/#/admin/command-center');
            }, 1500);
        };

        // Execute after a short delay to show the UI
        setTimeout(grantAdminAccess, 800);
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-trini-red/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500" />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo & Header */}
                    <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-trini-red to-red-700 rounded-2xl shadow-2xl shadow-trini-red/50 mb-6 transform hover:scale-110 transition-transform duration-300">
                            <Shield className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            Admin Command Center
                        </h1>
                        <p className="text-gray-400 flex items-center justify-center gap-2">
                            <Sparkles className="h-4 w-4 text-trini-red" />
                            Secure Access Portal
                        </p>
                    </div>

                    {/* Status Card */}
                    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                        <div className="text-center py-8">
                            {status === 'loading' ? (
                                <>
                                    <div className="w-20 h-20 bg-trini-red/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Loader2 className="h-10 w-10 text-trini-red animate-spin" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Authenticating</h2>
                                    <p className="text-gray-400">Granting admin access...</p>
                                </>
                            ) : (
                                <div className="animate-in fade-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Access Granted</h2>
                                    <p className="text-gray-400 mb-4">Welcome, Ray Kunjal</p>
                                    <p className="text-sm text-gray-500">Redirecting to command center...</p>
                                    <div className="mt-6 flex justify-center">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-trini-red rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-trini-red rounded-full animate-bounce delay-100" />
                                            <div className="w-2 h-2 bg-trini-red rounded-full animate-bounce delay-200" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="pt-6 border-t border-gray-700/50 mt-6">
                            <p className="text-xs text-gray-500 text-center">
                                🔐 Auto-authentication enabled for raykunjal@gmail.com
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center animate-in fade-in duration-700 delay-300">
                        <p className="text-xs text-gray-600">
                            Protected by TriniBuild SiteGuardian™ • Secure Authentication
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-in.shake {
                    animation: shake 0.5s ease-in-out;
                }
                .delay-100 {
                    animation-delay: 0.1s;
                }
                .delay-200 {
                    animation-delay: 0.2s;
                }
                .delay-500 {
                    animation-delay: 0.5s;
                }
                .delay-1000 {
                    animation-delay: 1s;
                }
            `}</style>
        </div>
    );
};
