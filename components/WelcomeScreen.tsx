import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Car, Briefcase, Home, Ticket, Wrench, Sparkles, X, MessageSquare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Placeholder AI Assistant Modal
const AIAssistantModal = ({ service, onClose }: { service: string, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="font-bold text-lg">TriniBuild AI Assistant</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="bg-blue-50 p-4 rounded-xl mb-4">
                        <p className="text-gray-700 text-sm">
                            Run a business in Trinidad & Tobago? I can help you set up your <strong>{service}</strong> business in seconds.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Describe what you want to build..."
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            autoFocus
                        />
                        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" /> Generate My Plan
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export const WelcomeScreen = () => {
    const navigate = useNavigate();
    const [selectedService, setSelectedService] = useState('marketplace');
    const [showAIAssistant, setShowAIAssistant] = useState(false);

    // Define full Tailwind classes to ensure JIT compiler picks them up
    const services: any = {
        marketplace: {
            icon: <Store className="w-5 h-5" />,
            title: "Launch Your Store in 90 Seconds",
            subtitle: "AI builds your complete store—products, theme, SEO—while you grab a doubles.",
            cta: "Start Selling Free",
            features: ["10 Free Listings", "AI Store Builder", "No Credit Card"],
            heroImage: "https://images.unsplash.com/photo-1472851294608-4155f2118c67?auto=format&fit=crop&w=1200&q=80",
            colorName: "red",
            bgClass: "bg-red-600",
            hoverClass: "hover:bg-red-700",
            activeTabClass: "bg-red-600 text-white shadow-md",
            textClass: "text-red-600"
        },
        rides: {
            icon: <Car className="w-5 h-5" />,
            title: "Safe, Tracked Rides Across T&T",
            subtitle: "Real-time GPS tracking. Verified drivers. Flat rates—no surge pricing.",
            cta: "Book a Ride",
            features: ["Live Tracking", "Verified Drivers", "Fair Pricing"],
            heroImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
            colorName: "green",
            bgClass: "bg-green-600",
            hoverClass: "hover:bg-green-700",
            activeTabClass: "bg-green-600 text-white shadow-md",
            textClass: "text-green-600"
        },
        jobs: {
            icon: <Briefcase className="w-5 h-5" />,
            title: "Find Work. Hire Talent.",
            subtitle: "Connect with verified employers and skilled workers across Trinidad & Tobago.",
            cta: "Browse Jobs",
            features: ["AI Resume Builder", "5,000+ Active Jobs", "Instant Apply"],
            heroImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
            colorName: "blue",
            bgClass: "bg-blue-600",
            hoverClass: "hover:bg-blue-700",
            activeTabClass: "bg-blue-600 text-white shadow-md",
            textClass: "text-blue-600"
        },
        living: {
            icon: <Home className="w-5 h-5" />,
            title: "Find Your Next Home",
            subtitle: "No agent fees. Direct from owners. Verified listings across T&T.",
            cta: "Search Properties",
            features: ["No Agent Fees", "Virtual Tours", "Verified Owners"],
            heroImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
            colorName: "purple",
            bgClass: "bg-purple-600",
            hoverClass: "hover:bg-purple-700",
            activeTabClass: "bg-purple-600 text-white shadow-md",
            textClass: "text-purple-600"
        },
        events: {
            icon: <Ticket className="w-5 h-5" />,
            title: "Real Tickets. No Scalpers.",
            subtitle: "Secure event tickets with instant verification. From fetes to concerts.",
            cta: "Browse Events",
            features: ["Verified Tickets", "Instant Delivery", "Secure Payment"],
            heroImage: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80",
            colorName: "pink",
            bgClass: "bg-pink-600",
            hoverClass: "hover:bg-pink-700",
            activeTabClass: "bg-pink-600 text-white shadow-md",
            textClass: "text-pink-600"
        },
        triniworks: {
            icon: <Wrench className="w-5 h-5" />,
            title: "Hire Vetted Pros",
            subtitle: "Plumbers, electricians, mechanics—all verified. Book in minutes.",
            cta: "Find a Pro",
            features: ["Vetted Professionals", "Instant Booking", "Guaranteed Work"],
            heroImage: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80",
            colorName: "orange",
            bgClass: "bg-orange-600",
            hoverClass: "hover:bg-orange-700",
            activeTabClass: "bg-orange-600 text-white shadow-md",
            textClass: "text-orange-600"
        }
    };

    const currentService = services[selectedService];

    // Helper handling for navigation
    const handleCtaClick = () => {
        switch (selectedService) {
            case 'marketplace': navigate('/create-store'); break;
            case 'rides': navigate('/rides'); break;
            case 'jobs': navigate('/jobs'); break;
            case 'living': navigate('/real-estate'); break;
            case 'events': navigate('/tickets'); break;
            case 'triniworks': navigate('/jobs'); break; // Fallback for now/new route
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-50 flex flex-col">

            {/* TOP: Countdown Banner (KEEP) */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 sticky top-0 z-50 shadow-lg">
                <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm gap-2">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <span className="font-semibold flex items-center gap-1">
                            🎁 <span>FREE Lifetime Website + 10 Listings</span>
                        </span>
                        <div className="bg-white/20 px-2 py-0.5 rounded font-mono text-xs hidden sm:block">
                            ⏰ 34:32:05
                        </div>
                    </div>
                    <button className="bg-white text-red-700 px-4 py-1.5 rounded-full font-bold hover:bg-gray-100 transition-all text-xs shadow-sm uppercase tracking-wide">
                        Claim Offer
                    </button>
                </div>
            </div>

            {/* SERVICE SELECTOR TABS */}
            <div className="bg-white border-b sticky top-[48px] z-40 shadow-sm/50 backdrop-blur-md bg-white/90">
                <div className="container mx-auto px-4">
                    <div className="flex overflow-x-auto scrollbar-hide space-x-2 py-3 no-scrollbar">
                        {Object.entries(services).map(([key, service]: [string, any]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedService(key)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all text-sm border ${selectedService === key
                                        ? `${service.activeTabClass} border-transparent`
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                {service.icon}
                                <span className="capitalize">{key === 'triniworks' ? 'TriniWorks' : key}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ADAPTIVE HERO CONTENT */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedService}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="container mx-auto px-4 py-12 lg:py-20 flex-grow"
                >
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                        {/* LEFT: Dynamic Content */}
                        <div className="text-center lg:text-left">
                            {/* AI Badge - NEW */}
                            <div className="inline-flex items-center bg-white border border-gray-200 px-4 py-1.5 rounded-full mb-8 shadow-sm">
                                <Sparkles className="w-4 h-4 text-purple-600 mr-2 animate-pulse" />
                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                    AI-Powered • Setup in 90 Seconds
                                </span>
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                                {currentService.title}
                            </h1>

                            <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                {currentService.subtitle}
                            </p>

                            {/* Feature Pills */}
                            <div className="flex flex-wrap gap-2 mb-10 justify-center lg:justify-start">
                                {currentService.features.map((feature: string, idx: number) => (
                                    <div key={idx} className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 shadow-sm flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${currentService.bgClass}`}></div> {feature}
                                    </div>
                                ))}
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                                <button
                                    onClick={handleCtaClick}
                                    className={`px-8 py-4 ${currentService.bgClass} ${currentService.hoverClass} text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2`}
                                >
                                    {currentService.cta} <ArrowRight className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => setShowAIAssistant(true)}
                                    className="px-8 py-4 bg-white border-2 border-gray-200 rounded-xl font-bold text-lg text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center shadow-sm"
                                >
                                    <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                                    Ask AI Assistant
                                </button>
                            </div>

                            {/* Real-time Social Proof - ENHANCED */}
                            <div className="bg-white border p-3 rounded-xl shadow-sm inline-flex items-center max-w-md">
                                <div className="flex -space-x-3 mr-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + selectedService}`} alt="User" />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-gray-500">
                                        <strong className="text-gray-900">Sarah from Port of Spain</strong> just {selectedService === 'marketplace' ? 'launched a store' : selectedService === 'rides' ? 'booked a ride' : 'posted a job'}
                                    </p>
                                    <p className={`${currentService.textClass} text-xs font-bold mt-0.5 flex items-center gap-1`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span> 2 min ago
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Interactive Preview */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="relative hidden lg:block"
                        >
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-1 hover:rotate-0 transition-transform duration-500">
                                <img
                                    src={currentService.heroImage}
                                    alt={`${selectedService} preview`}
                                    className="w-full h-[600px] object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                                {/* Bottom Text Overlay */}
                                <div className="absolute bottom-8 left-8 text-white">
                                    <p className="font-bold text-lg">TriniBuild {selectedService === 'triniworks' ? 'TriniWorks' : selectedService.charAt(0).toUpperCase() + selectedService.slice(1)}</p>
                                    <p className="text-white/80 text-sm">Empowering Local Business</p>
                                </div>
                            </div>

                            {/* Floating Stats - Dynamic */}
                            <motion.div
                                animate={{ y: [-5, 5, -5] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -left-8 top-1/4 bg-white/95 backdrop-blur rounded-xl shadow-xl p-4 border border-gray-100"
                            >
                                <div className="text-3xl font-bold text-green-600">+127%</div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Success Rate</div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [5, -5, 5] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute -right-8 bottom-1/4 bg-white/95 backdrop-blur rounded-xl shadow-xl p-4 border border-gray-100"
                            >
                                <div className="text-3xl font-bold text-blue-600">0.8s</div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Load Time</div>
                            </motion.div>

                            {/* Live Activity Counter - NEW */}
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 whitespace-nowrap z-10 border border-gray-700">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <span className="font-semibold text-sm">127 active users right now</span>
                            </div>
                        </motion.div>

                    </div>
                </motion.div>
            </AnimatePresence>

            {/* AI ASSISTANT MODAL */}
            <AnimatePresence>
                {showAIAssistant && (
                    <AIAssistantModal
                        service={selectedService.charAt(0).toUpperCase() + selectedService.slice(1)}
                        onClose={() => setShowAIAssistant(false)}
                    />
                )}
            </AnimatePresence>

        </div>
    );
};
