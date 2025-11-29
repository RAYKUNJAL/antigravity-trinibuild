import React, { useState } from 'react';
import { DollarSign, Users, BarChart2, Link as LinkIcon, Copy, CheckCircle, Download, ArrowRight, Globe, TrendingUp, Shield } from 'lucide-react';
import { AffiliateStats, Payout, MarketingAsset } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AffiliateProgram: React.FC = () => {
   const [isRegistered, setIsRegistered] = useState(false);
   const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'assets' | 'payouts'>('overview');

   // Mock Data
   const stats: AffiliateStats = {
      totalClicks: 1245,
      conversions: 84,
      pendingCommission: 450,
      paidCommission: 1200,
      tier: 'Silver'
   };

   const chartData = [
      { name: 'Mon', clicks: 40, sales: 2 },
      { name: 'Tue', clicks: 55, sales: 4 },
      { name: 'Wed', clicks: 30, sales: 1 },
      { name: 'Thu', clicks: 70, sales: 8 },
      { name: 'Fri', clicks: 95, sales: 12 },
      { name: 'Sat', clicks: 120, sales: 15 },
      { name: 'Sun', clicks: 85, sales: 9 },
   ];

   const assets: MarketingAsset[] = [
      { id: '1', title: 'Instagram Story (Store Launch)', type: 'Social', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800', copy: "Launch your free online store today with TriniBuild! 🇹🇹 10 Free Listings. No Credit Card. Link in bio! #TriniBusiness" },
      { id: '2', title: 'WhatsApp Status (Driver)', type: 'Social', url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800', copy: "Drive and earn on your own schedule. Keep 85% of fares with TriniBuild Go. DM me for signup link!" },
      { id: '3', title: 'Web Banner (300x250)', type: 'Banner', url: 'https://via.placeholder.com/300x250/CE1126/FFFFFF?text=Start+Selling+Free', copy: "" },
   ];

   const payouts: Payout[] = [
      { id: 'TX-992', date: 'Oct 01, 2025', amount: 450, status: 'Paid' },
      { id: 'TX-884', date: 'Sep 01, 2025', amount: 320, status: 'Paid' },
      { id: 'TX-771', date: 'Aug 01, 2025', amount: 430, status: 'Paid' },
   ];

   const handleRegister = () => {
      // Simulate signup
      setIsRegistered(true);
   };

   if (!isRegistered) {
      return (
         <div className="min-h-screen bg-white font-sans">
            {/* Hero */}
            <div className="bg-trini-black text-white py-24 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-trini-red/20 to-transparent"></div>
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                  <span className="text-yellow-400 font-bold tracking-widest uppercase text-sm mb-4 block">TriniBuild Partner Program</span>
                  <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                     Turn Your Network <br /> Into <span className="text-trini-red">Passive Income.</span>
                  </h1>
                  <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                     Earn <strong>20% recurring commissions</strong> on every store you refer. Plus TT$100 for every verified driver. The most lucrative affiliate program in the Caribbean.
                  </p>
                  <button onClick={handleRegister} className="bg-white text-trini-black px-10 py-4 rounded-full font-extrabold text-lg hover:bg-gray-100 shadow-2xl transform hover:scale-105 transition-all">
                     Start Earning Now
                  </button>
               </div>
            </div>

            {/* Tiers */}
            <div className="py-20 bg-gray-50">
               <div className="max-w-6xl mx-auto px-4">
                  <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">How You Earn</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-blue-500 hover:-translate-y-2 transition-transform">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600 mx-auto">
                           <Users className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">Refer Merchants</h3>
                        <p className="text-4xl font-extrabold text-center text-gray-900 mb-2">20%</p>
                        <p className="text-center text-gray-500 text-sm mb-6">Recurring Lifetime Commission</p>
                        <p className="text-gray-600 text-sm text-center">If a store pays $299/mo, you get <strong>$60/mo</strong>. Build a portfolio of just 10 stores and earn $600/mo passive.</p>
                     </div>
                     <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-yellow-500 hover:-translate-y-2 transition-transform scale-105 z-10">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-yellow-600 mx-auto">
                           <Users className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">Refer Drivers</h3>
                        <p className="text-4xl font-extrabold text-center text-gray-900 mb-2">TT$100</p>
                        <p className="text-center text-gray-500 text-sm mb-6">Per Verified Driver</p>
                        <p className="text-gray-600 text-sm text-center">Help us grow our driver network. Earn a flat fee for every driver you refer who completes their first 5 trips.</p>
                     </div>
                     <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-green-500 hover:-translate-y-2 transition-transform">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 mx-auto">
                           <Globe className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">Expand Globally</h3>
                        <p className="text-4xl font-extrabold text-center text-gray-900 mb-2">Coming Soon</p>
                        <p className="text-center text-gray-500 text-sm mb-6">New Markets</p>
                        <p className="text-gray-600 text-sm text-center">As TriniBuild expands, so do your opportunities. Get early access to new market referral programs.</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Features */}
            <div className="py-20 bg-white">
               <div className="max-w-6xl mx-auto px-4">
                  <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">Why Partner with TriniBuild?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="text-center p-6 rounded-xl">
                        <DollarSign className="h-12 w-12 text-trini-red mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Highest Commissions</h3>
                        <p className="text-gray-600">We offer the most competitive recurring commissions in the Caribbean market.</p>
                     </div>
                     <div className="text-center p-6 rounded-xl">
                        <BarChart2 className="h-12 w-12 text-trini-red mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Real-time Tracking</h3>
                        <p className="text-gray-600">Monitor your clicks, conversions, and earnings with our intuitive dashboard.</p>
                     </div>
                     <div className="text-center p-6 rounded-xl">
                        <Download className="h-12 w-12 text-trini-red mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Marketing Assets</h3>
                        <p className="text-gray-600">Access a library of banners, social media posts, and copy to boost your referrals.</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* CTA */}
            <div className="bg-trini-black text-white py-20 text-center">
               <h2 className="text-4xl font-extrabold mb-4">Ready to Start Earning?</h2>
               <p className="text-xl text-gray-300 mb-8">Join the TriniBuild Partner Program today and unlock your earning potential.</p>
               <button onClick={handleRegister} className="bg-trini-red text-white px-10 py-4 rounded-full font-extrabold text-lg hover:bg-red-700 shadow-2xl transform hover:scale-105 transition-all">
                  Sign Up Now <ArrowRight className="inline-block ml-2 h-5 w-5" />
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gray-100 font-sans">
         <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-trini-black text-white fixed h-full hidden md:block">
               <div className="p-6">
                  <h2 className="text-2xl font-bold mb-1">Partner<span className="text-trini-red">Hub</span></h2>
                  <p className="text-gray-400 text-xs">Affiliate ID: #TB-8821</p>
               </div>
               <nav className="mt-6">
                  {[
                     { id: 'overview', icon: BarChart2, label: 'Dashboard' },
                     { id: 'links', icon: LinkIcon, label: 'Link Generator' },
                     { id: 'assets', icon: Download, label: 'Marketing Assets' },
                     { id: 'payouts', icon: DollarSign, label: 'Payouts' },
                  ].map(item => {
                     const Icon = item.icon;
                     return (
                        <button
                           key={item.id}
                           onClick={() => setActiveTab(item.id as any)}
                           className={`w-full flex items-center px-6 py-4 transition-colors border-l-4 ${activeTab === item.id ? 'bg-gray-800 border-trini-red text-white' : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                           <Icon className="h-5 w-5 mr-3" /> {item.label}
                        </button>
                     );
                  })}
               </nav>
            </div>

            {/* Main Content */}
            <div className="flex-grow md:ml-64 p-8">
               {/* Header */}
               <div className="flex justify-between items-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h1>
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">Unpaid Balance</p>
                        <p className="text-xl font-extrabold text-green-600">TT$ {stats.pendingCommission}</p>
                     </div>
                     <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                        JD
                     </div>
                  </div>
               </div>

               {/* OVERVIEW TAB */}
               {activeTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in">
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <p className="text-xs text-gray-500 uppercase font-bold">Total Clicks</p>
                           <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalClicks}</h3>
                           <span className="text-xs text-green-600 font-bold flex items-center mt-2"><TrendingUp className="h-3 w-3 mr-1" /> +12% this week</span>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <p className="text-xs text-gray-500 uppercase font-bold">Conversions</p>
                           <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.conversions}</h3>
                           <span className="text-xs text-green-600 font-bold flex items-center mt-2"><CheckCircle className="h-3 w-3 mr-1" /> 6.7% Conv. Rate</span>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <p className="text-xs text-gray-500 uppercase font-bold">Lifetime Earnings</p>
                           <h3 className="text-3xl font-bold text-gray-900 mt-1">TT${stats.paidCommission}</h3>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
                           <Shield className="absolute top-4 right-4 h-16 w-16 opacity-20" />
                           <p className="text-xs uppercase font-bold opacity-90">Current Tier</p>
                           <h3 className="text-3xl font-bold mt-1">{stats.tier}</h3>
                           <p className="text-xs mt-2 font-medium">16 sales to Gold (30% comm)</p>
                        </div>
                     </div>

                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
                        <h3 className="font-bold text-gray-900 mb-6">Performance</h3>
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData}>
                              <defs>
                                 <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#CE1126" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#CE1126" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} />
                              <YAxis axisLine={false} tickLine={false} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <Tooltip />
                              <Area type="monotone" dataKey="sales" stroke="#CE1126" fillOpacity={1} fill="url(#colorSales)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               )}

               {/* LINKS TAB */}
               {activeTab === 'links' && (
                  <div className="animate-in fade-in">
                     <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
                        <h3 className="font-bold text-lg mb-4">Create Tracking Link</h3>
                        <div className="flex flex-col md:flex-row gap-4">
                           <select className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                              <option>Homepage (General)</option>
                              <option>Store Creator (Merchants)</option>
                              <option>Driver Signup (Rides)</option>
                              <option>Pricing Page</option>
                           </select>
                           <div className="flex-grow relative">
                              <input type="text" readOnly value="https://trinibuild.com/?ref=TB-8821" className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" />
                              <button className="absolute right-2 top-2 p-1.5 hover:bg-gray-200 rounded text-gray-500" onClick={() => alert("Copied!")}>
                                 <Copy className="h-5 w-5" />
                              </button>
                           </div>
                           <button className="bg-trini-red text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700">Generate</button>
                        </div>
                     </div>

                     <h3 className="font-bold text-lg mb-4">Your Active Links</h3>
                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                              <tr>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Target</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Link</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Clicks</th>
                                 <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200">
                              <tr>
                                 <td className="px-6 py-4 font-bold">Default</td>
                                 <td className="px-6 py-4 text-blue-600 text-sm">trinibuild.com/?ref=TB-8821</td>
                                 <td className="px-6 py-4">842</td>
                                 <td className="px-6 py-4 text-right"><button className="text-gray-400 hover:text-gray-600"><Copy className="h-4 w-4" /></button></td>
                              </tr>
                              <tr>
                                 <td className="px-6 py-4 font-bold">Instagram Bio</td>
                                 <td className="px-6 py-4 text-blue-600 text-sm">trinibuild.com/create-store?ref=TB-8821</td>
                                 <td className="px-6 py-4">403</td>
                                 <td className="px-6 py-4 text-right"><button className="text-gray-400 hover:text-gray-600"><Copy className="h-4 w-4" /></button></td>
                              </tr>
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {/* ASSETS TAB */}
               {activeTab === 'assets' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                     {assets.map(asset => (
                        <div key={asset.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                           <div className="h-48 bg-gray-100 relative overflow-hidden">
                              <img src={asset.url} className="w-full h-full object-cover" alt="Asset" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="bg-white text-black px-4 py-2 rounded-full font-bold flex items-center text-sm">
                                    <Download className="h-4 w-4 mr-2" /> Download
                                 </button>
                              </div>
                           </div>
                           <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                 <h4 className="font-bold text-gray-900">{asset.title}</h4>
                                 <span className="text-[10px] uppercase font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">{asset.type}</span>
                              </div>
                              {asset.copy && (
                                 <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs text-gray-600 mb-3">
                                    "{asset.copy}"
                                 </div>
                              )}
                              <button className="w-full border border-gray-300 py-2 rounded font-bold text-sm hover:bg-gray-50 text-gray-600" onClick={() => alert("Copy text copied!")}>
                                 Copy Caption
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {/* PAYOUTS TAB */}
               {activeTab === 'payouts' && (
                  <div className="animate-in fade-in">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex justify-between items-center">
                        <div>
                           <h3 className="font-bold text-lg mb-1">Banking Details</h3>
                           <p className="text-sm text-gray-500">Republic Bank •••• 4521</p>
                        </div>
                        <button className="text-blue-600 font-bold text-sm hover:underline">Edit</button>
                     </div>

                     <h3 className="font-bold text-lg mb-4">Payout History</h3>
                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                              <tr>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Transaction ID</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                                 <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Status</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200">
                              {payouts.map(p => (
                                 <tr key={p.id}>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{p.id}</td>
                                    <td className="px-6 py-4 text-sm">{p.date}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">TT${p.amount}</td>
                                    <td className="px-6 py-4 text-right">
                                       <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">{p.status}</span>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};
