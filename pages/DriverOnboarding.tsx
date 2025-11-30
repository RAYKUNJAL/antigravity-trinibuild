import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Upload, FileText, CheckCircle, ArrowRight,
  Shield, Award, DollarSign, Clock, TrendingUp, Camera
} from 'lucide-react';
import { driverService } from '../services/driverService';

export const DriverOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    email: '',
    phone: '',
    address: '',

    // Vehicle Info
    vehicleType: 'car',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehiclePlate: '',
    vehicleColor: '',

    // License Info
    licenseNumber: '',
    licenseExpiry: '',
    isHCar: false,
    hCarNumber: '',

    // Service Selection
    rideshareEnabled: false,
    deliveryEnabled: false,
    courierEnabled: false,

    // Bank Info
    bankName: '',
    bankAccountNumber: '',
    bankRoutingNumber: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await driverService.registerDriver({
        vehicleType: formData.vehicleType,
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear,
        vehiclePlate: formData.vehiclePlate,
        vehicleColor: formData.vehicleColor,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        servicesEnabled: {
          rideshare: formData.rideshareEnabled,
          delivery: formData.deliveryEnabled,
          courier: formData.courierEnabled
        }
      });

      // Redirect to driver hub
      navigate('/driver/hub');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-trini-black to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-4">
              Drive with TriniBuild <span className="text-yellow-400">Go</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Earn money on your schedule. Rideshare, delivery, or courier – you choose!
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <DollarSign className="h-10 w-10 text-green-400 mx-auto mb-3" />
                <div className="text-2xl font-bold mb-1">80%</div>
                <div className="text-sm text-gray-300">You keep 80%+ of fares</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Clock className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                <div className="text-2xl font-bold mb-1">Flexible</div>
                <div className="text-sm text-gray-300">Work when you want</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <TrendingUp className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
                <div className="text-2xl font-bold mb-1">$500+</div>
                <div className="text-sm text-gray-300">Weekly earnings potential</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Award className="h-10 w-10 text-purple-400 mx-auto mb-3" />
                <div className="text-2xl font-bold mb-1">3 in 1</div>
                <div className="text-sm text-gray-300">Multi-service platform</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center h-12 w-12 rounded-full font-bold transition-all ${step >= s ? 'bg-trini-red text-white scale-110' : 'bg-gray-200 text-gray-500'
                }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 transition-all ${step > s ? 'bg-trini-red' : 'bg-gray-200'
                  }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Vehicle Info */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Information</h2>
              <p className="text-gray-600 mb-8">Tell us about the vehicle you'll be using</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                  >
                    <option value="car">Car (Sedan)</option>
                    <option value="suv">SUV</option>
                    <option value="van">Van (7-seater)</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                    <input
                      type="text"
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={handleChange}
                      placeholder="e.g., Toyota"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                    <input
                      type="text"
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleChange}
                      placeholder="e.g., Corolla"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                    <input
                      type="number"
                      name="vehicleYear"
                      value={formData.vehicleYear}
                      onChange={handleChange}
                      min="2000"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Plate *</label>
                    <input
                      type="text"
                      name="vehiclePlate"
                      value={formData.vehiclePlate}
                      onChange={handleChange}
                      placeholder="PBX 1234"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color *</label>
                    <input
                      type="text"
                      name="vehicleColor"
                      value={formData.vehicleColor}
                      onChange={handleChange}
                      placeholder="White"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* H-Car Option */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isHCar"
                      checked={formData.isHCar}
                      onChange={handleChange}
                      className="h-5 w-5 text-trini-red focus:ring-trini-red border-gray-300 rounded"
                    />
                    <span className="ml-3 flex-1">
                      <span className="font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-yellow-600" />
                        I have a Trinidad H-Car Registration
                      </span>
                      <span className="block text-sm text-gray-600 mt-1">Lower commission rates for registered taxis!</span>
                    </span>
                  </label>

                  {formData.isHCar && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">H-Car Number</label>
                      <input
                        type="text"
                        name="hCarNumber"
                        value={formData.hCarNumber}
                        onChange={handleChange}
                        placeholder="H-1234"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="mt-8 w-full bg-trini-red text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Step 2: License & Documents */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Driver's License</h2>
              <p className="text-gray-600 mb-8">We need to verify your license information</p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="TT123456"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                    <input
                      type="date"
                      name="licenseExpiry"
                      value={formData.licenseExpiry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Document Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-trini-red transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">Upload Driver's License Photo</p>
                  <p className="text-sm text-gray-500 mb-4">Click to browse or drag and drop</p>
                  <input type="file" className="hidden" accept="image/*" />
                  <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    Choose File
                  </button>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Required Documents
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      Valid Trinidad & Tobago Driver's License
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      Vehicle Registration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      Proof of Insurance
                    </li>
                    {formData.isHCar && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        H-Car Permit
                      </li>
                    )}
                  </ul>
                  <p className="text-xs text-blue-600 mt-4">
                    You can upload these documents after registration
                  </p>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-trini-red text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Service Selection */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Services</h2>
              <p className="text-gray-600 mb-8">Select which services you want to offer (you can change this later)</p>

              <div className="space-y-4">
                <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${formData.rideshareEnabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, rideshareEnabled: !prev.rideshareEnabled }))}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.rideshareEnabled ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                      {formData.rideshareEnabled && <div className="h-3 w-3 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-6 w-6 text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-900">Rideshare</h3>
                      </div>
                      <p className="text-gray-600 mb-3">Transport passengers to their destinations</p>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Earn <strong>$25-100+ per ride</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-700">Commission: <strong>20-25%</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${formData.deliveryEnabled ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, deliveryEnabled: !prev.deliveryEnabled }))}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.deliveryEnabled ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                      }`}>
                      {formData.deliveryEnabled && <div className="h-3 w-3 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="h-6 w-6 text-orange-600" />
                        <h3 className="text-xl font-bold text-gray-900">Food & Goods Delivery</h3>
                      </div>
                      <p className="text-gray-600 mb-3">Deliver food, groceries, and packages</p>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Earn <strong>$18-50 per delivery</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span className="text-gray-700">Commission: <strong>25%</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${formData.courierEnabled ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, courierEnabled: !prev.courierEnabled }))}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.courierEnabled ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                      }`}>
                      {formData.courierEnabled && <div className="h-3 w-3 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-6 w-6 text-purple-600" />
                        <h3 className="text-xl font-bold text-gray-900">Courier Services</h3>
                      </div>
                      <p className="text-gray-600 mb-3">Deliver documents and packages for businesses</p>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">Earn <strong>$25-60+ per job</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-gray-700">Commission: <strong>18-22%</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!formData.rideshareEnabled && !formData.deliveryEnabled && !formData.courierEnabled && (
                <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-800 font-medium">Please select at least one service to continue</p>
                </div>
              )}

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!formData.rideshareEnabled && !formData.deliveryEnabled && !formData.courierEnabled}
                  className="flex-1 bg-trini-red text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Bank Info & Complete */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Information</h2>
              <p className="text-gray-600 mb-8">Where should we send your earnings?</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                  <select
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                  >
                    <option value="">Select your bank</option>
                    <option value="First Citizens Bank">First Citizens Bank</option>
                    <option value="Republic Bank">Republic Bank</option>
                    <option value="Scotiabank">Scotiabank</option>
                    <option value="RBC Royal Bank">RBC Royal Bank</option>
                    <option value="CIBC FirstCaribbean">CIBC FirstCaribbean</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    placeholder="1234567890"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                  />
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    You're Almost Ready!
                  </h3>
                  <div className="space-y-2 text-sm text-green-800">
                    <p>✓ Vehicle: {formData.vehicleMake} {formData.vehicleModel}</p>
                    <p>✓ Services: {[
                      formData.rideshareEnabled && 'Rideshare',
                      formData.deliveryEnabled && 'Delivery',
                      formData.courierEnabled && 'Courier'
                    ].filter(Boolean).join(', ')}</p>
                    <p>✓ License verified</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-trini-red to-red-600 text-white py-4 rounded-lg font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : (
                    <>
                      Complete Registration
                      <CheckCircle className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};