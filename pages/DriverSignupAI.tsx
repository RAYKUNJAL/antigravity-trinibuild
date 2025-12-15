import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, CheckCircle, ArrowRight, DollarSign, Clock, Zap, Sparkles, MessageCircle, Camera } from 'lucide-react';
import { PhoneVerification } from '../components/PhoneVerification';
import { DocumentUploader } from '../components/DocumentUploader';
import { driverService } from '../services/driverService';
import { DocumentVerificationResult } from '../services/documentIntelligenceService';

export const DriverSignupAI: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [driverId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        phoneNumber: '',
        phoneVerified: false,
        fullName: '',
        email: '',
        nisNumber: '',
        documentsVerified: {
            driversPermit: false,
            insurance: false,
        },
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: new Date().getFullYear(),
        vehiclePlate: '',
        vehicleColor: '',
        rideshareEnabled: false,
        deliveryEnabled: false,
        courierEnabled: false,
    });

    const totalSteps = 5;
    const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

    const handlePhoneVerified = (phone: string) => {
        setFormData(prev => ({ ...prev, phoneNumber: phone, phoneVerified: true }));
        setCurrentStep(1);
    };

    const handleDocumentVerified = (documentType: string, result: DocumentVerificationResult) => {
        setFormData(prev => ({
            ...prev,
            documentsVerified: {
                ...prev.documentsVerified,
                [documentType]: result.success,
            },
        }));
    };

    const handleSubmit = async () => {
        try {
            await driverService.registerDriver({
                vehicleType: 'car',
                vehicleMake: formData.vehicleMake,
                vehicleModel: formData.vehicleModel,
                vehicleYear: formData.vehicleYear,
                vehiclePlate: formData.vehiclePlate,
                vehicleColor: formData.vehicleColor,
                licenseNumber: 'DL-123456',
                licenseExpiry: '2026-12-31',
                servicesEnabled: {
                    rideshare: formData.rideshareEnabled,
                    delivery: formData.deliveryEnabled,
                    courier: formData.courierEnabled,
                },
            });
            navigate('/driver/dashboard');
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-trini-black via-gray-900 to-trini-black text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-yellow-400 text-trini-black px-4 py-2 rounded-full text-sm font-bold mb-4">
                            <Sparkles className="h-4 w-4" />
                            AI-Powered Signup - Get Approved in Minutes!
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                            Join TriniBuild <span className="text-yellow-400">Go</span>
                        </h1>
                        <p className="text-xl text-gray-300 mb-6">
                            Smart AI assistant guides you through every step
                        </p>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                <div className="text-2xl font-bold">80%+</div>
                                <div className="text-xs text-gray-300">You Keep</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                <div className="text-2xl font-bold">8 min</div>
                                <div className="text-xs text-gray-300">Signup Time</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                                <div className="text-2xl font-bold">Instant</div>
                                <div className="text-xs text-gray-300">AI Approval</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="relative">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-trini-red to-orange-500 transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        {['Phone', 'Info', 'Documents', 'Vehicle', 'Services'].map((label, idx) => (
                            <div
                                key={idx}
                                className={`text-xs font-medium ${idx <= currentStep ? 'text-trini-red' : 'text-gray-400'
                                    }`}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Form */}
            <div className="max-w-4xl mx-auto px-4 pb-12">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Step 0: Phone Verification */}
                    {currentStep === 0 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-green-500 to-emerald-600 h-12 w-12 rounded-full flex items-center justify-center">
                                    <MessageCircle className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">Let's Get Started!</h2>
                                    <p className="text-gray-600">Verify your WhatsApp number to continue</p>
                                </div>
                            </div>
                            <PhoneVerification onVerified={handlePhoneVerified} />
                        </div>
                    )}

                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Personal Information</h2>
                            <p className="text-gray-600 mb-8">Tell us a bit about yourself</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="john@example.com"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        NIS Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nisNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nisNumber: e.target.value }))}
                                        placeholder="XXXXXXXXX"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => setCurrentStep(0)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    disabled={!formData.fullName || !formData.email || !formData.nisNumber}
                                    className="flex-1 bg-trini-red text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Document Upload */}
                    {currentStep === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-12 w-12 rounded-full flex items-center justify-center">
                                    <Camera className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">AI Document Verification</h2>
                                    <p className="text-gray-600">Our AI will verify your documents instantly</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <DocumentUploader
                                    documentType="drivers_permit"
                                    label="Driver's Permit"
                                    required
                                    expectedName={formData.fullName}
                                    onVerified={(result, url) => handleDocumentVerified('driversPermit', result)}
                                    driverId={driverId || undefined}
                                />

                                <DocumentUploader
                                    documentType="vehicle_insurance"
                                    label="Vehicle Insurance"
                                    required
                                    onVerified={(result, url) => handleDocumentVerified('insurance', result)}
                                    driverId={driverId || undefined}
                                />
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    disabled={!formData.documentsVerified.driversPermit || !formData.documentsVerified.insurance}
                                    className="flex-1 bg-trini-red text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Vehicle Information */}
                    {currentStep === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Information</h2>
                            <p className="text-gray-600 mb-8">Tell us about your vehicle</p>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                                        <input
                                            type="text"
                                            value={formData.vehicleMake}
                                            onChange={(e) => setFormData(prev => ({ ...prev, vehicleMake: e.target.value }))}
                                            placeholder="Toyota"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                                        <input
                                            type="text"
                                            value={formData.vehicleModel}
                                            onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                                            placeholder="Corolla"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                                        <input
                                            type="number"
                                            value={formData.vehicleYear}
                                            onChange={(e) => setFormData(prev => ({ ...prev, vehicleYear: parseInt(e.target.value) }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Plate *</label>
                                        <input
                                            type="text"
                                            value={formData.vehiclePlate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, vehiclePlate: e.target.value.toUpperCase() }))}
                                            placeholder="PBX 1234"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Color *</label>
                                        <input
                                            type="text"
                                            value={formData.vehicleColor}
                                            onChange={(e) => setFormData(prev => ({ ...prev, vehicleColor: e.target.value }))}
                                            placeholder="White"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setCurrentStep(4)}
                                    disabled={!formData.vehicleMake || !formData.vehicleModel || !formData.vehiclePlate}
                                    className="flex-1 bg-trini-red text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Service Selection */}
                    {currentStep === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Services</h2>
                            <p className="text-gray-600 mb-8">Select which services you want to offer</p>

                            <div className="space-y-4">
                                <div
                                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${formData.rideshareEnabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    onClick={() => setFormData(prev => ({ ...prev, rideshareEnabled: !prev.rideshareEnabled }))}
                                >
                                    <div className="flex items-center gap-4">
                                        <Car className="h-8 w-8 text-blue-600" />
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900">Rideshare</h3>
                                            <p className="text-gray-600">Transport passengers</p>
                                            <p className="text-sm text-green-600 font-bold mt-1">$25-100+ per ride</p>
                                        </div>
                                        {formData.rideshareEnabled && <CheckCircle className="h-6 w-6 text-blue-600" />}
                                    </div>
                                </div>

                                <div
                                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${formData.deliveryEnabled ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                                        }`}
                                    onClick={() => setFormData(prev => ({ ...prev, deliveryEnabled: !prev.deliveryEnabled }))}
                                >
                                    <div className="flex items-center gap-4">
                                        <Camera className="h-8 w-8 text-orange-600" />
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900">Food & Goods Delivery</h3>
                                            <p className="text-gray-600">Deliver food and packages</p>
                                            <p className="text-sm text-green-600 font-bold mt-1">$18-50 per delivery</p>
                                        </div>
                                        {formData.deliveryEnabled && <CheckCircle className="h-6 w-6 text-orange-600" />}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!formData.rideshareEnabled && !formData.deliveryEnabled && !formData.courierEnabled}
                                    className="flex-1 bg-gradient-to-r from-trini-red to-red-600 text-white py-4 rounded-lg font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Complete Registration
                                    <CheckCircle className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
