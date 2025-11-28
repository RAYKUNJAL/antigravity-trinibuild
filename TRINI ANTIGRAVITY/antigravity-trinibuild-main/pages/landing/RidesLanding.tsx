import React from 'react';
import { ArrowRight, Car, Shield, Clock, DollarSign, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RidesLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HERO */}
      <div className="relative bg-trini-black text-white h-[90vh] flex items-center overflow-hidden">
         {/* Video Background Placeholder */}
         <div className="absolute inset-0 z-0 opacity-40">
            <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Driving" />
         </div>
         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>
         
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
            <div className="max-w-2xl">
               <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                  Drive on <br/><span className="text-yellow-500">Your Terms.</span>
               </h1>
               <p className="text-xl text-gray-300 mb-10">
                  Whether you have a car, a van, or a bike. Turn your vehicle into a revenue machine with TriniBuild Go. The lowest commissions in the Caribbean.
               </p>
               <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/drive/signup" className="bg-yellow-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors shadow-lg flex items-center justify-center">
                     Start Driving <Car className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/rides" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-black transition-colors flex items-center justify-center">
                     Book a Ride
                  </Link>
               </div>
            </div>
         </div>
      </div>

      {/* VIDEO SALES LETTER SECTION */}
      <div className="bg-yellow-50 py-20">
         <div className="max-w-5xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col md:flex-row">
               <div className="md:w-1/2 bg-gray-100 relative group cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Driver Video" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-all">
                     <div className="bg-white rounded-full p-4 shadow-lg">
                        <Play className="h-8 w-8 text-trini-black ml-1" />
                     </div>
                  </div>
               </div>
               <div className="md:w-1/2 p-10 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Why drive with us?</h2>
                  <p className="text-gray-600 mb-6">
                     Other apps take 25-30% of your hard-earned money. TriniBuild Go is built differently. We believe the person behind the wheel deserves the lion's share.
                  </p>
                  <ul className="space-y-4 mb-8">
                     <li className="flex items-center font-bold text-gray-800">
                        <DollarSign className="h-5 w-5 text-green-600 mr-3" /> Keep 85% of every fare
                     </li>
                     <li className="flex items-center font-bold text-gray-800">
                        <Clock className="h-5 w-5 text-blue-600 mr-3" /> Instant Payouts (Daily)
                     </li>
                     <li className="flex items-center font-bold text-gray-800">
                        <Shield className="h-5 w-5 text-red-600 mr-3" /> Verified Rider ID System
                     </li>
                  </ul>
                  <Link to="/drive/signup" className="text-yellow-600 font-bold text-lg hover:underline flex items-center">
                     See Driver Requirements <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
               </div>
            </div>
         </div>
      </div>

      {/* FOR RIDERS */}
      <div className="py-24 bg-white text-center">
         <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Need a lift?</h2>
            <p className="text-xl text-gray-500 mb-10">
               From Port of Spain to Point Fortin. Safe, tracked, and reliable transport at the tap of a button.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100">
                  <div className="bg-yellow-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-700">
                     <Car className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Standard Rides</h3>
                  <p className="text-sm text-gray-500">Affordable daily commute.</p>
               </div>
               <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100">
                  <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-700">
                     <Shield className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">H-Taxi Verified</h3>
                  <p className="text-sm text-gray-500">Registered H-cars only.</p>
               </div>
               <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100">
                  <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-green-700">
                     <DollarSign className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Cash or Card</h3>
                  <p className="text-sm text-gray-500">Pay how you want.</p>
               </div>
            </div>
            <div className="mt-12">
               <Link to="/rides" className="bg-gray-900 text-white px-10 py-4 rounded-full font-bold hover:bg-gray-800 shadow-lg">
                  Book Now
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
};
