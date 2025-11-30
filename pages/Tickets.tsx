
import React, { useState, useEffect } from 'react';
import { Ticket as TicketIcon, Calendar, MapPin, Search, Filter, CreditCard, ShieldCheck, Users, QrCode, Share2, Gift, TrendingUp, DollarSign, Lock, RefreshCw, X, Check, AlertTriangle, ScanLine, UserPlus, Settings, Banknote, Landmark, Link as LinkIcon, Camera, PlusCircle, Image as ImageIcon, Copy, Trash2, Plus } from 'lucide-react';
import { CarnivalEvent, TicketOrder, TicketTier, PromoterWorker, BankDetails, CommitteeMember, Ticket } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AdSpot } from '../components/AdSpot';
import { ticketsService } from '../services/ticketsService';
import { wiPayService } from '../services/wiPayService';
import { supabase } from '../services/supabaseClient';

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

   // Mock Data - Initial State (will be replaced by fetch)
   const [events, setEvents] = useState<CarnivalEvent[]>([]);
   const [loadingEvents, setLoadingEvents] = useState(true);

   // Load Events from Supabase
   useEffect(() => {
      loadEvents();
   }, [filterCategory]);

   const loadEvents = async () => {
      setLoadingEvents(true);
      try {
         const data = await ticketsService.getEvents(filterCategory);
         setEvents(data);
      } catch (error) {
         console.error("Failed to load events", error);
      } finally {
         setLoadingEvents(false);
      }
   };

   const [myTickets, setMyTickets] = useState<Ticket[]>([]);

   // Load Tickets from Supabase
   useEffect(() => {
      if (view === 'wallet') {
         loadMyTickets();
      }
   }, [view]);

   const loadMyTickets = async () => {
      try {
         const tickets = await ticketsService.getMyTickets();
         setMyTickets(tickets);
      } catch (error) {
         console.error("Failed to load tickets", error);
      }
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

   const handlePurchase = async () => {
      if (!selectedEvent || !checkoutTier) return;

      // Calculate Fees - 8%
      const subtotal = checkoutTier.price * ticketQuantity;
      const serviceFee = subtotal * 0.08;
      const total = subtotal + serviceFee;

      try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) {
            alert("Please login to purchase tickets");
            return;
         }

         // 1. Process Payment with WiPay
         const paymentResponse = await wiPayService.createPayment({
            amount: total,
            currency: 'TTD',
            orderNumber: `ORD-${Date.now()}`,
            description: `${ticketQuantity}x ${selectedEvent.title} - ${checkoutTier.name}`,
            customerName: user.user_metadata.full_name || 'Valued Customer',
            customerEmail: user.email || '',
            customerPhone: user.phone || ''
         });

         if (!paymentResponse.success) {
            throw new Error(paymentResponse.error || 'Payment failed');
         }

         // In a real flow, we would redirect to paymentResponse.url
         // For this hybrid/demo, we'll assume success if we get a URL or transaction ID

         alert(`Processing payment of ${formatPrice(total)} via WiPay...`);

         // 2. Create Tickets in Supabase
         await ticketsService.purchaseTickets(
            selectedEvent.id,
            checkoutTier.id,
            ticketQuantity,
            user.user_metadata.full_name || 'Ticket Holder'
         );

         alert("Payment Successful! Tickets added to your wallet.");

         // Refresh Wallet
         loadMyTickets();
         setView('wallet');
         setSelectedEvent(null);
         setCheckoutTier(null);

      } catch (error: any) {
         console.error("Purchase failed", error);
         alert(`Purchase failed: ${error.message}`);
      }
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

   const handleSaveEvent = async () => {
      try {
         await ticketsService.createEvent({
            title: newEvent.title || 'New Event',
            organizer_id: (await supabase.auth.getUser()).data.user?.id, // Will be set by backend trigger ideally, but passing for now
            date: newEvent.date || '2026-01-01',
            time: newEvent.time || '12:00:00',
            location: newEvent.location || 'TBD',
            image_url: 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=1000',
            category: newEvent.category as any,
            description: newEvent.description || '',
            status: 'published',
            is_verified: true
         }, tempTiers.map(t => ({
            name: t.name,
            price: t.price,
            currency: 'TTD',
            quantity_total: t.available,
            quantity_sold: 0,
            perks: t.perks,
            status: 'active'
         })));

         alert("Event Published Successfully!");
         setShowEventModal(false);
         setTempTiers([]);
         setNewEvent({ title: '', location: '', category: 'Concert' });
         loadEvents(); // Refresh list
      } catch (e) {
         console.error("Failed to create event", e);
         alert("Failed to create event");
      }
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

   const simulateScan = async () => {
      setScanResult('scanning');
      // In a real app, this would be triggered by a QR code reader library
      // For simulation, we'll pick a random ticket from the database or a known test one

      // Let's try to find a valid ticket for the first event
      try {
         // This is just a simulation, so we'll try to scan a "test" hash
         // In reality, the camera would provide the hash
         const testHash = `TICKET-TEST-${Date.now()}`;

         // We can't easily simulate a real scan without a real QR code from the DB.
         // So we will just call the service with a dummy hash and expect 'invalid' 
         // unless we actually picked a real hash from the wallet.

         // For better demo, let's grab a real ticket from myTickets if available
         let hashToScan = testHash;
         if (myTickets.length > 0) {
            hashToScan = myTickets[0].qr_code_hash;
         }

         const result = await ticketsService.scanTicket(hashToScan, myTickets[0]?.event_id || '1');

         setScanResult(result.status as any);
         if (result.status !== 'valid' && result.status !== 'duplicate') {
            // If our "myTicket" scan failed (maybe different user?), show invalid
            // setScanResult('invalid'); 
         }

      } catch (e) {
         setScanResult('invalid');
      }
   };

   return (
      <div className="min-h-screen bg-gray-50 pb-20 font-sans">
         {/* Top Nav */}
         <div className="bg-trini-black text-white sticky top-16 z-30 shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
               <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-2">
                     <TicketIcon className="h-6 w-6 text-trini-red" />
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
                              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold uppercase">
                                 {event.category}
                              </div>
                              {event.is_verified && (
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
                                    <p className="text-xl font-extrabold text-gray-900">{formatPrice(event.tiers && event.tiers.length > 0 ? Math.min(...event.tiers.map(t => t.price)) : 0)}</p>
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
                                    {ticket.qr_code_hash?.substring(0, 8)}
                                 </div>
                                 <p className="text-[10px] text-gray-400 mt-2 animate-pulse">Code refreshes every 60s</p>
                              </div>

                              <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                 <div>
                                    <div className="flex justify-between items-start">
                                       <div>
                                          <h3 className="font-bold text-xl text-gray-900">{ticket.event?.title}</h3>
                                          <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded mt-1">{ticket.tier?.name} Access</span>
                                       </div>
                                       <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                          <Check className="h-3 w-3 mr-1" /> Valid
                                       </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                       <div>
                                          <p className="text-gray-500 text-xs uppercase">Quantity</p>
                                          <p className="font-bold">1 Ticket</p>
                                       </div>
                                       <div>
                                          <p className="text-gray-500 text-xs uppercase">Holder</p>
                                          <p className="font-bold">{ticket.holder_name}</p>
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
                        <TicketIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
                                 <img src={ev.image_url} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
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
                           <h3 className="font-bold text-gray-900 mb-4 flex items-center"><TicketIcon className="mr-2 h-4 w-4" /> Ticket Tiers</h3>

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
