
import React, { useState, useEffect } from 'react';
import {
   Users, DollarSign, Ban, CheckCircle, Search, Gift, MessageCircle, Mail,
   ShieldAlert, MoreVertical, LayoutDashboard, Settings as SettingsIcon,
   UploadCloud, Loader2, FileText, X, Briefcase, Ticket, TrendingUp,
   Activity, Globe, Bell, LogOut, Menu, ChevronRight, BarChart2, PieChart as PieChartIcon, PlayCircle, Sliders, FileEdit, Key, Eye, AlertTriangle, Power, Database, Layers, Server, Cpu
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { SubscriptionTier, BlogPost } from '../types';
import { Link } from 'react-router-dom';
import { verifyBusinessDocument, generateBlogPost } from '../services/geminiService';
import { getCampaigns, saveCampaign, deleteCampaign, AdCampaign, getTrafficStats } from '../services/adService';

const REVENUE_DATA = [
   { name: 'Jan', revenue: 0 },
   { name: 'Feb', revenue: 0 },
   { name: 'Mar', revenue: 0 },
   { name: 'Apr', revenue: 0 },
   { name: 'May', revenue: 0 },
   { name: 'Jun', revenue: 0 },
   { name: 'Jul', revenue: 0 },
   { name: 'Aug', revenue: 0 },
   { name: 'Sep', revenue: 0 },
   { name: 'Oct', revenue: 0 },
];

export const AdminDashboard: React.FC = () => {
   const [activeView, setActiveView] = useState<'overview' | 'stores' | 'users' | 'jobs' | 'content' | 'monetization' | 'system' | 'integrations'>('overview');
   const [isSidebarOpen, setSidebarOpen] = useState(true);

   // Vendor Logic
   const [vendors, setVendors] = useState<any[]>([
      { id: 'v1', name: 'Roti King', owner: 'Rajesh K.', email: 'rajesh@example.com', status: 'active', plan: 'Free', verified: false, revenue: 450 },
      { id: 'v2', name: 'Island Styles', owner: 'Sarah M.', email: 'sarah@example.com', status: 'active', plan: 'Starter', verified: true, revenue: 1200 },
   ]);

   // Regular Users Logic (Drivers/Customers)
   const [users, setUsers] = useState<any[]>([
      { id: 'u1', name: 'David Roberts', email: 'david.r@gmail.com', role: 'DRIVER', status: 'active', rides: 12 },
      { id: 'u2', name: 'Amanda Lewis', email: 'amanda.l@yahoo.com', role: 'CUSTOMER', status: 'active', orders: 5 },
   ]);

   // Content / Blog Logic
   const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
   const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
   const [blogPrompt, setBlogPrompt] = useState({ topic: '', keywords: '' });
   const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);

   const [searchTerm, setSearchTerm] = useState('');
   const [selectedId, setSelectedId] = useState<string | null>(null);

   // Verification Logic
   const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
   const [vendorToVerify, setVendorToVerify] = useState<any>(null);
   const [docFile, setDocFile] = useState<string | null>(null);
   const [isScanning, setIsScanning] = useState(false);
   const [scanResult, setScanResult] = useState<{ match: boolean, confidence: number, analysis: string } | null>(null);

   // Monetization Logic
   const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
   const [trafficStats, setTrafficStats] = useState<any>(null);
   const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
   const [editingCampaign, setEditingCampaign] = useState<Partial<AdCampaign>>({
      clientName: '',
      videoUrl: '',
      targetUrl: '',
      placements: ['home'],
      isPaidClient: false,
      active: true
   });

   // Integration Logic
   const [integrations, setIntegrations] = useState([
      { id: 'firebase', name: 'Google Firebase', desc: 'Auth, Real-time DB & Cloud Functions', connected: false, icon: Database, color: 'text-yellow-500' },
      { id: 'vertex', name: 'Vertex AI Agent', desc: 'Enterprise Search & Customer Bot', connected: true, icon: Cpu, color: 'text-blue-500' },
      { id: 'maps_pro', name: 'Maps Routes Preferred', desc: 'Eco-routing & Precision Tolls', connected: false, icon: Layers, color: 'text-green-500' },
      { id: 'ads', name: 'Google Ad Manager', desc: 'Advanced AdTech Revenue', connected: false, icon: DollarSign, color: 'text-blue-600' },
   ]);

   useEffect(() => {
      setCampaigns(getCampaigns());
      setTrafficStats(getTrafficStats());
   }, []);

   const handleSaveCampaign = () => {
      if (!editingCampaign.clientName || !editingCampaign.videoUrl) return;

      const newCampaign: AdCampaign = {
         id: editingCampaign.id || Date.now().toString(),
         clientName: editingCampaign.clientName!,
         videoUrl: editingCampaign.videoUrl!,
         targetUrl: editingCampaign.targetUrl || '#',
         placements: editingCampaign.placements as any || ['home'],
         isPaidClient: editingCampaign.isPaidClient || false,
         active: editingCampaign.active !== undefined ? editingCampaign.active : true,
         views: editingCampaign.views || 0,
         clicks: editingCampaign.clicks || 0
      };

      saveCampaign(newCampaign);
      setCampaigns(getCampaigns());
      setIsCampaignModalOpen(false);
      setEditingCampaign({ clientName: '', videoUrl: '', targetUrl: '', placements: ['home'], isPaidClient: false, active: true });
   };

   const handleDeleteCampaign = (id: string) => {
      if (confirm('Are you sure you want to delete this campaign?')) {
         deleteCampaign(id);
         setCampaigns(getCampaigns());
      }
   };

   const togglePlacement = (placement: string) => {
      const current = editingCampaign.placements || [];
      if (current.includes(placement as any)) {
         setEditingCampaign({ ...editingCampaign, placements: current.filter(p => p !== placement) as any });
      } else {
         setEditingCampaign({ ...editingCampaign, placements: [...current, placement] as any });
      }
   };

   const toggleIntegration = (id: string) => {
      setIntegrations(integrations.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
   };

   // --- ACTIONS ---

   // Grant Premium (The "Gift" Feature)
   const handleGiftPremium = (id: string, type: 'vendor' | 'user') => {
      if (type === 'vendor') {
         setVendors(vendors.map(v => v.id === id ? { ...v, plan: SubscriptionTier.ENTERPRISE, isLifetime: true } : v));
      } else {
         setUsers(users.map(u => u.id === id ? { ...u, isLifetime: true, badge: 'VIP' } : u));
      }
      alert(`Premium features gifted to account ${id}. Payment bypassed.`);
      setSelectedId(null);
   };

   const handleToggleStatus = (id: string, type: 'vendor' | 'user') => {
      if (type === 'vendor') {
         setVendors(vendors.map(v => v.id === id ? { ...v, status: v.status === 'active' ? 'banned' : 'active' } : v));
      } else {
         setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'banned' : 'active' } : u));
      }
      setSelectedId(null);
   };

   // Blog Generation
   const handleGenerateBlog = async () => {
      if (!blogPrompt.topic) return;
      setIsGeneratingBlog(true);
      try {
         const article = await generateBlogPost(blogPrompt.topic, blogPrompt.keywords);
         const newPost: BlogPost = {
            id: Date.now().toString(),
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            author: 'TriniBuild AI',
            date: new Date().toLocaleDateString(),
            category: 'News',
            image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=800', // Placeholder
            status: 'published',
            seoKeywords: blogPrompt.keywords.split(',').map(k => k.trim())
         };
         setBlogPosts([newPost, ...blogPosts]);
         setIsBlogModalOpen(false);
         setBlogPrompt({ topic: '', keywords: '' });
      } catch (error) {
         alert("Failed to generate blog post.");
      } finally {
         setIsGeneratingBlog(false);
      }
   };

   const openVerificationModal = (vendor: any) => {
      setVendorToVerify(vendor);
      setDocFile(null);
      setScanResult(null);
      setIsVerifyModalOpen(true);
      setSelectedId(null);
   };

   const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => setDocFile(reader.result as string);
         reader.readAsDataURL(file);
      }
   };

   const handleRunVerification = async () => {
      if (!docFile || !vendorToVerify) return;
      setIsScanning(true);
      try {
         const result = await verifyBusinessDocument(docFile, vendorToVerify.name);
         setScanResult(result);
      } catch (error) {
         console.error("Verification failed", error);
         alert("AI Analysis Failed. Check API Key.");
      } finally {
         setIsScanning(false);
      }
   };

   const handleApproveVerification = () => {
      if (!vendorToVerify) return;
      setVendors(vendors.map(v => v.id === vendorToVerify.id ? { ...v, verified: true } : v));
      setIsVerifyModalOpen(false);
   };

   return (
      <div className="min-h-screen bg-gray-100 font-sans flex">

         {/* Sidebar */}
         <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col fixed h-full z-20 shadow-2xl`}>
            <div className="p-4 flex items-center justify-between border-b border-gray-800">
               <div className={`flex items-center ${!isSidebarOpen && 'justify-center w-full'}`}>
                  <div className="bg-white p-1.5 rounded-lg mr-3">
                     <img src="https://trinibuild.com/wp-content/uploads/2023/05/TriniBuild-Logo.png" alt="Logo" className="h-6 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>
                  {isSidebarOpen && <span className="font-bold text-lg">Admin</span>}
               </div>
            </div>

            <nav className="flex-grow py-6 space-y-1">
               {[
                  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                  { id: 'monetization', icon: BarChart2, label: 'Traffic & Ads' },
                  { id: 'content', icon: FileEdit, label: 'Content & SEO' },
                  { id: 'stores', icon: Globe, label: 'Stores' },
                  { id: 'users', icon: Users, label: 'Users & Drivers' },
                  { id: 'jobs', icon: Briefcase, label: 'Jobs' },
                  { id: 'integrations', icon: Layers, label: 'Integrations' },
                  { id: 'system', icon: SettingsIcon, label: 'System Control' },
               ].map((item) => (
                  <button
                     key={item.id}
                     onClick={() => setActiveView(item.id as any)}
                     className={`w-full flex items-center px-6 py-3 transition-colors border-l-4 ${activeView === item.id
                           ? 'bg-gray-800 border-trini-red text-white'
                           : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                  >
                     <item.icon className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                     {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                  </button>
               ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
               <Link to="/" className="flex items-center text-red-400 hover:text-red-300 transition-colors px-2 py-2 mt-2">
                  <LogOut className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                  {isSidebarOpen && <span>Logout</span>}
               </Link>
            </div>
         </aside>

         {/* Main Content */}
         <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
            {/* Top Bar */}
            <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
               <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-gray-700">
                  <Menu className="h-6 w-6" />
               </button>

               <div className="flex items-center gap-4">
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full flex items-center border border-red-200">
                     <ShieldAlert className="h-3 w-3 mr-2" />
                     God Mode Active
                  </span>
                  <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                     <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-900">Admin</p>
                        <p className="text-xs text-gray-500">Super User</p>
                     </div>
                     <div className="h-10 w-10 bg-trini-black rounded-full flex items-center justify-center text-white font-bold">SU</div>
                  </div>
               </div>
            </header>

            <div className="p-8">

               {/* VIEW: OVERVIEW */}
               {activeView === 'overview' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                           { label: 'Total Revenue', value: 'TT$ 0.00', sub: 'System Start', icon: DollarSign, color: 'bg-green-100 text-green-600' },
                           { label: 'Total Users', value: '4', sub: '2 Vendors / 2 Users', icon: Users, color: 'bg-blue-100 text-blue-600' },
                           { label: 'Active Stores', value: '2', sub: 'Growth Phase', icon: Globe, color: 'bg-purple-100 text-purple-600' },
                           { label: 'Pending Tickets', value: '0', sub: 'All Clear', icon: Ticket, color: 'bg-orange-100 text-orange-600' },
                        ].map((stat, i) => (
                           <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                                 </div>
                                 <div className={`p-3 rounded-lg ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Welcome to the Command Center</h3>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                           You have full control over the TriniBuild ecosystem. Use the sidebar to manage content, inject traffic, override user accounts, or configure system-wide settings.
                        </p>
                     </div>
                  </div>
               )}

               {/* VIEW: CONTENT & SEO */}
               {activeView === 'content' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">Content & SEO Manager</h2>
                        <button
                           onClick={() => setIsBlogModalOpen(true)}
                           className="bg-trini-red text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg hover:bg-red-700"
                        >
                           <FileEdit className="h-4 w-4 mr-2" /> Write New Article (AI)
                        </button>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                           <h3 className="font-bold text-lg mb-4">Blog Posts</h3>
                           {blogPosts.length === 0 ? (
                              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                                 <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                 <p className="text-gray-500">No posts yet. Use the AI to generate content.</p>
                              </div>
                           ) : (
                              <div className="space-y-4">
                                 {blogPosts.map(post => (
                                    <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                       <div>
                                          <h4 className="font-bold text-gray-900">{post.title}</h4>
                                          <p className="text-xs text-gray-500">{post.date} • {post.category}</p>
                                       </div>
                                       <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Published</span>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                           <h3 className="font-bold text-lg mb-4 flex items-center">
                              <Globe className="h-5 w-5 mr-2 text-blue-600" /> SEO Controller
                           </h3>
                           <div className="space-y-4">
                              <div>
                                 <label className="block text-xs font-bold text-gray-900 uppercase mb-1">Global Meta Title</label>
                                 <input type="text" className="w-full border border-gray-300 bg-white text-gray-900 rounded p-2 text-sm" defaultValue="TriniBuild - Trinidad Business Directory" />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-gray-900 uppercase mb-1">Target Keywords (Comma Sep)</label>
                                 <textarea rows={3} className="w-full border border-gray-300 bg-white text-gray-900 rounded p-2 text-sm" defaultValue="trinidad business, trinidad shopping, trini food, rideshare trinidad" />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-gray-900 uppercase mb-1">Robots.txt</label>
                                 <textarea rows={3} className="w-full border border-gray-300 bg-white text-gray-900 rounded p-2 text-sm font-mono" defaultValue="User-agent: * \nAllow: /" />
                              </div>
                              <button className="w-full bg-gray-900 text-white py-2 rounded font-bold text-sm hover:bg-gray-800">Update SEO Rules</button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* VIEW: STORES (Vendors) */}
               {activeView === 'stores' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
                        <div className="relative w-64">
                           <input
                              type="text" placeholder="Search vendors..."
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                              onChange={(e) => setSearchTerm(e.target.value)}
                           />
                           <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                     </div>

                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                              <tr>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Vendor</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Plan</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                 <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                              {vendors.filter(v => v.name.toLowerCase().includes(searchTerm)).map((vendor) => (
                                 <tr key={vendor.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                       <div className="flex items-center">
                                          <div className="h-8 w-8 rounded bg-trini-red text-white flex items-center justify-center font-bold mr-3">{vendor.name[0]}</div>
                                          <div>
                                             <div className="font-bold text-sm">{vendor.name}</div>
                                             <div className="text-xs text-gray-500">{vendor.email}</div>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${vendor.plan === SubscriptionTier.ENTERPRISE ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                          {vendor.plan} {vendor.isLifetime && '(Gifted)'}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className={`text-xs font-bold ${vendor.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{vendor.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                       <button onClick={() => setSelectedId(selectedId === vendor.id ? null : vendor.id)} className="text-gray-400 hover:text-gray-600">
                                          <MoreVertical className="h-5 w-5" />
                                       </button>

                                       {selectedId === vendor.id && (
                                          <div className="absolute right-8 top-8 w-56 bg-white rounded-md shadow-xl border border-gray-200 z-50 text-left overflow-hidden">
                                             <button onClick={() => handleGiftPremium(vendor.id, 'vendor')} className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 text-purple-700 font-bold flex items-center">
                                                <Gift className="h-3 w-3 mr-2" /> Gift Enterprise Plan
                                             </button>
                                             <button onClick={() => openVerificationModal(vendor)} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-600 font-bold flex items-center">
                                                <ShieldAlert className="h-3 w-3 mr-2" /> Force Verify
                                             </button>
                                             <div className="border-t my-1"></div>
                                             <button onClick={() => handleToggleStatus(vendor.id, 'vendor')} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600">
                                                {vendor.status === 'active' ? 'Ban Account' : 'Unban Account'}
                                             </button>
                                          </div>
                                       )}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {/* VIEW: USERS (Regular/Drivers) */}
               {activeView === 'users' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6">User & Driver Control</h2>
                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                              <tr>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">User</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                 <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                              {users.map((user) => (
                                 <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                       <div className="font-bold text-sm">{user.name}</div>
                                       <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'DRIVER' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                                          {user.role}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className={`text-xs font-bold ${user.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{user.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                       <button onClick={() => setSelectedId(selectedId === user.id ? null : user.id)} className="text-gray-400 hover:text-gray-600">
                                          <MoreVertical className="h-5 w-5" />
                                       </button>
                                       {selectedId === user.id && (
                                          <div className="absolute right-8 top-8 w-48 bg-white rounded-md shadow-xl border border-gray-200 z-50 text-left">
                                             <button onClick={() => handleGiftPremium(user.id, 'user')} className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 text-purple-700">
                                                Gift VIP Status
                                             </button>
                                             <button onClick={() => handleToggleStatus(user.id, 'user')} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600">
                                                {user.status === 'active' ? 'Ban User' : 'Unban User'}
                                             </button>
                                          </div>
                                       )}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {/* VIEW: MONETIZATION */}
               {activeView === 'monetization' && trafficStats && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                     <div className="flex justify-between items-center">
                        <div>
                           <h2 className="text-2xl font-bold text-gray-900">Ad Platform & Traffic Control</h2>
                           <p className="text-gray-500 text-sm">Manage video slots across the entire ecosystem.</p>
                        </div>
                        <button
                           onClick={() => {
                              setEditingCampaign({ clientName: '', videoUrl: '', targetUrl: '', placements: ['home'], isPaidClient: false, active: true });
                              setIsCampaignModalOpen(true);
                           }}
                           className="bg-trini-black text-white px-4 py-2 rounded font-bold text-sm hover:bg-gray-800 shadow flex items-center"
                        >
                           <PlayCircle className="h-4 w-4 mr-2" /> New Video Campaign
                        </button>
                     </div>

                     {/* Stats Row */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                           <p className="text-xs font-bold text-gray-500 uppercase">Total Impressions</p>
                           <h3 className="text-2xl font-extrabold text-gray-900 mt-2">{trafficStats.adImpressions.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                           <p className="text-xs font-bold text-gray-500 uppercase">Video Views</p>
                           <h3 className="text-2xl font-extrabold text-gray-900 mt-2">{trafficStats.videoViews.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                           <p className="text-xs font-bold text-gray-500 uppercase">Click-Through Rate</p>
                           <h3 className="text-2xl font-extrabold text-blue-600 mt-2">{trafficStats.ctr}%</h3>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                           <p className="text-xs font-bold text-gray-500 uppercase">Est. Revenue</p>
                           <h3 className="text-2xl font-extrabold text-green-600 mt-2">$2,140.50</h3>
                        </div>
                     </div>

                     {/* Campaign List */}
                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                           <h3 className="font-bold text-lg text-gray-900">Active Campaigns</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                              <tr>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Client</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Placements</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Performance</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                 <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                              {campaigns.map((campaign) => (
                                 <tr key={campaign.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                       <div className="font-bold text-sm text-gray-900">{campaign.clientName}</div>
                                       <div className="text-xs text-blue-600 truncate max-w-[150px]">{campaign.targetUrl}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex flex-wrap gap-1">
                                          {campaign.placements.map(p => (
                                             <span key={p} className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                                                {p}
                                             </span>
                                          ))}
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="text-xs">
                                          <span className="font-bold">{campaign.views.toLocaleString()}</span> views
                                       </div>
                                       <div className="text-xs text-gray-500">
                                          {campaign.clicks} clicks ({(campaign.clicks / (campaign.views || 1) * 100).toFixed(1)}%)
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       {campaign.isPaidClient && (
                                          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded mr-2">
                                             BOOSTED
                                          </span>
                                       )}
                                       <span className={`text-xs font-bold ${campaign.active ? 'text-green-600' : 'text-gray-400'}`}>
                                          {campaign.active ? 'Active' : 'Paused'}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <button
                                          onClick={() => {
                                             setEditingCampaign(campaign);
                                             setIsCampaignModalOpen(true);
                                          }}
                                          className="text-blue-600 hover:text-blue-800 mr-3"
                                       >
                                          <SettingsIcon className="h-4 w-4" />
                                       </button>
                                       <button
                                          onClick={() => handleDeleteCampaign(campaign.id)}
                                          className="text-red-400 hover:text-red-600"
                                       >
                                          <X className="h-4 w-4" />
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {/* VIEW: INTEGRATIONS (Next Level Tools) */}
               {activeView === 'integrations' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                     <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-8 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-2">Platform Architecture</h2>
                        <p className="text-blue-200">Manage your cloud connections and scale your infrastructure.</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {integrations.map(tool => (
                           <div key={tool.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
                              <div className="flex gap-4">
                                 <div className={`p-3 rounded-xl bg-gray-50 ${tool.color}`}>
                                    <tool.icon className="h-8 w-8" />
                                 </div>
                                 <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{tool.name}</h3>
                                    <p className="text-sm text-gray-500 mb-2">{tool.desc}</p>
                                    <span className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-full ${tool.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                       {tool.connected ? 'Active' : 'Not Configured'}
                                    </span>
                                 </div>
                              </div>
                              <button
                                 onClick={() => toggleIntegration(tool.id)}
                                 className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tool.connected ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                              >
                                 {tool.connected ? 'Configure' : 'Connect'}
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* VIEW: SYSTEM OVERRIDES (God Mode Controls) */}
               {activeView === 'system' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                     <div className="bg-red-900 text-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold flex items-center">
                           <ShieldAlert className="h-8 w-8 mr-3" /> System Overrides
                        </h2>
                        <p className="text-red-200 mt-2">Dangerous actions. Use with caution.</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
                           <h3 className="font-bold text-red-800 mb-2">Emergency Kill Switch</h3>
                           <p className="text-xs text-gray-500 mb-4">Disables new signups and orders platform-wide.</p>
                           <button className="w-full bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700 flex items-center justify-center">
                              <Power className="h-4 w-4 mr-2" /> SHUT DOWN PLATFORM
                           </button>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                           <h3 className="font-bold text-blue-800 mb-2">Global Notification</h3>
                           <p className="text-xs text-gray-500 mb-4">Sends a push alert to all active users.</p>
                           <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 flex items-center justify-center">
                              <Bell className="h-4 w-4 mr-2" /> Broadcast Alert
                           </button>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-yellow-100 shadow-sm">
                           <h3 className="font-bold text-yellow-800 mb-2">Force Indexing</h3>
                           <p className="text-xs text-gray-500 mb-4">Manually triggers Google Indexing for all new store pages.</p>
                           <button className="w-full bg-yellow-500 text-white py-2 rounded font-bold hover:bg-yellow-600 flex items-center justify-center">
                              <Globe className="h-4 w-4 mr-2" /> Update Sitemap
                           </button>
                        </div>
                     </div>
                  </div>
               )}

            </div>
         </main>

         {/* Blog Generation Modal */}
         {isBlogModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
               <div className="bg-white rounded-xl p-8 w-full max-w-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                     <FileEdit className="h-5 w-5 mr-2 text-trini-red" /> AI Article Writer
                  </h2>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">Topic / Title Idea</label>
                        <input
                           type="text"
                           value={blogPrompt.topic}
                           onChange={(e) => setBlogPrompt({ ...blogPrompt, topic: e.target.value })}
                           className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                           placeholder="e.g. Benefits of Ridesharing in Port of Spain"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">SEO Keywords (Comma Sep)</label>
                        <input
                           type="text"
                           value={blogPrompt.keywords}
                           onChange={(e) => setBlogPrompt({ ...blogPrompt, keywords: e.target.value })}
                           className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                           placeholder="e.g. taxi trinidad, safe rides, transport"
                        />
                     </div>
                     <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setIsBlogModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button
                           onClick={handleGenerateBlog}
                           disabled={isGeneratingBlog || !blogPrompt.topic}
                           className="px-4 py-2 bg-trini-red text-white rounded font-bold flex items-center disabled:opacity-50"
                        >
                           {isGeneratingBlog ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                           Generate & Publish
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Verification Modal */}
         {isVerifyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
               <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden">
                  <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                     <h3 className="font-bold flex items-center"><ShieldAlert className="mr-2" /> Override Verification</h3>
                     <button onClick={() => setIsVerifyModalOpen(false)}><X /></button>
                  </div>
                  <div className="p-6">
                     <p className="mb-4 text-sm text-gray-600">Force verifying <strong>{vendorToVerify?.name}</strong> will bypass AI checks.</p>
                     <div className="flex gap-4">
                        <button onClick={handleApproveVerification} className="flex-1 bg-green-600 text-white py-3 rounded font-bold">
                           Force Approve (God Mode)
                        </button>
                        <button onClick={handleRunVerification} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold">
                           Run Standard AI Scan
                        </button>
                     </div>

                     {/* Hidden file input for standard flow support if needed */}
                     <input type="file" className="hidden" onChange={handleDocUpload} id="admin-doc-upload" />
                  </div>
               </div>
            </div>
         )}

         {/* Campaign Modal */}
         {isCampaignModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
               <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                     <PlayCircle className="h-5 w-5 mr-2 text-trini-red" />
                     {editingCampaign.id ? 'Edit Campaign' : 'Create New Campaign'}
                  </h2>

                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-bold text-gray-900 mb-1">Client Name</label>
                           <input
                              type="text"
                              value={editingCampaign.clientName}
                              onChange={(e) => setEditingCampaign({ ...editingCampaign, clientName: e.target.value })}
                              className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                              placeholder="e.g. Massy Motors"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-900 mb-1">Target URL</label>
                           <input
                              type="text"
                              value={editingCampaign.targetUrl}
                              onChange={(e) => setEditingCampaign({ ...editingCampaign, targetUrl: e.target.value })}
                              className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                              placeholder="https://..."
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">Video Asset URL</label>
                        <input
                           type="text"
                           value={editingCampaign.videoUrl}
                           onChange={(e) => setEditingCampaign({ ...editingCampaign, videoUrl: e.target.value })}
                           className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                           placeholder="https://storage.googleapis.com/..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Direct link to MP4 file required.</p>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Placements (Where to show)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                           {['home', 'marketplace', 'rides', 'jobs', 'tickets', 'real_estate'].map(p => (
                              <label key={p} className={`flex items-center p-3 rounded border cursor-pointer transition-colors ${editingCampaign.placements?.includes(p as any) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                 <input
                                    type="checkbox"
                                    checked={editingCampaign.placements?.includes(p as any)}
                                    onChange={() => togglePlacement(p)}
                                    className="mr-2"
                                 />
                                 <span className="capitalize font-medium text-sm">{p.replace('_', ' ')}</span>
                              </label>
                           ))}
                        </div>
                     </div>

                     <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-center justify-between">
                        <div>
                           <h4 className="font-bold text-purple-900">Paid Customer Boost</h4>
                           <p className="text-xs text-purple-700">Prioritize this campaign over free tier ads.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                           <input
                              type="checkbox"
                              checked={editingCampaign.isPaidClient}
                              onChange={(e) => setEditingCampaign({ ...editingCampaign, isPaidClient: e.target.checked })}
                              className="sr-only peer"
                           />
                           <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                     </div>

                     <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                           onClick={() => setIsCampaignModalOpen(false)}
                           className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium"
                        >
                           Cancel
                        </button>
                        <button
                           onClick={handleSaveCampaign}
                           className="px-6 py-2 bg-trini-black text-white rounded font-bold hover:bg-gray-800"
                        >
                           Save Campaign
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

      </div>
   );
};
