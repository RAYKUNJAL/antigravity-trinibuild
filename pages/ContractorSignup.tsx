import React, { useState } from 'react';
import { FileSignature, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { legalService } from '../services/legalService';

export const ContractorSignup: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'agreement' | 'signup' | 'success'>('agreement');
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        businessName: '',
        password: '',
        confirmPassword: ''
    });

    const handleAgree = () => {
        if (!agreed) {
            alert('Please check the box to agree to the terms.');
            return;
        }
        setStep('signup');
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        if (formData.password.length < 6) {
            alert('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            // 1. Create user account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        business_name: formData.businessName
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Sign the contractor agreement
                await legalService.signDocument(
                    authData.user.id,
                    'contractor_agreement',
                    `Signed by ${formData.fullName} on ${new Date().toLocaleDateString()}`
                );

                setStep('success');
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            alert(error.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-trini-red rounded-full mb-4">
                        <FileSignature className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                        {step === 'agreement' && 'Independent Contractor Agreement'}
                        {step === 'signup' && 'Create Your Account'}
                        {step === 'success' && 'Welcome to TriniBuild!'}
                    </h1>
                    <p className="text-gray-600">
                        {step === 'agreement' && 'Please review and accept the terms to continue'}
                        {step === 'signup' && 'Complete your registration to start selling'}
                        {step === 'success' && 'Your account has been created successfully'}
                    </p>
                </div>

                {/* Step 1: Agreement */}
                {step === 'agreement' && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6 flex items-start">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-yellow-800">
                                This is a legally binding agreement. By using TriniBuild services as a provider, driver, or vendor, you agree to these terms.
                            </p>
                        </div>

                        <div className="prose prose-sm max-w-none mb-8 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-6 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">1. Contractor Status</h3>
                            <p className="text-gray-700 mb-4">
                                The user acknowledges that they are an independent contractor, not an employee of TriniBuild. You are solely responsible for your own taxes, insurance, licenses, and compliance with local laws.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mb-4">2. No Employment Claims</h3>
                            <p className="text-gray-700 mb-4">
                                You agree to waive any claims to employment benefits, including but not limited to health insurance, paid time off, or retirement benefits.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mb-4">3. Business Document Rights</h3>
                            <p className="text-gray-700 mb-4">
                                You grant TriniBuild permission to generate job letters, income summaries, and business-related documents based on your platform activity for your convenience.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mb-4">4. Tax Responsibility</h3>
                            <p className="text-gray-700 mb-4">
                                All income earned through TriniBuild is self-employment income. TriniBuild does not withhold taxes on your behalf.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mb-4">5. Platform Fees</h3>
                            <p className="text-gray-700 mb-4">
                                TriniBuild charges a service fee on transactions processed through the platform. Fee structures are outlined in your dashboard and may vary by service type.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mb-4">6. Liability Waiver</h3>
                            <p className="text-gray-700 mb-4">
                                TriniBuild is not liable for any disputes, damages, injuries, or losses arising from your business activities on the platform. You operate at your own risk.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mb-4">7. Termination</h3>
                            <p className="text-gray-700 mb-4">
                                Either party may terminate this agreement at any time. TriniBuild reserves the right to suspend or terminate accounts that violate our terms of service.
                            </p>
                        </div>

                        <div className="flex items-start mb-6">
                            <input
                                type="checkbox"
                                id="agree"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-1 h-5 w-5 text-trini-red border-gray-300 rounded focus:ring-trini-red"
                            />
                            <label htmlFor="agree" className="ml-3 text-sm text-gray-700">
                                I have read and agree to the Independent Contractor Agreement. I understand that I am not an employee of TriniBuild and am responsible for my own taxes and insurance.
                            </label>
                        </div>

                        <button
                            onClick={handleAgree}
                            disabled={!agreed}
                            className="w-full bg-trini-red text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue to Sign Up
                        </button>
                    </div>
                )}

                {/* Step 2: Signup Form */}
                {step === 'signup' && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <form onSubmit={handleSignup} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-trini-red focus:border-trini-red"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Business Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-trini-red focus:border-trini-red"
                                        placeholder="My Business"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-trini-red focus:border-trini-red"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-trini-red focus:border-trini-red"
                                    placeholder="1-868-XXX-XXXX"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Password *</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-trini-red focus:border-trini-red"
                                        placeholder="Min. 6 characters"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password *</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-trini-red focus:border-trini-red"
                                        placeholder="Re-enter password"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep('agreement')}
                                    className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-trini-red text-white py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        'Sign Agreement & Create Account'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === 'success' && (
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Account Created!</h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Check your email to verify your account, then you can start building your store.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/create-store')}
                                className="bg-trini-red text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                            >
                                Create Your Store
                            </button>
                            <button
                                onClick={() => navigate('/auth')}
                                className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>
                        Already have an account?{' '}
                        <a href="/#/auth" className="text-trini-red font-bold hover:underline">
                            Sign In
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};
