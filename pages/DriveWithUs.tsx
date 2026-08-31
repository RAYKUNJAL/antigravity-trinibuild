import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Car, Clock, Users, Shield,
    Award, Zap, CheckCircle, ArrowRight, Phone,
    Package, FileText
} from 'lucide-react';
import { SEO } from '../components/SEO';

export const DriveWithUs: React.FC = () => {
    const navigate = useNavigate();

    const benefits = [
        {
            icon: Clock,
            title: 'Apply on your schedule',
            description: 'Rides are a listing, not a guaranteed paycheck. No income figure is promised.',
            highlight: 'No income claim'
        },
        {
            icon: Users,
            title: 'Work when you want',
            description: 'Set your own hours if you are approved. There is no published weekly minimum.',
            highlight: 'Apply first'
        },
        {
            icon: Package,
            title: 'Rides, delivery, or courier',
            description: 'Choose the jobs you want if those services are live. No earning mix is published.',
            highlight: 'No fare-split claim'
        },
        {
            icon: Shield,
            title: 'H-Car papers (optional)',
            description: 'Upload H-Car documents if you have them. That does not unlock a published lower rate.',
            highlight: 'Docs only'
        }
    ];

    const stats = [
        { number: 'Be First', label: 'Founding Drivers Wanted', icon: Users },
        { number: 'Apply', label: 'No income figure published', icon: FileText },
        { number: 'H-Car', label: 'Optional papers, no rate claim', icon: Shield },
        { number: '24/7', label: 'Support Available', icon: Zap }
    ];

    const howItWorks = [
        {
            step: '1',
            title: 'Apply online',
            description: 'Register and upload your license and vehicle docs.',
            icon: FileText
        },
        {
            step: '2',
            title: 'Get reviewed',
            description: 'A person reviews your documents. Approval is not instant or guaranteed.',
            icon: CheckCircle
        },
        {
            step: '3',
            title: 'Go online if approved',
            description: 'If you are approved, you can accept jobs when the service is live.',
            icon: Car
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <SEO
                title="Drive with Juvay"
                description="Apply to drive. No promised weekly or monthly income. No fare-split claim."
                keywords="drive for juvay, taxi driver jobs trinidad, delivery driver jobs trinidad"
            />
            <div className="relative bg-gradient-to-br from-trini-black via-gray-900 to-trini-black text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80')] bg-cover bg-center opacity-10"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block bg-yellow-400 text-trini-black px-4 py-2 rounded-full text-sm font-bold mb-6">
                                Trinidad & Tobago driver applications
                            </div>

                            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                                Drive. Deliver. <span className="text-yellow-400">Apply.</span>
                            </h1>

                            <p className="text-xl text-gray-300 mb-8">
                                Apply to drive with Juvay. We do not publish a commission split,
                                weekly potential, or monthly income figure.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <button
                                    onClick={() => navigate('/drive')}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-trini-black px-8 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                                >
                                    Apply to drive
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                    <span>No sign-up fee listed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                    <span>No income promise</span>
                                </div>
                            </div>
                        </div>

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

            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why apply
                        </h2>
                        <p className="text-xl text-gray-600">
                            Honest copy only. No published take-home number.
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

            <div className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        No published driver income
                    </h2>
                    <p className="text-xl text-gray-600 mb-6">
                        There is no written live product lock in this app for 80%+, a weekly or monthly
                        dollar figure, or an H-Car 10% split. Apply if you want to drive. Do not treat
                        this page as an earnings calculator.
                    </p>
                </div>
            </div>

            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            How to apply
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
                            onClick={() => navigate('/drive')}
                            className="bg-trini-red hover:bg-red-700 text-white px-12 py-5 rounded-lg font-bold text-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3 mx-auto"
                        >
                            Apply to drive
                            <ArrowRight className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Driver requirements
                        </h2>
                        <p className="text-xl text-gray-600">
                            Documents we ask for. Approval is not automatic.
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
                                <p className="text-sm text-gray-600">Trinidad bank account for payouts if a payout rail is live</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                            <Award className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">H-Car (Optional)</h4>
                                <p className="text-sm text-gray-600">Optional H-car papers. No fare-split is published here.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-20 bg-gradient-to-r from-trini-red to-orange-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-5xl font-extrabold mb-6">
                        Ready to apply?
                    </h2>
                    <p className="text-2xl mb-8 text-white/90">
                        Be among the first drivers on Juvay. No published income figure.
                    </p>

                    <button
                        onClick={() => navigate('/drive')}
                        className="bg-white text-trini-red px-12 py-5 rounded-lg font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all inline-flex items-center gap-3"
                    >
                        Apply free
                        <ArrowRight className="h-6 w-6" />
                    </button>

                    <p className="mt-6 text-white/80">
                        <Phone className="h-4 w-4 inline mr-2" />
                        Questions? Use the contact page. We do not publish a driver hotline here.
                    </p>
                </div>
            </div>
        </div>
    );
};
