import React, { useState, useEffect } from 'react';
import {
    Car, Package, FileText, DollarSign, TrendingUp, Clock,
    Navigation, Phone, MessageCircle, Star, Award, Zap,
    MapPin, ChevronRight, CheckCircle, XCircle, AlertCircle,
    Menu, X, Settings, LogOut, User, CreditCard, Bell, Shield
} from 'lucide-react';
import { driverService, Driver, GigJob } from '../services/driverService';
import { useNavigate } from 'react-router-dom';

export const DriverHub: React.FC = () => {
    const navigate = useNavigate();
    const [driver, setDriver] = useState<Driver | null>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'earnings' | 'profile'>('dashboard');
    const [availableJobs, setAvailableJobs] = useState<GigJob[]>([]);
    const [activeJob, setActiveJob] = useState<GigJob | null>(null);
    const [earnings, setEarnings] = useState<any>(null);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        loadDriverData();
        const interval = setInterval(loadDriverData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const loadDriverData = async () => {
        const driverData = await driverService.getDriverProfile();
        if (!driverData) {
            navigate('/driver-onboarding');
            return;
        }
        setDriver(driverData);
        setIsOnline(driverData.status === 'online');

        const earningsData = await driverService.getEarningsSummary();
        setEarnings(earningsData);

        const activeJobData = await driverService.getActiveJob();
        setActiveJob(activeJobData);

        if (driverData.status === 'online') {
            const jobs = await driverService.getAvailableJobs();
            setAvailableJobs(jobs);
        }
    };

    const toggleOnline = async () => {
        const newStatus = isOnline ? 'offline' : 'online';
        await driverService.updateStatus(newStatus);
        setIsOnline(!isOnline);
        if (!isOnline) {
            loadDriverData();
        }
    };

    const toggleService = async (service: 'rideshare' | 'delivery' | 'courier') => {
        if (!driver) return;
        const currentlyEnabled = driver[`${service}_enabled`];
        await driverService.toggleService(service, !currentlyEnabled);
        loadDriverData();
    };

    const acceptJob = async (jobId: string) => {
        await driverService.acceptJob(jobId);
        loadDriverData();
    };

    const updateJobStatus = async (status: string) => {
        if (!activeJob) return;
        await driverService.updateJobStatus(activeJob.id, status);
        loadDriverData();
    };

    if (!driver) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trini-red"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-trini-black text-white sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold">TriniBuild <span className="text-yellow-400">Go</span></h1>
                            <span className="ml-4 px-3 py-1 bg-yellow-400 text-trini-black rounded-full text-xs font-bold">
                                DRIVER
                            </span>
                        </div>

                        {/* Online Toggle */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleOnline}
                                className={`relative inline-flex items-center h-10 rounded-full w-20 transition-colors duration-300 ${isOnline ? 'bg-green-500' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block w-8 h-8 transform transition-transform duration-300 bg-white rounded-full shadow-lg ${isOnline ? 'translate-x-11' : 'translate-x-1'
                                        }`}
                                />
                                <span className={`absolute text-xs font-bold ${isOnline ? 'left-2' : 'right-2'}`}>
                                    {isOnline ? 'ON' : 'OFF'}
                                </span>
                            </button>

                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Service Toggles - Only show when online */}
                    {isOnline && (
                        <div className="pb-4 flex gap-3 overflow-x-auto">
                            <button
                                onClick={() => toggleService('rideshare')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${driver.rideshare_enabled
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                    }`}
                            >
                                <Car className="h-4 w-4" />
                                Rideshare
                                {driver.rideshare_enabled && <CheckCircle className="h-4 w-4" />}
                            </button>

                            <button
                                onClick={() => toggleService('delivery')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${driver.delivery_enabled
                                        ? 'bg-orange-500 text-white shadow-lg'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                    }`}
                            >
                                <Package className="h-4 w-4" />
                                Delivery
                                {driver.delivery_enabled && <CheckCircle className="h-4 w-4" />}
                            </button>

                            <button
                                onClick={() => toggleService('courier')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${driver.courier_enabled
                                        ? 'bg-purple-500 text-white shadow-lg'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                    }`}
                            >
                                <FileText className="h-4 w-4" />
                                Courier
                                {driver.courier_enabled && <CheckCircle className="h-4 w-4" />}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Menu Overlay */}
            {showMenu && (
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMenu(false)}>
                    <div className="absolute right-0 top-16 w-80 bg-white shadow-2xl rounded-bl-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                                <div className="h-16 w-16 bg-gradient-to-br from-trini-red to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                    {driver.vehicle_plate?.charAt(0) || 'D'}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">Driver</div>
                                    <div className="text-sm text-gray-500">{driver.vehicle_plate || 'Not Set'}</div>
                                    <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold mt-1">
                                        <Star className="h-3 w-3 fill-current" />
                                        {driver.rating.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            <nav className="space-y-2">
                                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left">
                                    <User className="h-5 w-5 text-gray-600" />
                                    <span className="font-medium text-gray-700">Profile</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left">
                                    <CreditCard className="h-5 w-5 text-gray-600" />
                                    <span className="font-medium text-gray-700">Payments</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left">
                                    <Bell className="h-5 w-5 text-gray-600" />
                                    <span className="font-medium text-gray-700">Notifications</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left">
                                    <Settings className="h-5 w-5 text-gray-600" />
                                    <span className="font-medium text-gray-700">Settings</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600">
                                    <LogOut className="h-5 w-5" />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Active Job Card - Priority Display */}
                {activeJob && (
                    <div className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-2xl animate-in slide-in-from-top-2">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    {activeJob.job_type === 'rideshare' && <Car className="h-5 w-5" />}
                                    {activeJob.job_type === 'delivery' && <Package className="h-5 w-5" />}
                                    {activeJob.job_type === 'courier' && <FileText className="h-5 w-5" />}
                                    <span className="font-bold text-lg capitalize">{activeJob.job_type === 'rideshare' ? 'Passenger Ride' : activeJob.job_type}</span>
                                </div>
                                <div className="text-blue-100 text-sm">
                                    {activeJob.status === 'accepted' && 'Head to pickup location'}
                                    {activeJob.status === 'picked_up' && 'Item picked up - Deliver now'}
                                    {activeJob.status === 'in_transit' && 'In transit to destination'}
                                </div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                                <div className="text-2xl font-bold">${activeJob.driver_earnings.toFixed(2)}</div>
                                <div className="text-xs text-blue-100">Your Earnings</div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-8 w-8 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-blue-100">Pickup</div>
                                    <div className="font-medium">{activeJob.pickup_location}</div>
                                </div>
                            </div>

                            <div className="ml-4 border-l-2 border-white/30 h-4"></div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-8 w-8 rounded-full bg-red-400 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-blue-100">Dropoff</div>
                                    <div className="font-medium">{activeJob.dropoff_location}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {activeJob.status === 'accepted' && (
                                <button
                                    onClick={() => updateJobStatus('picked_up')}
                                    className="flex-1 bg-white text-blue-600 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
                                >
                                    Arrived at Pickup
                                </button>
                            )}
                            {activeJob.status === 'picked_up' && (
                                <button
                                    onClick={() => updateJobStatus('in_transit')}
                                    className="flex-1 bg-white text-blue-600 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
                                >
                                    Start Trip
                                </button>
                            )}
                            {activeJob.status === 'in_transit' && (
                                <button
                                    onClick={() => updateJobStatus('completed')}
                                    className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="h-5 w-5" />
                                    Complete Delivery
                                </button>
                            )}
                            <button className="bg-white/20 backdrop-blur-sm p-3 rounded-lg hover:bg-white/30 transition-colors">
                                <Navigation className="h-5 w-5" />
                            </button>
                            <button className="bg-white/20 backdrop-blur-sm p-3 rounded-lg hover:bg-white/30 transition-colors">
                                <Phone className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Earnings Overview - Uber-style */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500">Today</div>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900">${earnings?.today.toFixed(2) || '0.00'}</div>
                        <div className="text-xs text-gray-500 mt-1">+12% vs yesterday</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500">This Week</div>
                            <DollarSign className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900">${earnings?.weekly.toFixed(2) || '0.00'}</div>
                        <div className="text-xs text-gray-500 mt-1">{earnings?.total_jobs || 0} jobs completed</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500">This Month</div>
                            <Award className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900">${earnings?.monthly.toFixed(2) || '0.00'}</div>
                        <div className="text-xs text-gray-500 mt-1">On track for bonus</div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm opacity-90">Rating</div>
                            <Star className="h-4 w-4 fill-current" />
                        </div>
                        <div className="text-3xl font-bold">{earnings?.rating.toFixed(1) || '5.0'}</div>
                        <div className="text-xs opacity-90 mt-1">Excellent service!</div>
                    </div>
                </div>

                {/* Available Jobs - Uber Eats style cards */}
                {isOnline && !activeJob && availableJobs.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Available Near You
                        </h2>

                        <div className="space-y-4">
                            {availableJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-100 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() => acceptJob(job.id)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${job.job_type === 'rideshare' ? 'bg-blue-100' :
                                                    job.job_type === 'delivery' ? 'bg-orange-100' : 'bg-purple-100'
                                                }`}>
                                                {job.job_type === 'rideshare' && <Car className="h-6 w-6 text-blue-600" />}
                                                {job.job_type === 'delivery' && <Package className="h-6 w-6 text-orange-600" />}
                                                {job.job_type === 'courier' && <FileText className="h-6 w-6 text-purple-600" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 capitalize">
                                                    {job.job_type === 'rideshare' ? 'Passenger Pickup' : job.job_type}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {job.distance_km ? `${job.distance_km.toFixed(1)} km away` : 'Nearby'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-600">${job.driver_earnings.toFixed(2)}</div>
                                            <div className="text-xs text-gray-500">Est. earnings</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4 text-sm">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-500">Pickup</div>
                                                <div className="text-gray-900 font-medium">{job.pickup_location}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-500">Dropoff</div>
                                                <div className="text-gray-900 font-medium">{job.dropoff_location}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full bg-trini-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                                        Accept Job
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Jobs Available */}
                {isOnline && !activeJob && availableJobs.length === 0 && (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Looking for jobs...</h3>
                        <p className="text-gray-500">We'll notify you when a job becomes available in your area.</p>
                    </div>
                )}

                {/* Offline State */}
                {!isOnline && (
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-12 text-center">
                        <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Car className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">You're offline</h3>
                        <p className="text-gray-600 mb-6">Turn on to start accepting jobs and earning money</p>
                        <button
                            onClick={toggleOnline}
                            className="bg-trini-red text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors shadow-lg"
                        >
                            Go Online
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
