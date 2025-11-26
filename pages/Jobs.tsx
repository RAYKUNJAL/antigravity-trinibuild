import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Search, Filter, Clock, DollarSign, Building, ArrowRight, Plus, Star, ShieldCheck, Wrench, Zap, Droplets, Paintbrush, Truck, Camera, ChevronRight, X, CheckCircle, AlertCircle, HardHat } from 'lucide-react';
import { proService, ServicePro } from '../services/proService';
import { ChatWidget } from '../components/ChatWidget';
import { AdSpot } from '../components/AdSpot';

export const Jobs: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'services' | 'jobs'>('services');
   const [pros, setPros] = useState<ServicePro[]>([]);
   const [selectedCategory, setSelectedCategory] = useState('All');
   const [selectedPro, setSelectedPro] = useState<ServicePro | null>(null);
   const [showQuoteModal, setShowQuoteModal] = useState(false);
   const [quoteForm, setQuoteForm] = useState({ name: '', phone: '', details: '' });

   // Job Board State (Legacy)
   const [localJobs, setLocalJobs] = useState<any[]>([]);
   const initialJobs = [
      { id: 1, title: "Store Manager", company: "Pennywise Cosmetics", type: "Full-time", location: "Chaguanas", salary: "$5,000 - $7,000/mth", posted: "2d ago" },
      { id: 2, title: "Delivery Driver", company: "TriniRides", type: "Contract", location: "Port of Spain", salary: "$200/trip", posted: "5h ago" },
      { id: 3, title: "Web Developer", company: "TriniBuild", type: "Remote", location: "Anywhere", salary: "$15,000/mth", posted: "1w ago" },
   ];

   useEffect(() => {
      const loadData = async () => {
         const proData = await proService.getPros();
         setPros(proData);
         const storedJobs = JSON.parse(localStorage.getItem('posted_jobs') || '[]');
         setLocalJobs(storedJobs);
      };
      loadData();
   }, []);

   const handleQuoteSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Quote request sent to ${selectedPro?.name}! They will contact you shortly.`);
      setShowQuoteModal(false);
      setQuoteForm({ name: '', phone: '', details: '' });
   };

   const categories = [
      { id: 'Plumbing', icon: Droplets, color: 'bg-blue-100 text-blue-600' },
      { id: 'Electrical', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
      { id: 'Cleaning', icon: SparklesIcon, color: 'bg-purple-100 text-purple-600' }, // Defined below
      { id: 'Construction', icon: HardHat, color: 'bg-orange-100 text-orange-600' },
      { id: 'Events', icon: Camera, color: 'bg-pink-100 text-pink-600' },
      { id: 'Tech Support', icon: Wrench, color: 'bg-gray-100 text-gray-600' },
   ];

   const filteredPros = selectedCategory === 'All' ? pros : pros.filter(p => p.category === selectedCategory || p.services.some(s => s.includes(selectedCategory)));
   const allJobs = [...localJobs, ...initialJobs];

   return (
      <div className="min-h-screen bg-gray-50 font-sans">

         {/* Hero Section */}
         <div className="bg-trini-black text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581578731117-104f2a8d23e9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 text-center">
               <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                  Hire Top <span className="text-trini-teal">Pros</span> in T&T
               </h1>
               <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
                  From plumbing to party planning, find trusted professionals for any project.
               </p>

               {/* Search Bar */}
               <div className="max-w-3xl mx-auto bg-white rounded-full p-2 flex shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <div className="flex-grow flex items-center px-6 border-r border-gray-200">
                     <Search className="h-6 w-6 text-gray-400 mr-3" />
                     <input type="text" placeholder="What do you need done?" className="w-full h-12 outline-none text-gray-800 text-lg placeholder-gray-500" />
                  </div>
                  <div className="hidden sm:flex items-center px-6 w-1/3">
                     <MapPin className="h-6 w-6 text-gray-400 mr-3" />
                     <input type="text" placeholder="Zip Code" className="w-full h-12 outline-none text-gray-800 text-lg placeholder-gray-500" />
                  </div>
                  <button className="bg-trini-teal text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-teal-600 transition-colors shadow-lg">
                     Search
                  </button>
               </div>

               {/* Toggle Tabs */}
               <div className="flex justify-center mt-12 gap-4">
                  <button
                     onClick={() => setActiveTab('services')}
                     className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'services' ? 'bg-white text-trini-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                     Find a Pro
                  </button>
                  <button
                     onClick={() => setActiveTab('jobs')}
                     className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'jobs' ? 'bg-white text-trini-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                     Find a Job
                  </button>
               </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <AdSpot page="jobs" slot="top" className="mb-8" />

            {activeTab === 'services' ? (
               <div className="animate-in fade-in slide-in-from-bottom-4">
                  {/* Categories Grid */}
                  <div className="mb-12">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Services</h2>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((cat) => (
                           <button
                              key={cat.id}
                              onClick={() => setSelectedCategory(cat.id === selectedCategory ? 'All' : cat.id)}
                              className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-3 hover:shadow-md ${selectedCategory === cat.id ? 'border-trini-teal bg-teal-50 ring-2 ring-trini-teal ring-opacity-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                           >
                              <div className={`p-3 rounded-full ${cat.color}`}>
                                 <cat.icon className="h-6 w-6" />
                              </div>
                              <span className="font-bold text-sm text-gray-700">{cat.id}</span>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Pros List */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Sidebar Ad / Filter */}
                     <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
                           <ShieldCheck className="h-12 w-12 mb-4 text-blue-200" />
                           <h3 className="text-xl font-bold mb-2">TriniBuild Guarantee</h3>
                           <p className="text-blue-100 text-sm mb-4">Hire with confidence. Verified Pros are background checked and insured.</p>
                           <button className="w-full bg-white text-blue-700 font-bold py-2 rounded-lg hover:bg-blue-50 transition-colors">
                              Learn More
                           </button>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                           <h3 className="font-bold text-gray-900 mb-4">Are you a Pro?</h3>
                           <p className="text-gray-600 text-sm mb-4">Join thousands of pros growing their business on TriniBuild.</p>
                           <ul className="space-y-2 text-sm text-gray-500 mb-6">
                              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Get qualified leads</li>
                              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Build your reputation</li>
                              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Zero upfront fees</li>
                           </ul>
                           <button className="w-full border-2 border-trini-black text-trini-black font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors">
                              Join as a Pro
                           </button>
                        </div>
                     </div>

                     {/* Main List */}
                     <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                           <h2 className="text-xl font-bold text-gray-900">{selectedCategory === 'All' : 'Top Rated Pros' : `${selectedCategory} Pros`}</h2>
                           <span className="text-sm text-gray-500">{filteredPros.length} results</span>
                        </div>

                        {filteredPros.map((pro) => (
                           <div key={pro.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all group relative overflow-hidden">
                              {pro.isPromoted && (
                                 <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                                    Promoted
                                 </div>
                              )}
                              <div className="flex flex-col sm:flex-row gap-6">
                                 <div className="flex-shrink-0 relative">
                                    <img src={pro.image} alt={pro.name} className="w-24 h-24 rounded-xl object-cover shadow-sm" />
                                    {pro.isVerified && (
                                       <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1 rounded-full border-2 border-white" title="Verified Pro">
                                          <ShieldCheck className="h-4 w-4" />
                                       </div>
                                    )}
                                 </div>
                                 <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                       <div>
                                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-trini-teal transition-colors flex items-center gap-2">
                                             {pro.businessName}
                                          </h3>
                                          <div className="flex items-center gap-2 mt-1">
                                             <div className="flex items-center text-yellow-400">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span className="text-gray-900 font-bold ml-1">{pro.rating}</span>
                                             </div>
                                             <span className="text-gray-400 text-sm">({pro.reviewCount} reviews)</span>
                                          </div>
                                       </div>
                                       <div className="text-right hidden sm:block">
                                          <p className="text-lg font-bold text-gray-900">{pro.hourlyRate}</p>
                                          <p className="text-xs text-gray-500">Est. Price</p>
                                       </div>
                                    </div>

                                    <p className="text-gray-600 text-sm mt-3 line-clamp-2">{pro.description}</p>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                       {pro.badges.map(badge => (
                                          <span key={badge} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
                                             {badge}
                                          </span>
                                       ))}
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                       <button
                                          onClick={() => { setSelectedPro(pro); setShowQuoteModal(true); }}
                                          className="flex-1 bg-trini-teal text-white py-2 rounded-lg font-bold hover:bg-teal-600 transition-colors shadow-md"
                                       >
                                          Get a Quote
                                       </button>
                                       <button className="px-4 py-2 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50">
                                          View Profile
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            ) : (
               <div className="animate-in fade-in slide-in-from-bottom-4">
                  {/* Legacy Job Board UI */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-4">Looking for Employment?</h2>
                     <p className="text-gray-600 mb-6">Browse hundreds of full-time and part-time job listings.</p>

                     <div className="space-y-4 text-left max-w-3xl mx-auto">
                        {allJobs.map(job => (
                           <div key={job.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-trini-teal transition-colors cursor-pointer">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                                    <p className="text-gray-600">{job.company} • {job.location}</p>
                                 </div>
                                 <span className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-bold text-gray-600">{job.type}</span>
                              </div>
                              <div className="mt-4 flex justify-between items-center">
                                 <span className="text-sm font-medium text-green-600">{job.salary}</span>
                                 <span className="text-xs text-gray-400">{job.posted}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Quote Modal */}
         {showQuoteModal && selectedPro && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95">
                  <button onClick={() => setShowQuoteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                     <X className="h-6 w-6" />
                  </button>

                  <div className="text-center mb-6">
                     <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 overflow-hidden">
                        <img src={selectedPro.image} alt={selectedPro.name} className="w-full h-full object-cover" />
                     </div>
                     <h2 className="text-xl font-bold text-gray-900">Get a Quote from {selectedPro.businessName}</h2>
                     <p className="text-sm text-gray-500">Response time: Usually within 1 hour</p>
                  </div>

                  <form onSubmit={handleQuoteSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                        <input
                           type="text" required
                           value={quoteForm.name}
                           onChange={e => setQuoteForm({ ...quoteForm, name: e.target.value })}
                           className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-teal outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                        <input
                           type="tel" required
                           value={quoteForm.phone}
                           onChange={e => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                           className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-teal outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Project Details</label>
                        <textarea
                           rows={3} required
                           placeholder="Describe what you need done..."
                           value={quoteForm.details}
                           onChange={e => setQuoteForm({ ...quoteForm, details: e.target.value })}
                           className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-teal outline-none"
                        ></textarea>
                     </div>

                     <div className="bg-yellow-50 p-3 rounded-lg flex items-start gap-2 text-xs text-yellow-800">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <p>By submitting, you agree to share your contact details with this pro. TriniBuild does not charge you for quotes.</p>
                     </div>

                     <button type="submit" className="w-full bg-trini-teal text-white font-bold py-3 rounded-lg hover:bg-teal-600 transition-colors shadow-lg">
                        Send Request
                     </button>
                  </form>
               </div>
            </div>
         )}

         <ChatWidget mode="service_expert" />
      </div>
   );
};

// Helper Icon
const SparklesIcon = ({ className }: { className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M9 3v4" /><path d="M3 9h4" /><path d="M3 5h4" /></svg>
);