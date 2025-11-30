import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Car, DollarSign, Clock, TrendingUp, Users, Shield,
    Star, Award, Zap, CheckCircle, ArrowRight, Phone, Mail,
    MapPin, Package, FileText, Calendar
} from 'lucide-react';

export const DriveWithUs: React.FC = () => {
    const navigate = useNavigate();

    const benefits = [
        {
            icon: DollarSign,
            title: 'Keep 80%+ of Your Earnings',
            description: 'Lowest commission rates in Trinidad. More money in your pocket.',
            highlight: 'Up to $500+ weekly'
        },
        {
            icon: Clock,
            title: 'Work When You Want',
            description: 'Be your own boss. Set your own schedule. Work as little or as much as you like.',
            highlight: '24/7 Flexibility'
        },
        {
            icon: TrendingUp,
            title: 'Multiple Income Streams',
            description: 'Choose from Rideshare, Delivery, or Courier. Or do all three!',
            highlight: '3 Services in 1 App'
        },
        {
            icon: Shield,
            title: 'H-Car Special Rates',
            description: 'Licensed H-Car drivers get even lower commission rates.',
            highlight: 'Only 10% commission'
        }
    ];

    const stats = [
        { number: '500+', label: 'Active Drivers', icon: Users },
        { number: '$800', label: 'Avg Weekly Earnings', icon: DollarSign },
        { number: '4.9', label: 'Driver Rating', icon: Star },
        { number: '24/7', label: 'Support Available', icon: Zap }
    ];

    const howItWorks = [
        {
            step: '1',
            title: 'Sign Up Online',
            description: 'Quick 5-minute registration. Upload your license and vehicle docs.',
            icon: FileText
        },
        {
            step: '2',
            title: 'Get Approved',
            description: 'We verify your documents within 24 hours.',
            icon: CheckCircle
        },
        {
            step: '3',
            title: 'Start Earning',
            description: 'Go online and start accepting jobs immediately.',
            icon: DollarSign
        }
    ];

    const earnings = [
        { service: 'Rideshare', perTrip: '$25-100', perHour: '$40-80', icon: Car, color: 'blue' },
        { service: 'Food Delivery', perTrip: '$18-50', perHour: '$30-60', icon: Package, color: 'orange' },
        { service: 'Courier', perTrip: '$25-60', perHour: '$35-70', icon: FileText, color: 'purple' }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-trini-black via-gray-900 to-trini-black text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80')] bg-cover bg-center opacity-10"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block bg-yellow-400 text-trini-black px-4 py-2 rounded-full text-sm font-bold mb-6">
                                🇹🇹 Trinidad & Tobago's #1 Driver Platform
                            </div>

                            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                                Drive. Deliver. <span className="text-yellow-400">Earn More.</span>
                            </h1>

                            <p className="text-xl text-gray-300 mb-8">
                                Join TriniBuild Go and start earning on your own schedule.
                                We offer the <strong>lowest commission rates</strong> and <strong>highest driver earnings</strong> in Trinidad.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <button
                                    onClick={() => navigate('/drive/signup')}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-trini-black px-8 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                                >
                                    Start Earning Today
                                    <ArrowRight className="h-5 w-5" />
                                </button>

                                <button
                                    onClick={() => document.getElementById('earnings')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all"
                                >
                                    View Earnings
                                </button>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                    <span>No Sign-Up Fees</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                    <span>Weekly Payouts</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                    <stat.icon className="h-8 w-8 text-yellow-400 mb-3" />
                                    <div className="text-4xl font-bold mb-1">{stat.number}</div>
                                    <div className="text-sm text-gray-300">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why Drivers Choose TriniBuild Go
                        </h2>
                        <p className="text-xl text-gray-600">
                            More earnings, more freedom, more support
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((benefit, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                                <div className="bg-gradient-to-br from-trini-red to-orange-500 h-14 w-14 rounded-lg flex items-center justify-center mb-4">
                                    <benefit.icon className="h-7 w-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                                <p className="text-gray-600 mb-4">{benefit.description}</p>
                                <div className="text-trini-red font-bold">{benefit.highlight}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Earnings Calculator */}
            <div id="earnings" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            How Much Can You Earn?
                        </h2>
                        <p className="text-xl text-gray-600">
                            Choose your service and see your potential earnings
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {earnings.map((earning, idx) => (
                            <div key={idx} className={`bg-gradient-to-br from-${earning.color}-50 to-${earning.color}-100 rounded-2xl p-8 border-2 border-${earning.color}-200`}>
                                <earning.icon className={`h-12 w-12 text-${earning.color}-600 mb-4`} />
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">{earning.service}</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Per Trip:</span>
                                        <span className="text-xl font-bold text-gray-900">{earning.perTrip}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Per Hour:</span>
                                        <span className="text-xl font-bold text-gray-900">{earning.perHour}</span>
                                    </div>
                                </div>

                                <div className={`bg-${earning.color}-200 rounded-lg p-4 text-center`}>
                                    <div className="text-sm text-gray-700 mb-1">Weekly Potential</div>
                                    <div className="text-2xl font-bold text-gray-900">$400-800+</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
                        <div className="text-center">
                            <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Earn Even More!</h3>
                            <p className="text-gray-700 mb-4">
                                Work 40 hours/week across all three services and earn <strong className="text-green-600">$1,500-2,000+ monthly</strong>
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>Plus bonuses, surge pricing, and tips</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Start Earning in 3 Easy Steps
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {howItWorks.map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                                    <div className="bg-gradient-to-br from-trini-red to-orange-500 h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 mx-auto">
                                        {item.step}
                                    </div>
                                    <item.icon className="h-10 w-10 text-trini-red mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{item.title}</h3>
                                    <p className="text-gray-600 text-center">{item.description}</p>
                                </div>
                                {idx < howItWorks.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                                        <ArrowRight className="h-8 w-8 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <button
                            onClick={() => navigate('/drive/signup')}
                            className="bg-trini-red hover:bg-red-700 text-white px-12 py-5 rounded-lg font-bold text-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3 mx-auto"
                        >
                            Get Started Now - It's Free!
                            <ArrowRight className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Requirements */}
            <div className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Driver Requirements
                        </h2>
                        <p className="text-xl text-gray-600">
                            Make sure you meet these simple requirements
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Valid Driver's License</h4>
                                <p className="text-sm text-gray-600">Trinidad & Tobago driver's license, not expired</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Vehicle (2005 or Newer)</h4>
                                <p className="text-sm text-gray-600">Car, motorcycle, bicycle, or van in good condition</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Insurance</h4>
                                <p className="text-sm text-gray-600">Valid vehicle insurance</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Smartphone</h4>
                                <p className="text-sm text-gray-600">iPhone or Android with GPS</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Bank Account</h4>
                                <p className="text-sm text-gray-600">Trinidad bank account for payouts</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                            <Award className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">H-Car (Optional)</h4>
                                <p className="text-sm text-gray-600">Get 10% commission instead of 20%!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-20 bg-gradient-to-r from-trini-red to-orange-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-5xl font-extrabold mb-6">
                        Ready to Start Earning?
                    </h2>
                    <p className="text-2xl mb-8 text-white/90">
                        Join thousands of drivers already making money on TriniBuild Go
                    </p>

                    <button
                        onClick={() => navigate('/drive/signup')}
                        className="bg-white text-trini-red px-12 py-5 rounded-lg font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all inline-flex items-center gap-3"
                    >
                        Sign Up Free - 5 Minutes
                        <ArrowRight className="h-6 w-6" />
                    </button>

                    <p className="mt-6 text-white/80">
                        <Phone className="h-4 w-4 inline mr-2" />
                        Questions? Call us: <strong>1-868-GO-DRIVE</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};
