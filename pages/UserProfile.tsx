
import React, { useState } from 'react';
import { User, Package, Car, Ticket, Heart, CreditCard, Settings, LogOut, MapPin, Clock, ChevronRight, Shield, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

export const UserProfile: React.FC = () => {
   const [activeTab, setActiveTab] = useState('overview');
   const [isLoggingOut, setIsLoggingOut] = useState(false);

   const handleLogout = async () => {
      setIsLoggingOut(true);
      try {
         await authService.logout();
      } catch (error) {
         console.error('Logout error:', error);
         setIsLoggingOut(false);
      }
   };

   const orders = [
      { id: '#ORD-9921', store: "Aunty May's Roti Shop", items: "2x Boneless Goat, 1x Apple J", total: 98, status: 'Delivered', date: 'Oct 12, 2025' },
      { id: '#ORD-9904', store: "Tech Giants TT", items: "Samsung Charger Type-C", total: 150, status: 'Processing', date: 'Oct 14, 2025' },
   ];

   const rides = [
      { id: 'R-221', type: 'TriniRide', from: 'Port of Spain', to: 'Maraval', cost: 35, date: 'Oct 10, 2025', rating: 5 },
      { id: 'R-198', type: 'H-Taxi', from: 'City Gate', to: 'Chaguanas', cost: 25, date: 'Oct 08, 2025', rating: 4 },
   ];

   return (
      <div className="min-h-screen bg-gray-50 py-8 font-sans">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8">

               {/* Sidebar */}
               <div className="w-full md:w-72 flex-shrink-0">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                     <div className="p-6 text-center border-b border-gray-100 bg-trini-black text-white">
                        <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center border-4 border-trini-red">
                           <User className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="font-bold text-xl">Ray Kunjal</h2>
                        <p className="text-gray-400 text-sm">Member since 2024</p>
                        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/50">
                           <Shield className="h-3 w-3 mr-1" /> Gold Member
                        </div>
                     </div>

                     <nav className="p-4 space-y-1">
                        {[
                           { id: 'overview', label: 'Overview', icon: User },
                           { id: 'orders', label: 'My Orders', icon: Package },
                           { id: 'rides', label: 'Ride History', icon: Car },
                           { id: 'wallet', label: 'Wallet & Credits', icon: CreditCard },
                           { id: 'saved', label: 'Saved Items', icon: Heart },
                           { id: 'settings', label: 'Account Settings', icon: Settings },
                        ].map(item => (
                           <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors font-medium text-sm ${activeTab === item.id ? 'bg-red-50 text-trini-red' : 'text-gray-600 hover:bg-gray-50'
                                 }`}
                           >
                              <item.icon className="h-4 w-4 mr-3" /> {item.label}
                           </button>
                        ))}
                        <button
                           onClick={handleLogout}
                           disabled={isLoggingOut}
                           className="w-full flex items-center px-4 py-3 rounded-lg transition-colors font-medium text-sm text-red-600 hover:bg-red-50 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {isLoggingOut ? <Loader2 className="h-4 w-4 mr-3 animate-spin" /> : <LogOut className="h-4 w-4 mr-3" />}
                           {isLoggingOut ? 'Logging out...' : 'Log Out'}
                        </button>
                     </nav>
                  </div>
               </div>

               {/* Content Area */}
               <div className="flex-grow">

                  {activeTab === 'overview' && (
                     <div className="space-y-6 animate-in fade-in">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                              <p className="text-xs text-gray-500 uppercase font-bold">Total Spent</p>
                              <p className="text-2xl font-extrabold text-gray-900 mt-1">TT$ 1,240</p>
                           </div>
                           <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                              <p className="text-xs text-gray-500 uppercase font-bold">Orders</p>
                              <p className="text-2xl font-extrabold text-gray-900 mt-1">12</p>
                           </div>
                           <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                              <p className="text-xs text-gray-500 uppercase font-bold">Rides Taken</p>
                              <p className="text-2xl font-extrabold text-gray-900 mt-1">28</p>
                           </div>
                           <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                              <p className="text-xs text-gray-500 uppercase font-bold">Points</p>
                              <p className="text-2xl font-extrabold text-purple-600 mt-1">450</p>
                           </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                           <h3 className="font-bold text-lg text-gray-900 mb-4">Recent Activity</h3>
                           <div className="space-y-4">
                              {orders.slice(0, 1).map(order => (
                                 <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                       <div className="bg-green-100 p-2 rounded-full mr-4 text-green-600"><Package className="h-5 w-5" /></div>
                                       <div>
                                          <p className="font-bold text-gray-900">{order.store}</p>
                                          <p className="text-xs text-gray-500">{order.date}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="font-bold">TT${order.total}</p>
                                       <p className="text-xs text-green-600 font-bold">{order.status}</p>
                                    </div>
                                 </div>
                              ))}
                              {rides.slice(0, 1).map(ride => (
                                 <div key={ride.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                       <div className="bg-yellow-100 p-2 rounded-full mr-4 text-yellow-600"><Car className="h-5 w-5" /></div>
                                       <div>
                                          <p className="font-bold text-gray-900">Ride to {ride.to}</p>
                                          <p className="text-xs text-gray-500">{ride.date}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="font-bold">TT${ride.cost}</p>
                                       <p className="text-xs text-gray-500">{ride.type}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  )}

                  {activeTab === 'orders' && (
                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in">
                        <div className="p-6 border-b border-gray-200">
                           <h3 className="font-bold text-lg">Order History</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                           {orders.map(order => (
                              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                                 <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center">
                                       <span className="text-sm font-mono text-gray-500 mr-3">{order.id}</span>
                                       <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                          {order.status}
                                       </span>
                                    </div>
                                    <span className="text-sm text-gray-500">{order.date}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <div>
                                       <h4 className="font-bold text-gray-900">{order.store}</h4>
                                       <p className="text-sm text-gray-600">{order.items}</p>
                                    </div>
                                    <p className="font-extrabold text-lg">TT${order.total}</p>
                                 </div>
                                 <div className="mt-4 flex gap-2">
                                    <button className="text-sm font-bold text-trini-red hover:underline">View Details</button>
                                    <span className="text-gray-300">|</span>
                                    <button className="text-sm font-bold text-gray-500 hover:text-gray-900">Reorder</button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {activeTab === 'wallet' && (
                     <div className="space-y-6 animate-in fade-in">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-8 opacity-10"><CreditCard className="h-32 w-32" /></div>
                           <p className="text-gray-400 text-sm uppercase font-bold mb-1">TriniBuild Credits</p>
                           <h2 className="text-4xl font-extrabold mb-6">TT$ 45.00</h2>
                           <div className="flex gap-4 relative z-10">
                              <button className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors text-sm">Top Up</button>
                              <button className="bg-white/10 text-white px-6 py-2 rounded-lg font-bold hover:bg-white/20 transition-colors text-sm border border-white/20">Send Gift</button>
                           </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                           <h3 className="font-bold text-lg mb-4">Saved Payment Methods</h3>
                           <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-3">
                              <div className="flex items-center">
                                 <div className="bg-blue-50 p-2 rounded mr-3"><CreditCard className="h-5 w-5 text-blue-600" /></div>
                                 <div>
                                    <p className="font-bold text-sm">Visa ending in 4242</p>
                                    <p className="text-xs text-gray-500">Expires 12/28</p>
                                 </div>
                              </div>
                              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Default</span>
                           </div>
                           <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 font-bold hover:bg-gray-50 text-sm">
                              + Add New Card
                           </button>
                        </div>
                     </div>
                  )}

               </div>
            </div>
         </div>
      </div>
   );
};
