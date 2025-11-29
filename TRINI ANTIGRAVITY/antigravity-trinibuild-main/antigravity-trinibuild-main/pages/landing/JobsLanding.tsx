
import React from 'react';
import { Briefcase, Search, CheckCircle, Star, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export const JobsLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HERO */}
      <div className="bg-purple-900 text-white py-24 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-1/2 h-full bg-purple-800 transform skew-x-12 translate-x-20"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center">
            <div className="flex-1 mb-10 lg:mb-0">
               <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                  Stop Searching.<br/>
                  <span className="text-purple-300">Start Working.</span>
               </h1>
               <p className="text-xl text-purple-100 mb-8 max-w-xl">
                  TriniWorks connects skilled professionals with the businesses and homeowners who need them most. No middleman, just connection.
               </p>
               <div className="flex gap-4">
                  <Link to="/work/profile" className="bg-white text-purple-900 px-8 py-3 rounded-lg font-bold hover:bg-purple-50 transition-colors shadow-lg">
                     I want to Work
                  </Link>
                  <Link to="/jobs" className="bg-purple-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-600 transition-colors shadow-lg">
                     I need to Hire
                  </Link>
               </div>
            </div>
            <div className="flex-1 w-full max-w-lg">
               <div className="bg-white rounded-2xl p-6 shadow-2xl text-gray-900">
                  <div className="flex items-center mb-6">
                     <img src="https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=200&auto=format&fit=crop" className="w-16 h-16 rounded-full mr-4 border-4 border-purple-100 object-cover" alt="Pro" />
                     <div>
                        <h3 className="font-bold text-lg">Amanda K.</h3>
                        <p className="text-purple-600 text-sm font-bold">Graphic Designer</p>
                        <div className="flex text-yellow-400 text-xs">★★★★★ (42 Reviews)</div>
                     </div>
                  </div>
                  <p className="text-gray-600 italic mb-4">"Within 24 hours of creating my profile, I landed a contract with a major retailer in POS. This platform actually works."</p>
                  <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                     <span className="text-xs text-gray-400">Member since 2025</span>
                     <span className="text-green-600 font-bold text-sm">Verified Pro ✅</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* VIDEO EXPLAINER */}
      <div className="py-20 bg-gray-50">
         <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">How TriniWorks Changes the Game</h2>
            <div className="aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden relative group cursor-pointer mx-auto mb-12">
               <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-20 h-20 text-white opacity-80 group-hover:scale-110 transition-transform" />
               </div>
               <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="Video thumbnail" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
               <div>
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-purple-700">
                     <Search className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Smart Matching</h3>
                  <p className="text-gray-600 text-sm">Our AI matches your skills to jobs instantly. No more scrolling through irrelevant ads.</p>
               </div>
               <div>
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-purple-700">
                     <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Verified Trust</h3>
                  <p className="text-gray-600 text-sm">Both employers and workers are verified. Reviews keep the community safe and professional.</p>
               </div>
               <div>
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-purple-700">
                     <Briefcase className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Zero Friction</h3>
                  <p className="text-gray-600 text-sm">Apply with one click. Chat directly. Get hired faster than ever before.</p>
               </div>
            </div>
         </div>
      </div>

      {/* CATEGORIES */}
      <div className="py-20 bg-white">
         <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Popular Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {['Construction', 'Plumbing', 'Web Design', 'Accounting', 'Cleaning', 'Driving', 'Catering', 'Education'].map(cat => (
                  <Link key={cat} to="/jobs" className="bg-gray-50 p-4 rounded-xl text-center hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium text-gray-700">
                     {cat}
                  </Link>
               ))}
            </div>
            <div className="mt-12 text-center">
               <Link to="/work/profile" className="inline-flex items-center text-purple-700 font-bold text-lg hover:underline">
                  Create your professional profile <ArrowRight className="ml-2 h-5 w-5" />
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
};
