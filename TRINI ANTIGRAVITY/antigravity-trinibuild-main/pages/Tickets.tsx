
import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, Search, Filter, CreditCard, ShieldCheck, Users, QrCode, Share2, Gift, TrendingUp, DollarSign, Lock, RefreshCw, X, Check, AlertTriangle, ScanLine, UserPlus, Settings, Banknote, Landmark, Link as LinkIcon, Camera, PlusCircle, Image as ImageIcon, Copy, Trash2, Plus } from 'lucide-react';
import { CarnivalEvent, TicketOrder, TicketTier, PromoterWorker, BankDetails, CommitteeMember } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AdSpot } from '../components/AdSpot';

export const Tickets: React.FC = () => {
   // Navigation State
   const [view, setView] = useState<'browse' | 'wallet' | 'crew' | 'rewards' | 'promoter' | 'scanner'>('browse');
   const [promoterView, setPromoterView] = useState<'overview' | 'events' | 'staff' | 'committee' | 'financials'>('overview');
   const [currency, setCurrency] = useState<'TTD' | 'USD'>('TTD');

   // Data States
   const [selectedEvent, setSelectedEvent] = useState<CarnivalEvent | null>(null);
   const [checkoutTier, setCheckoutTier] = useState<TicketTier | null>(null);
   const [ticketQuantity, setTicketQuantity] = useState(1);
   const [filterCategory, setFilterCategory] = useState('All');

   // Promoter Data States
   const [workers, setWorkers] = useState<PromoterWorker[]>([
      { id: 'w1', name: 'Jason M.', email: 'jason@gate.com', role: 'Scanner', scansPerformed: 450, status: 'Active', lastActive: '2 mins ago' },
      { id: 'w2', name: 'Sarah L.', email: 'sarah@gate.com', role: 'Scanner', scansPerformed: 320, status: 'Active', lastActive: '5 mins ago' },
   ]);

   const [committee, setCommittee] = useState<CommitteeMember[]>([
      { id: 'c1', name: 'Sarah Jenkins', code: 'SARAH2026', ticketsSold: 45, commissionEarned: 450, link: 'trinibuild.com/t/SARAH2026' },
      { id: 'c2', name: 'Mark Roberts', code: 'MARKVIP', ticketsSold: 22, commissionEarned: 220, link: 'trinibuild.com/t/MARKVIP' },
   ]);

   const [bankInfo, setBankInfo] = useState<BankDetails>({
      bankName: '',
      accountNumber: '',
      accountType: 'Chequing',
      holderName: ''
   });

   // Modals
   const [showWorkerModal, setShowWorkerModal] = useState(false);
   const [showEventModal, setShowEventModal] = useState(false);
   const [showCommitteeModal, setShowCommitteeModal] = useState(false);

   // Forms
   const [newWorker, setNewWorker] = useState({ name: '', email: '', role: 'Scanner' });
   const [newCommittee, setNewCommittee] = useState({ name: '', email: '' });

   // Event Creation State
   const [newEvent, setNewEvent] = useState<Partial<CarnivalEvent>>({
      title: '',
      location: '',
      category: 'Concert',
      description: '',
      date: '',
      time: ''
   });
   const [tempTiers, setTempTiers] = useState<TicketTier[]>([]);
   const [newTierInput, setNewTierInput] = useState({ name: '', price: '', qty: '' });
   const [amenities, setAmenities] = useState({ cooler: false, food: false, drinks: false });

   // Scanner State
   const [scanResult, setScanResult] = useState<'scanning' | 'valid' | 'invalid' | 'duplicate'>('scanning');

   // Mock Data
   const [events, setEvents] = useState<CarnivalEvent[]>([
      {
         id: '1',
         title: 'Soca Monarch Finals 2026',
         organizer: 'Caribbean Prestige',
         date: 'Feb 12, 2026',
         time: '8:00 PM',
         location: 'Hasely Crawford Stadium',
         image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop',
         category: 'Concert',
         isVerified: true,
         description: "The biggest night in Soca music. See the kings and queens of Carnival battle for the crown.",
         tiers: [
            { id: 't1', name: 'General', price: 300, currency: 'TTD', available: 5000, perks: ['Grand Stand Access'] },
            { id: 't2', name: 'VIP', price: 800, currency: 'TTD', available: 500, perks: ['Front Stage', 'Free Drinks', 'Fast Entry'] }
         ]
      },
      {
         id: '2',
         title: 'Sunny Side Up: Premium Breakfast',
         organizer: 'SSU Team',
         date: 'Feb 14, 2026',
         time: '4:00 AM',
         location: 'Diamond Vale, Diego Martin',
         image: 'https://images.unsplash.com/photo-1514525253440-b393452e3726?q=80&w=1000&auto=format&fit=crop',
         category: 'Breakfast',
         isVerified: true,
         description: "The original premium breakfast party. Extensive menu, top DJs, and the best vibes to start your morning.",
         tiers: [
            { id: 't3', name: 'Early Bird', price: 600, currency: 'TTD', available: 0, perks: ['All Inclusive'] },
            { id: 't4', name: 'Regular', price: 750, currency: 'TTD', available: 200, perks: ['All Inclusive'] }
         ]
      },
      {
         id: '3',
         title: 'Silent Morning Boat Ride',
         organizer: 'Back to Basics',
         date: 'Feb 13, 2026',
         time: '9:00 AM',
         location: 'Harbour Master, POS',
         image: 'https://images.unsplash.com/photo-1544551763-46a42a463658?q=80&w=1000&auto=format&fit=crop',
         category: 'Boat Ride',
         isVerified: true,
         description: "Coolers allowed. The legendary boat ride experience.",
         tiers: [
            { id: 't5', name: 'Male', price: 400, currency: 'TTD', available: 50, perks: ['Cooler Allowed'] },
            { id: 't6', name: 'Female', price: 350, currency: 'TTD', available: 100, perks: ['Cooler Allowed'] }
         ]
      }
   ]);

   // Load Events from LocalStorage
   useEffect(() => {
      const storedEvents = localStorage.getItem('trinibuild_events');
      if (storedEvents) {
         setEvents(JSON.parse(storedEvents));
      }
   }, []);

   const saveEventsToLocal = (newEvents: CarnivalEvent[]) => {
      localStorage.setItem('trinibuild_events', JSON.stringify(newEvents));
   };

   const [myTickets, setMyTickets] = useState<TicketOrder[]>([
      {
         id: 'ord-123',
         eventId: '1',
         eventTitle: 'Soca Monarch Finals 2026',
         tierName: 'VIP',
         quantity: 2,
         totalPaid: 1728, // Including 8% fees
         purchaseDate: 'Oct 15, 2025',
         status: 'valid',
         secureCode: 'X7K9-M2P4',
         ownerName: 'Ray Kunjal'
      }
   ]);

   // Load Tickets from LocalStorage
   useEffect(() => {
      const storedTickets = localStorage.getItem('trinibuild_tickets');
      if (storedTickets) {
         setMyTickets(JSON.parse(storedTickets));
      }
   }, []);

   const saveTicketsToLocal = (newTickets: TicketOrder[]) => {
      localStorage.setItem('trinibuild_tickets', JSON.stringify(newTickets));
   };

   // Exchange Rate
   const TTD_TO_USD = 0.15;

   const formatPrice = (amount: number) => {
      if (currency === 'USD') {
         return `US$${(amount * TTD_TO_USD).toFixed(2)}`;
      }
      return `TT$${amount}`;
   };

   // Filter Logic
   const filteredEvents = filterCategory === 'All'
      ? events
      : events.filter(e => e.category === filterCategory);

   const categories = ['All', 'All Inclusive', 'Breakfast', 'Cooler', 'Concert', 'Boat Ride', 'J\'Ouvert'];

   // Secure QR Logic
   const [qrRotation, setQrRotation] = useState(0);
   useEffect(() => {
      const interval = setInterval(() => {
         setQrRotation(prev => prev + 1);
      }, 2000); // Rotate "security token" visually
      return () => clearInterval(interval);
   }, []);

   const handlePurchase = () => {
      if (!selectedEvent || !checkoutTier) return;

      // Calculate Fees - 8%
      const subtotal = checkoutTier.price * ticketQuantity;
      const serviceFee = subtotal * 0.08;
      const total = subtotal + serviceFee;

      alert(`Processing payment of ${formatPrice(total)} via PayPal Secure Gateway...`);

      // Mock Success
      setTimeout(() => {
         const newTicket: TicketOrder = {
            id: `ord-${Date.now()}`,
            eventId: selectedEvent.id,
            eventTitle: selectedEvent.title,
            tierName: checkoutTier.name,
            quantity: ticketQuantity,
            totalPaid: total,
            purchaseDate: new Date().toLocaleDateString(),
            status: 'valid',
            secureCode: `SEC-${Math.floor(Math.random() * 10000)}`,
            ownerName: 'You'
         };
         const updatedTickets = [...myTickets, newTicket];
         setMyTickets(updatedTickets);
         saveTicketsToLocal(updatedTickets);
         setView('wallet');
         setSelectedEvent(null);
         setCheckoutTier(null);
      }, 1500);
   };

   // --- PROMOTER ACTIONS ---

   const handleAddWorker = () => {
      const worker: PromoterWorker = {
         id: `w${Date.now()}`,
         name: newWorker.name,
         email: newWorker.email,
         role: newWorker.role as any,
         scansPerformed: 0,
         status: 'Active',
         lastActive: 'Never'
      };
      setWorkers([...workers, worker]);
      setShowWorkerModal(false);
      setNewWorker({ name: '', email: '', role: 'Scanner' });
   };

   const handleAddTier = () => {
      if (newTierInput.name && newTierInput.price) {
         setTempTiers([...tempTiers, {
            id: `tier-${Date.now()}`,
            name: newTierInput.name,
            price: Number(newTierInput.price),
            currency: 'TTD',
            available: Number(newTierInput.qty) || 100,
            perks: []
         }]);
         setNewTierInput({ name: '', price: '', qty: '' });
      }
   };

   const handleRemoveTier = (id: string) => {
      setTempTiers(tempTiers.filter(t => t.id !== id));
   };

   const handleSaveEvent = () => {
      const ev: CarnivalEvent = {
         id: `evt-${Date.now()}`,
         title: newEvent.title || 'New Event',
         organizer: 'My Promotion',
         date: newEvent.date || 'TBD',
         time: newEvent.time || 'TBD',
         location: newEvent.location || 'TBD',
         image: 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=1000',
         category: newEvent.category as any,
         description: newEvent.description || '',
         isVerified: true,
         tiers: tempTiers.length > 0 ? tempTiers : [
            { id: 't-gen', name: 'General Admission', price: 300, currency: 'TTD', available: 100, perks: [] }
         ]
      };
      const updatedEvents = [ev, ...events];
      setEvents(updatedEvents);
      saveEventsToLocal(updatedEvents);
      setShowEventModal(false);
      setTempTiers([]);
      setNewEvent({ title: '', location: '', category: 'Concert' });
      alert("Event Published Successfully!");
   };

   const handleAddCommittee = () => {
      if (newCommittee.name) {
         const code = newCommittee.name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 999);
         setCommittee([...committee, {
            id: `c-${Date.now()}`,
            name: newCommittee.name,
            code: code,
            ticketsSold: 0,
            commissionEarned: 0,
            link: `trinibuild.com/t/${code}`
         }]);
         setShowCommitteeModal(false);
         setNewCommittee({ name: '', email: '' });
      }
   };

   const simulateScan = () => {
      setScanResult('scanning');
      setTimeout(() => {
         const res = Math.random() > 0.7 ? 'invalid' : (Math.random() > 0.8 ? 'duplicate' : 'valid');
         setScanResult(res);
      }, 1500);
   };

   return (
      <div className="min-h-screen bg-gray-50 pb-20 font-sans">
         {/* Top Nav */}
         <div className="bg-trini-black text-white sticky top-16 z-30 shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
               <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-2">
                     <Ticket className="h-6 w-6 text-trini-red" />
                     <span className="font-bold text-lg tracking-tight">TriniBuild <span className="text-trini-red">E-Tick</span></span>
                  </div>

                  <div className="flex bg-gray-800 rounded-lg p-1">
                     <button onClick={() => setCurrency('TTD')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${currency === 'TTD' ? 'bg-white text-black' : 'text-gray-400'}`}>TTD</button>
                     <button onClick={() => setCurrency('USD')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${currency === 'USD' ? 'bg-white text-black' : 'text-gray-400'}`}>USD</button>
                  </div>
               </div>

               {/* Sub Menu */}
               <div className="flex overflow-x-auto space-x-6 pb-0 hide-scrollbar">
                  {[
                     { id: 'browse', label: 'Events', icon: Calendar },
                     { id: 'wallet', label: 'My Tickets', icon: QrCode },
                     { id: 'crew', label: 'Crew', icon: Users },
                     { id: 'promoter', label: 'Promoter', icon: TrendingUp },
                     { id: 'scanner', label: 'Gate Scanner', icon: ScanLine },
                  ].map(item => (
                     <button
                        key={item.id}
                        onClick={() => setView(item.id as any)}
                        className={`flex items-center pb-3 border-b-2 px-2 transition-all whitespace-nowrap ${view === item.id ? 'border-trini-red text-white font-bold' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                     >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.label}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Ad Spot */}
            <AdSpot page="tickets" slot="top" className="mb-8" />

            {/* VIEW: BROWSE EVENTS */}
            {view === 'browse' && (
               <div className="animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                     <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input type="text" placeholder="Search fete, artiste, or venue..." className="w-full pl-10 p-3 rounded-full border border-gray-300 focus:ring-trini-red focus:border-trini-red" />
                     </div>
                     <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2">
                        {categories.map(cat => (
                           <button
                              key={cat}
                              onClick={() => setFilterCategory(cat)}
                              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === cat ? 'bg-trini-red text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                           >
                              {cat}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {filteredEvents.map(event => (
                        <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all group">
                           <div className="h-48 relative overflow-hidden">
                              <img src={event.image} alt={event.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold uppercase">
                                 {event.category}
                              </div>
                              {event.isVerified && (
                                 <div className="absolute bottom-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
                                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                                 </div>
                              )}
                           </div>
                           <div className="p-6">
                              <div className="flex justify-between items-start mb-2">
                                 <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-trini-red transition-colors">{event.title}</h3>
                              </div>
                              <p className="text-sm text-gray-500 mb-4">{event.organizer}</p>

                              <div className="space-y-2 text-sm text-gray-600 mb-6">
                                 <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-trini-red" /> {event.date} • {event.time}</div>
                                 <div className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-trini-red" /> {event.location}</div>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                 <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Starting At</p>
                                    <p className="text-xl font-extrabold text-gray-900">{formatPrice(Math.min(...event.tiers.map(t => t.price)))}</p>
                                 </div>
                                 <button
                                    onClick={() => setSelectedEvent(event)}
                                    className="bg-trini-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                                 >
                                    Buy Tickets
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* VIEW: WALLET (My Tickets) */}
            {view === 'wallet' && (
               <div className="max-w-3xl mx-auto animate-in slide-in-from-right duration-500">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">My Ticket Wallet</h2>
                  {myTickets.length > 0 ? (
                     <div className="space-y-6">
                        {myTickets.map(ticket => (
                           <div key={ticket.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 flex flex-col md:flex-row">
                              <div className="bg-trini-black p-6 text-white flex flex-col justify-center items-center md:w-1/3 text-center relative overflow-hidden">
                                 {/* Live QR Simulation */}
                                 <div className="relative z-10 bg-white p-3 rounded-xl mb-3">
                                    <QrCode className="h-32 w-32 text-black opacity-90" style={{ transform: `rotate(${qrRotation % 2 === 0 ? 0 : 0}deg)` }} />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                       <div className="w-full h-1 bg-trini-red opacity-50 animate-[scan_2s_linear_infinite]"></div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs font-mono bg-gray-800 px-3 py-1 rounded">
                                    <Lock className="h-3 w-3" />
                                    {ticket.secureCode}
                                 </div>
                                 <p className="text-[10px] text-gray-400 mt-2 animate-pulse">Code refreshes every 60s</p>
                              </div>

                              <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                 <div>
                                    <div className="flex justify-between items-start">
                                       <div>
                                          <h3 className="font-bold text-xl text-gray-900">{ticket.eventTitle}</h3>
                                          <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded mt-1">{ticket.tierName} Access</span>
                                       </div>
                                       <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                          <Check className="h-3 w-3 mr-1" /> Valid
                                       </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                       <div>
                                          <p className="text-gray-500 text-xs uppercase">Quantity</p>
                                          <p className="font-bold">{ticket.quantity} Tickets</p>
                                       </div>
                                       <div>
                                          <p className="text-gray-500 text-xs uppercase">Holder</p>
                                          <p className="font-bold">{ticket.ownerName}</p>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="mt-6 flex gap-3">
                                    <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50 flex items-center justify-center text-sm">
                                       <Share2 className="h-4 w-4 mr-2" /> Transfer
                                    </button>
                                    <button className="flex-1 bg-trini-red text-white py-2 rounded-lg font-bold hover:bg-red-700 text-sm">
                                       View Details
                                    </button>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                        <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No tickets yet.</p>
                        <button onClick={() => setView('browse')} className="mt-4 text-trini-red font-bold hover:underline">
                           Find an Event
                        </button>
                     </div>
                  )}
               </div>
            )}

            {/* VIEW: PROMOTER DASHBOARD */}
            {view === 'promoter' && (
               <div className="animate-in fade-in duration-500">
                  {/* Promoter Sub Nav */}
                  <div className="flex gap-4 mb-8 border-b border-gray-200 pb-1 overflow-x-auto">
                     <button onClick={() => setPromoterView('overview')} className={`pb-3 text-sm font-bold px-2 whitespace-nowrap ${promoterView === 'overview' ? 'border-b-2 border-trini-red text-trini-red' : 'text-gray-500'}`}>Overview</button>
                     <button onClick={() => setPromoterView('events')} className={`pb-3 text-sm font-bold px-2 whitespace-nowrap ${promoterView === 'events' ? 'border-b-2 border-trini-red text-trini-red' : 'text-gray-500'}`}>Events</button>
                     <button onClick={() => setPromoterView('committee')} className={`pb-3 text-sm font-bold px-2 whitespace-nowrap ${promoterView === 'committee' ? 'border-b-2 border-trini-red text-trini-red' : 'text-gray-500'}`}>Committee</button>
                     <button onClick={() => setPromoterView('staff')} className={`pb-3 text-sm font-bold px-2 whitespace-nowrap ${promoterView === 'staff' ? 'border-b-2 border-trini-red text-trini-red' : 'text-gray-500'}`}>Staff</button>
                     <button onClick={() => setPromoterView('financials')} className={`pb-3 text-sm font-bold px-2 whitespace-nowrap ${promoterView === 'financials' ? 'border-b-2 border-trini-red text-trini-red' : 'text-gray-500'}`}>Financials</button>
                  </div>

                  {promoterView === 'overview' && (
                     <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <p className="text-xs text-gray-500 uppercase font-bold">Tickets Scanned</p>
                              <h3 className="text-3xl font-extrabold text-gray-900 mt-2">782</h3>
                              <div className="w-full bg-gray-100 rounded-full h-2 mt-3"><div className="bg-green-500 h-2 rounded-full" style={{ width: '63%' }}></div></div>
                           </div>
                           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <p className="text-xs text-gray-500 uppercase font-bold">Sales Revenue</p>
                              <h3 className="text-3xl font-extrabold text-gray-900 mt-2">TT$ 45,200</h3>
                           </div>
                           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <p className="text-xs text-gray-500 uppercase font-bold">Committee Sales</p>
                              <h3 className="text-3xl font-extrabold text-gray-900 mt-2">145</h3>
                           </div>
                        </div>
                     </>
                  )}

                  {promoterView === 'events' && (
                     <div className="animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-6">
                           <h2 className="text-xl font-bold text-gray-900">My Events</h2>
                           <button onClick={() => setShowEventModal(true)} className="bg-trini-black text-white px-4 py-2 rounded-lg font-bold flex items-center text-sm shadow-lg hover:bg-gray-800">
                              <PlusCircle className="h-4 w-4 mr-2" /> Create Event
                           </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {events.slice(0, 2).map(ev => (
                              <div key={ev.id} className="bg-white p-4 rounded-xl border border-gray-200 flex gap-4 hover:shadow-md transition-all">
                                 <img src={ev.image} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                                 <div className="flex-grow">
                                    <h3 className="font-bold text-gray-900">{ev.title}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{ev.date} @ {ev.location}</p>
                                    <div className="flex gap-2 mt-2">
                                       <button className="text-xs bg-gray-100 px-2 py-1 rounded font-bold hover:bg-gray-200">Edit</button>
                                       <button className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-100">Manage Tickets</button>
                                    </div>
                                 </div>
                                 <div className="flex flex-col items-end justify-center">
                                    <span className="text-2xl font-bold text-gray-900">{ev.tiers.reduce((acc, t) => acc + t.available, 0)}</span>
                                    <span className="text-xs text-gray-500">Left</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {promoterView === 'committee' && (
                     <div className="animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-6">
                           <div>
                              <h2 className="text-xl font-bold text-gray-900">Committee Management</h2>
                              <p className="text-sm text-gray-500">Track affiliate sales and commissions.</p>
                           </div>
                           <button onClick={() => setShowCommitteeModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold flex items-center text-sm hover:bg-purple-700 shadow-md">
                              <UserPlus className="h-4 w-4 mr-2" /> Add Member
                           </button>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                           <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                 <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sold</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Earned</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Link</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                 {committee.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                       <td className="px-6 py-4 font-bold text-gray-900">{c.name}</td>
                                       <td className="px-6 py-4 font-mono text-sm text-purple-600 bg-purple-50 w-fit px-2 rounded">{c.code}</td>
                                       <td className="px-6 py-4">{c.ticketsSold}</td>
                                       <td className="px-6 py-4 text-green-600 font-bold">TT${c.commissionEarned}</td>
                                       <td className="px-6 py-4 text-right">
                                          <button className="text-blue-600 hover:underline text-xs flex items-center justify-end ml-auto font-bold" onClick={() => alert(`Copied: ${c.link}`)}>
                                             Copy <Copy className="h-3 w-3 ml-1" />
                                          </button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}

                  {promoterView === 'staff' && (
                     <div className="animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-6">
                           <h2 className="text-xl font-bold text-gray-900">Staff</h2>
                           <button onClick={() => setShowWorkerModal(true)} className="bg-trini-black text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md">Add Worker</button>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                           <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500">Name</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500">Role</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500">Status</th></tr></thead>
                              <tbody className="divide-y divide-gray-200">
                                 {workers.map(w => <tr key={w.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-bold">{w.name}</td><td className="px-6 py-4">{w.role}</td><td className="px-6 py-4"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">{w.status}</span></td></tr>)}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}
               </div>
            )}

            {/* VIEW: SCANNER APP SIMULATION */}
            {view === 'scanner' && (
               <div className="max-w-md mx-auto bg-black min-h-[650px] rounded-3xl relative overflow-hidden border-8 border-gray-800 shadow-2xl">
                  {/* Header Overlay */}
                  <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4 z-20 flex justify-between text-white">
                     <div className="text-xs font-bold">
                        <p className="text-gray-400 uppercase">Event</p>
                        <p>Soca Monarch 2026</p>
                     </div>
                     <div className="text-right text-xs font-bold">
                        <p className="text-gray-400 uppercase">Gate 1</p>
                        <p className="text-green-400 flex items-center justify-end"><span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span> Live</p>
                     </div>
                  </div>

                  {/* Capacity HUD */}
                  <div className="absolute top-16 left-4 right-4 bg-black/60 backdrop-blur-md rounded-lg p-3 z-20 border border-white/10">
                     <div className="flex justify-between text-xs font-bold text-white mb-1">
                        <span>Entry Count</span>
                        <span>452 / 1000</span>
                     </div>
                     <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-trini-red h-2 rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
                     </div>
                  </div>

                  {/* Camera View */}
                  <div className="absolute inset-0 bg-gray-900">
                     <img src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-40" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                           <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                           <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                           <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                           <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
                           <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.8)]"></div>
                        </div>
                     </div>
                  </div>

                  {/* Scanner UI Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 animate-in slide-in-from-bottom-10 z-30">
                     {scanResult === 'scanning' && (
                        <div className="text-center">
                           <p className="text-gray-500 mb-4 font-medium">Point camera at ticket code</p>
                           <button onClick={simulateScan} className="w-full bg-trini-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 active:scale-95 transition-all">
                              Simulate Scan
                           </button>
                        </div>
                     )}
                     {scanResult === 'valid' && (
                        <div className="text-center">
                           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                              <Check className="h-12 w-12 text-green-600" />
                           </div>
                           <h2 className="text-3xl font-extrabold text-green-600 mb-1">VALID</h2>
                           <p className="text-gray-900 font-bold text-xl">VIP Access</p>
                           <p className="text-gray-500 text-sm mb-6">Ray Kunjal</p>
                           <button onClick={() => setScanResult('scanning')} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold shadow-lg">Scan Next</button>
                        </div>
                     )}
                     {scanResult === 'duplicate' && (
                        <div className="text-center">
                           <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <AlertTriangle className="h-12 w-12 text-orange-600" />
                           </div>
                           <h2 className="text-2xl font-extrabold text-orange-600 mb-1">ALREADY USED</h2>
                           <p className="text-gray-500 text-sm font-mono bg-gray-100 inline-block px-2 py-1 rounded mb-6">Scanned: 10:42 PM (Gate 1)</p>
                           <button onClick={() => setScanResult('scanning')} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold shadow-lg">Scan Next</button>
                        </div>
                     )}
                     {scanResult === 'invalid' && (
                        <div className="text-center">
                           <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <X className="h-12 w-12 text-red-600" />
                           </div>
                           <h2 className="text-3xl font-extrabold text-red-600 mb-2">INVALID</h2>
                           <p className="text-gray-500 text-sm mb-6">Ticket ID not found in database.</p>
                           <button onClick={() => setScanResult('scanning')} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold shadow-lg">Scan Next</button>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* CREATE EVENT MODAL */}
            {showEventModal && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
                        <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
                     </div>

                     <div className="p-8 space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-1">Event Title</label>
                              <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-trini-red" placeholder="e.g. Sun Nation 2026" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                              <input type="date" className="w-full border border-gray-300 p-3 rounded-lg" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Time</label>
                              <input type="time" className="w-full border border-gray-300 p-3 rounded-lg" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
                           </div>
                           <div className="col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                              <input type="text" className="w-full border border-gray-300 p-3 rounded-lg" placeholder="e.g. O2 Park, Chaguaramas" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                           </div>
                        </div>

                        {/* Amenities Toggles */}
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Event Type</label>
                           <div className="flex gap-4">
                              {['Cooler Allowed', 'Food Inclusive', 'Drinks Inclusive'].map(am => (
                                 <label key={am} className="flex items-center cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100">
                                    <input type="checkbox" className="mr-2 rounded text-trini-red focus:ring-trini-red" />
                                    <span className="text-sm font-medium text-gray-700">{am}</span>
                                 </label>
                              ))}
                           </div>
                        </div>

                        {/* Ticket Tiers Builder */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                           <h3 className="font-bold text-gray-900 mb-4 flex items-center"><Ticket className="mr-2 h-4 w-4" /> Ticket Tiers</h3>

                           {tempTiers.length > 0 && (
                              <div className="space-y-2 mb-4">
                                 {tempTiers.map(tier => (
                                    <div key={tier.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
                                       <div>
                                          <span className="font-bold text-gray-800">{tier.name}</span>
                                          <span className="text-xs text-gray-500 ml-2">({tier.available} qty)</span>
                                       </div>
                                       <div className="flex items-center">
                                          <span className="font-bold text-green-600 mr-4">TT${tier.price}</span>
                                          <button onClick={() => handleRemoveTier(tier.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}

                           <div className="grid grid-cols-3 gap-3 items-end">
                              <div className="col-span-1">
                                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Name</label>
                                 <input type="text" placeholder="e.g. Early Bird" className="w-full border p-2 rounded text-sm" value={newTierInput.name} onChange={e => setNewTierInput({ ...newTierInput, name: e.target.value })} />
                              </div>
                              <div className="col-span-1">
                                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Price (TTD)</label>
                                 <input type="number" placeholder="0.00" className="w-full border p-2 rounded text-sm" value={newTierInput.price} onChange={e => setNewTierInput({ ...newTierInput, price: e.target.value })} />
                              </div>
                              <div className="col-span-1 flex gap-2">
                                 <div className="flex-grow">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Qty</label>
                                    <input type="number" placeholder="100" className="w-full border p-2 rounded text-sm" value={newTierInput.qty} onChange={e => setNewTierInput({ ...newTierInput, qty: e.target.value })} />
                                 </div>
                                 <button onClick={handleAddTier} className="bg-trini-black text-white p-2 rounded hover:bg-gray-800 h-[38px] w-[38px] flex items-center justify-center"><Plus className="h-5 w-5" /></button>
                              </div>
                           </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                           <button onClick={() => setShowEventModal(false)} className="px-6 py-3 rounded-lg bg-gray-100 font-bold text-gray-600 hover:bg-gray-200">Cancel</button>
                           <button onClick={handleSaveEvent} className="px-8 py-3 rounded-lg bg-trini-red text-white font-bold hover:bg-red-700 shadow-lg">Publish Event</button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* COMMITTEE MEMBER MODAL */}
            {showCommitteeModal && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-xl w-full max-w-md p-8 shadow-2xl">
                     <h3 className="text-xl font-bold mb-6">Add Committee Member</h3>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                           <input
                              type="text" placeholder="e.g. Sarah James"
                              className="w-full border border-gray-300 p-3 rounded-lg"
                              value={newCommittee.name}
                              onChange={(e) => setNewCommittee({ ...newCommittee, name: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Email (Optional)</label>
                           <input
                              type="email" placeholder="sarah@example.com"
                              className="w-full border border-gray-300 p-3 rounded-lg"
                              value={newCommittee.email}
                              onChange={(e) => setNewCommittee({ ...newCommittee, email: e.target.value })}
                           />
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-sm text-purple-800">
                           <p className="font-bold mb-1">Auto-Generated Link</p>
                           <p>A unique tracking code will be created for this member to share on WhatsApp/Instagram.</p>
                        </div>

                        <button onClick={handleAddCommittee} className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 mt-4 shadow-lg">
                           Create & Copy Link
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* WORKER MODAL */}
            {showWorkerModal && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-xl w-full max-w-md p-8 shadow-2xl">
                     <h3 className="text-xl font-bold mb-6">Add Staff Member</h3>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                           <input
                              type="text"
                              className="w-full border border-gray-300 p-3 rounded-lg"
                              value={newWorker.name}
                              onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                           <input
                              type="email"
                              className="w-full border border-gray-300 p-3 rounded-lg"
                              value={newWorker.email}
                              onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                           <select
                              className="w-full border border-gray-300 p-3 rounded-lg"
                              value={newWorker.role}
                              onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                           >
                              <option value="Scanner">Gate Scanner</option>
                              <option value="Admin">Event Admin</option>
                              <option value="Box Office">Box Office</option>
                           </select>
                        </div>
                        <button onClick={handleAddWorker} className="w-full bg-trini-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 mt-4 shadow-lg">
                           Add Staff
                        </button>
                     </div>
                  </div>
               </div>
            )}

         </div>
      </div>
   );
};
