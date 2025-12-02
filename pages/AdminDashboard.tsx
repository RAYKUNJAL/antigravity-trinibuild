
import React, { useState, useEffect } from 'react';
import {
   Users, DollarSign, Ban, CheckCircle, Search, Gift, MessageCircle, Mail,
   ShieldAlert, MoreVertical, LayoutDashboard, Settings as SettingsIcon,
   UploadCloud, Loader2, FileText, X, Briefcase, Ticket, TrendingUp,
   Activity, Globe, Bell, LogOut, Menu, ChevronRight, BarChart2, PieChart as PieChartIcon, PlayCircle, Sliders, FileEdit, Key, Eye, AlertTriangle, Power, Database, Layers, Server, Cpu, Map as MapIcon, Video, Save, Upload, Image as ImageIcon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SubscriptionTier, BlogPost } from '../types';
import { authService } from '../services/authService';
import { Link } from 'react-router-dom';
import { verifyBusinessDocument, generateBlogPost } from '../services/geminiService';
import { getCampaigns, saveCampaign, deleteCampaign, AdCampaign, getTrafficStats } from '../services/adService';
import { adminService, SiteSetting } from '../services/adminService';
import { videoService, VideoPlacement, AVAILABLE_PAGES, PAGE_SECTIONS } from '../services/videoService';
import { VideoPlacementModal } from '../components/VideoPlacementModal';
import { videoAnalyticsService, VideoPerformance } from '../services/videoAnalyticsService';
import { VideoAnalyticsDashboard } from '../components/VideoAnalyticsDashboard';

const REVENUE_DATA = [
   { name: 'Jan', revenue: 1200 },
   { name: 'Feb', revenue: 1900 },
   { name: 'Mar', revenue: 3000 },
   { name: 'Apr', revenue: 2500 },
   { name: 'May', revenue: 4200 },
   { name: 'Jun', revenue: 5500 },
];

export const AdminDashboard: React.FC = () => {
   const [activeView, setActiveView] = useState<'overview' | 'stores' | 'users' | 'jobs' | 'content' | 'monetization' | 'system' | 'integrations' | 'payments' | 'analytics' | 'settings' | 'videos' | 'video-analytics'>('overview');
   const [isSidebarOpen, setSidebarOpen] = useState(true);

   // Site Settings Logic
   const [settings, setSettings] = useState<Record<string, string>>({});
   const [loadingSettings, setLoadingSettings] = useState(false);
   const [uploading, setUploading] = useState(false);

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

   // Video Management Logic
   const [videos, setVideos] = useState<VideoPlacement[]>([]);
   const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
   const [editingVideo, setEditingVideo] = useState<Partial<VideoPlacement>>({
      page: 'home',
      section: 'hero',
      video_url: '',
      title: '',
      description: '',
      autoplay: false,
      loop: false,
      muted: true,
      controls: true,
      position: 1,
      active: true
   });

   // Video Analytics Logic
   const [videoPerformance, setVideoPerformance] = useState<VideoPerformance[]>([]);
   const [totalVideoStats, setTotalVideoStats] = useState({ views: 0, clicks: 0, completions: 0 });
   const [loadingAnalytics, setLoadingAnalytics] = useState(false);

   useEffect(() => {
      setCampaigns(getCampaigns());
      setTrafficStats(getTrafficStats());
      loadSettings();
      loadVideos();
      loadVideoAnalytics();
   }, []);

   const loadSettings = async () => {
      setLoadingSettings(true);
      try {
         const data = await adminService.getSettings();
         const settingsMap: Record<string, string> = {};
         data.forEach(s => settingsMap[s.key] = s.value);
         setSettings(settingsMap);
      } catch (error) {
         console.error("Failed to load settings", error);
      } finally {
         setLoadingSettings(false);
      }
   };

   const handleUpdateSetting = async (key: string, value: string) => {
      try {
         await adminService.updateSetting(key, value);
         setSettings(prev => ({ ...prev, [key]: value }));
         alert('Setting updated successfully');
      } catch (error) {
         alert('Failed to update setting');
      }
   };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
         const url = await adminService.uploadAsset(file, 'hero');
         await handleUpdateSetting(settingKey, url);
      } catch (error) {
         alert('Upload failed');
      } finally {
         setUploading(false);
      }
   };

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

   // Video Management Functions
   const loadVideos = async () => {
      try {
         const data = await videoService.getVideoPlacements();
         setVideos(data);
      } catch (error) {
         console.error("Failed to load videos", error);
      }
   };

   const handleSaveVideo = async () => {
      if (!editingVideo.video_url || !editingVideo.title) {
         alert('Please fill in required fields');
         return;
      }

      try {
         await videoService.saveVideoPlacement(editingVideo);
         await loadVideos();
         setIsVideoModalOpen(false);
         setEditingVideo({
            page: 'home',
            section: 'hero',
            video_url: '',
            title: '',
            description: '',
            autoplay: false,
            loop: false,
            muted: true,
            controls: true,
            position: 1,
            active: true
         });
         alert('Video placement saved successfully');
      } catch (error) {
         alert('Failed to save video placement');
      }
   };

   const handleDeleteVideo = async (id: string) => {
      if (confirm('Are you sure you want to delete this video placement?')) {
         try {
            await videoService.deleteVideoPlacement(id);
            await loadVideos();
            alert('Video placement deleted');
         } catch (error) {
            alert('Failed to delete video placement');
         }
      }
   };

   const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input
      e.target.value = '';

      setUploading(true);
      try {
         console.log(`Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

         const url = await videoService.uploadVideo(file, 'videos');
         setEditingVideo({ ...editingVideo, video_url: url });
         alert(`✅ Video uploaded successfully!\n\nURL: ${url}\n\nYou can now save this video placement.`);
      } catch (error: any) {
         console.error('Video upload error:', error);
         const errorMessage = error.message || 'Unknown error occurred';
         alert(`❌ Upload Failed\n\n${errorMessage}\n\nPlease try:\n• Using a smaller file (max 500MB)\n• Converting to MP4 format\n• Checking your internet connection\n• Contacting support if the issue persists`);
      } finally {
         setUploading(false);
      }
   };

   const getAvailableSections = (page: string) => {
      return PAGE_SECTIONS[page] || ['hero'];
   };

   // Video Analytics Functions
   const loadVideoAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
         const [performance, stats] = await Promise.all([
            videoAnalyticsService.getPerformanceMetrics(),
            videoAnalyticsService.getTotalStats()
         ]);
         setVideoPerformance(performance);
         setTotalVideoStats(stats);
      } catch (error) {
         console.error("Failed to load video analytics", error);
      } finally {
         setLoadingAnalytics(false);
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

            <nav className="flex-grow py-6 space-y-1 overflow-y-auto">
               {[
                  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                  { id: 'analytics', icon: MapIcon, label: 'Heatmaps & Data' },
                  { id: 'monetization', icon: BarChart2, label: 'Traffic & Ads' },
                  { id: 'payments', icon: DollarSign, label: 'Payments' },
                  { id: 'content', icon: FileEdit, label: 'Content & SEO' },
                  { id: 'videos', icon: Video, label: 'Video Manager' },
                  { id: 'video-analytics', icon: TrendingUp, label: 'Video Analytics' },
                  { id: 'stores', icon: Globe, label: 'Stores' },
                  { id: 'users', icon: Users, label: 'Users & Drivers' },
                  { id: 'jobs', icon: Briefcase, label: 'Jobs' },
                  { id: 'integrations', icon: Layers, label: 'Integrations' },
                  { id: 'settings', icon: Sliders, label: 'Site Control' },
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
               <button
                  onClick={async () => {
                     await authService.logout();
                  }}
                  className="flex items-center text-red-400 hover:text-red-300 transition-colors px-2 py-2 mt-2 w-full"
               >
                  <LogOut className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                  {isSidebarOpen && <span>Logout</span>}
               </button>
            </div>
         </aside>

         {/* Main Content */}
         <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
            {/* Top Bar */}
            <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
               <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-gray-700" aria-label="Toggle Sidebar">
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
                           { label: 'Total Revenue', value: 'TT$ 12,450', sub: '+15% this month', icon: DollarSign, color: 'bg-green-100 text-green-600' },
                           { label: 'Total Users', value: '1,240', sub: '85 New today', icon: Users, color: 'bg-blue-100 text-blue-600' },
                           { label: 'Active Stores', value: '45', sub: '3 Pending Approval', icon: Globe, color: 'bg-purple-100 text-purple-600' },
                           { label: 'Pending Tickets', value: '12', sub: 'Action Required', icon: Ticket, color: 'bg-orange-100 text-orange-600' },
                        ].map((stat, i) => (
                           <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                                    <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                                 </div>
                                 <div className={`p-3 rounded-lg ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <h3 className="font-bold text-lg mb-4">Revenue Trend</h3>
                           <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                 <AreaChart data={REVENUE_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="revenue" stroke="#ef4444" fill="#fee2e2" />
                                 </AreaChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <h3 className="font-bold text-lg mb-4">User Distribution</h3>
                           <div className="h-64 flex items-center justify-center">
                              <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie
                                       data={[
                                          { name: 'Customers', value: 800 },
                                          { name: 'Drivers', value: 200 },
                                          { name: 'Vendors', value: 45 },
                                       ]}
                                       cx="50%"
                                       cy="50%"
                                       innerRadius={60}
                                       outerRadius={80}
                                       fill="#8884d8"
                                       paddingAngle={5}
                                       dataKey="value"
                                    >
                                       <Cell fill="#0088FE" />
                                       <Cell fill="#00C49F" />
                                       <Cell fill="#FFBB28" />
                                    </Pie>
                                    <Tooltip />
                                 </PieChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* VIEW: ANALYTICS (Heatmaps) */}
               {activeView === 'analytics' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">Geospatial Intelligence</h2>
                        <div className="flex gap-2">
                           <button className="bg-white border border-gray-300 px-3 py-1 rounded text-sm font-bold">Last 24h</button>
                           <button className="bg-gray-900 text-white px-3 py-1 rounded text-sm font-bold">Live</button>
                        </div>
                     </div>

                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[600px] relative">
                        <MapContainer center={[10.6918, -61.2225]} zoom={10} style={{ height: '100%', width: '100%' }}>
                           <TileLayer
                              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                           />
                           {/* Mock Heatmap Data Points */}
                           {[
                              { lat: 10.65, lng: -61.50, intensity: 0.8, label: 'Port of Spain (High Activity)' },
                              { lat: 10.28, lng: -61.46, intensity: 0.6, label: 'San Fernando (Medium)' },
                              { lat: 10.63, lng: -61.40, intensity: 0.4, label: 'San Juan' },
                              { lat: 11.18, lng: -60.74, intensity: 0.3, label: 'Tobago' },
                           ].map((point, i) => (
                              <CircleMarker
                                 key={i}
                                 center={[point.lat, point.lng]}
                                 radius={20 * point.intensity}
                                 fillColor={point.intensity > 0.7 ? '#ef4444' : point.intensity > 0.5 ? '#f59e0b' : '#3b82f6'}
                                 color="transparent"
                                 fillOpacity={0.6}
                              >
                                 <Popup>
                                    <strong>{point.label}</strong><br />
                                    Activity Level: {Math.round(point.intensity * 100)}%
                                 </Popup>
                              </CircleMarker>
                           ))}
                        </MapContainer>
                        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-[1000]">
                           <h4 className="font-bold text-sm mb-2">Activity Legend</h4>
                           <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded-full bg-red-500"></div> High Traffic</div>
                           <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Medium Traffic</div>
                           <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Low Traffic</div>
                        </div>
                     </div>
                  </div>
               )}

               {/* VIEW: SITE CONTROL (Settings) */}
               {activeView === 'settings' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <h2 className="text-2xl font-bold text-gray-900">Site Configuration</h2>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Branding Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <h3 className="font-bold text-lg mb-4 flex items-center"><ImageIcon className="mr-2 h-5 w-5" /> Branding & Assets</h3>

                           <div className="space-y-4">
                              <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Hero Title</label>
                                 <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={settings['hero_title'] || ''}
                                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                                 />
                                 <button onClick={() => handleUpdateSetting('hero_title', settings['hero_title'])} className="text-xs text-blue-600 font-bold mt-1 hover:underline">Save</button>
                              </div>

                              <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Hero Subtitle</label>
                                 <textarea
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={settings['hero_subtitle'] || ''}
                                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                                 />
                                 <button onClick={() => handleUpdateSetting('hero_subtitle', settings['hero_subtitle'])} className="text-xs text-blue-600 font-bold mt-1 hover:underline">Save</button>
                              </div>

                              <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Hero Image</label>
                                 {settings['hero_image_url'] && (
                                    <img src={settings['hero_image_url']} alt="Hero" className="w-full h-32 object-cover rounded mb-2" />
                                 )}
                                 <div className="flex gap-2">
                                    <input
                                       type="text"
                                       className="flex-1 border border-gray-300 rounded p-2 text-sm"
                                       placeholder="Image URL"
                                       value={settings['hero_image_url'] || ''}
                                       onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value })}
                                    />
                                    <label className="bg-gray-900 text-white px-3 py-2 rounded cursor-pointer hover:bg-gray-800 flex items-center">
                                       {uploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                                       <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'hero_image_url')} accept="image/*" />
                                    </label>
                                 </div>
                                 <button onClick={() => handleUpdateSetting('hero_image_url', settings['hero_image_url'])} className="text-xs text-blue-600 font-bold mt-1 hover:underline">Save URL</button>
                              </div>
                           </div>
                        </div>

                        {/* Media Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <h3 className="font-bold text-lg mb-4 flex items-center"><Video className="mr-2 h-5 w-5" /> Media & Promo</h3>

                           <div className="space-y-4">
                              <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Promo Video URL (YouTube/MP4)</label>
                                 <div className="flex gap-2">
                                    <input
                                       type="text"
                                       className="flex-1 border border-gray-300 rounded p-2"
                                       value={settings['promo_video_url'] || ''}
                                       onChange={(e) => setSettings({ ...settings, promo_video_url: e.target.value })}
                                    />
                                    <label className="bg-gray-900 text-white px-3 py-2 rounded cursor-pointer hover:bg-gray-800 flex items-center">
                                       {uploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                                       <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'promo_video_url')} accept="video/*" />
                                    </label>
                                 </div>
                                 <button onClick={() => handleUpdateSetting('promo_video_url', settings['promo_video_url'])} className="text-xs text-blue-600 font-bold mt-1 hover:underline">Save</button>
                              </div>

                              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                 <h4 className="font-bold text-sm mb-2">Video Preview</h4>
                                 {settings['promo_video_url'] ? (
                                    <video src={settings['promo_video_url']} controls className="w-full rounded" />
                                 ) : (
                                    <div className="text-center text-gray-400 py-8">No video selected</div>
                                 )}
                              </div>
                           </div>
                        </div>
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
                                 <input type="text" aria-label="Global Meta Title" className="w-full border border-gray-300 bg-white text-gray-900 rounded p-2 text-sm" defaultValue="TriniBuild - Trinidad Business Directory" />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-gray-900 uppercase mb-1">Target Keywords (Comma Sep)</label>
                                 <textarea rows={3} aria-label="Target Keywords" className="w-full border border-gray-300 bg-white text-gray-900 rounded p-2 text-sm" defaultValue="trinidad business, trinidad shopping, trini food, rideshare trinidad" />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-gray-900 uppercase mb-1">Robots.txt</label>
                                 <textarea rows={3} aria-label="Robots.txt Content" className="w-full border border-gray-300 bg-white text-gray-900 rounded p-2 text-sm font-mono" defaultValue="User-agent: * \nAllow: /" />
                              </div>
                              <button className="w-full bg-gray-900 text-white py-2 rounded font-bold text-sm hover:bg-gray-800">Update SEO Rules</button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* VIEW: VIDEO MANAGER */}
               {activeView === 'videos' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center">
                        <div>
                           <h2 className="text-2xl font-bold text-gray-900">Video Placement Manager</h2>
                           <p className="text-gray-500 text-sm">Control video placements across all pages and sections</p>
                        </div>
                        <button
                           onClick={() => {
                              setEditingVideo({
                                 page: 'home',
                                 section: 'hero',
                                 video_url: '',
                                 title: '',
                                 description: '',
                                 autoplay: false,
                                 loop: false,
                                 muted: true,
                                 controls: true,
                                 position: 1,
                                 active: true
                              });
                              setIsVideoModalOpen(true);
                           }}
                           className="bg-trini-red text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg hover:bg-red-700"
                        >
                           <Video className="h-4 w-4 mr-2" /> Add Video Placement
                        </button>
                     </div>

                     {/* Video Placements Grid */}
                     <div className="grid grid-cols-1 gap-6">
                        {AVAILABLE_PAGES.map(page => {
                           const pageVideos = videos.filter(v => v.page === page.value);
                           return (
                              <div key={page.value} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                 <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <div>
                                       <h3 className="font-bold text-lg text-gray-900">{page.label}</h3>
                                       <p className="text-xs text-gray-500">{pageVideos.length} video placement(s)</p>
                                    </div>
                                    <button
                                       onClick={() => {
                                          setEditingVideo({
                                             page: page.value,
                                             section: getAvailableSections(page.value)[0],
                                             video_url: '',
                                             title: '',
                                             description: '',
                                             autoplay: false,
                                             loop: false,
                                             muted: true,
                                             controls: true,
                                             position: pageVideos.length + 1,
                                             active: true
                                          });
                                          setIsVideoModalOpen(true);
                                       }}
                                       className="text-sm bg-gray-900 text-white px-3 py-1 rounded hover:bg-gray-800"
                                    >
                                       + Add to {page.label}
                                    </button>
                                 </div>

                                 {pageVideos.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                       <Video className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                       <p className="text-sm">No videos placed on this page yet</p>
                                    </div>
                                 ) : (
                                    <div className="divide-y divide-gray-200">
                                       {pageVideos.map(video => (
                                          <div key={video.id} className="p-4 hover:bg-gray-50 transition-colors">
                                             <div className="flex gap-4">
                                                {/* Video Preview */}
                                                <div className="flex-shrink-0 w-48 h-28 bg-gray-900 rounded overflow-hidden">
                                                   {video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be') ? (
                                                      <iframe
                                                         src={video.video_url}
                                                         className="w-full h-full"
                                                         frameBorder="0"
                                                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                      />
                                                   ) : (
                                                      <video src={video.video_url} className="w-full h-full object-cover" />
                                                   )}
                                                </div>

                                                {/* Video Info */}
                                                <div className="flex-1">
                                                   <div className="flex justify-between items-start mb-2">
                                                      <div>
                                                         <h4 className="font-bold text-gray-900">{video.title}</h4>
                                                         <p className="text-sm text-gray-500">{video.description}</p>
                                                      </div>
                                                      <div className="flex gap-2">
                                                         <button
                                                            onClick={() => {
                                                               setEditingVideo(video);
                                                               setIsVideoModalOpen(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800"
                                                         >
                                                            <FileEdit className="h-4 w-4" />
                                                         </button>
                                                         <button
                                                            onClick={() => handleDeleteVideo(video.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                         >
                                                            <X className="h-4 w-4" />
                                                         </button>
                                                      </div>
                                                   </div>

                                                   <div className="flex flex-wrap gap-2 text-xs">
                                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                                                         Section: {video.section}
                                                      </span>
                                                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                         Position: {video.position}
                                                      </span>
                                                      {video.autoplay && (
                                                         <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                            Autoplay
                                                         </span>
                                                      )}
                                                      {video.loop && (
                                                         <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                                            Loop
                                                         </span>
                                                      )}
                                                      {video.muted && (
                                                         <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                                            Muted
                                                         </span>
                                                      )}
                                                      <span className={`px-2 py-1 rounded font-bold ${video.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                         {video.active ? 'Active' : 'Inactive'}
                                                      </span>
                                                   </div>
                                                </div>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  </div>
               )}

               {/* VIEW: VIDEO ANALYTICS */}
               {activeView === 'video-analytics' && (
                  <VideoAnalyticsDashboard />
               )}

               {/* VIEW: STORES (Vendors) */}
               {activeView === 'stores' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
                        <div className="relative w-64">
                           <input
                              type="text" placeholder="Search vendors..."
                              aria-label="Search Vendors"
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
                                       <button onClick={() => setSelectedId(selectedId === vendor.id ? null : vendor.id)} className="text-gray-400 hover:text-gray-600" aria-label="Vendor Actions">
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
                                       <button onClick={() => setSelectedId(selectedId === user.id ? null : user.id)} className="text-gray-400 hover:text-gray-600" aria-label="User Actions">
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
                                          aria-label="Edit Campaign"
                                       >
                                          <SettingsIcon className="h-4 w-4" />
                                       </button>
                                       <button
                                          onClick={() => handleDeleteCampaign(campaign.id)}
                                          className="text-red-400 hover:text-red-600"
                                          aria-label="Delete Campaign"
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

               {/* VIEW: PAYMENTS (New) */}
               {activeView === 'payments' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                     <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">Payment Gateway</h2>
                        <div className="flex gap-2">
                           <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full flex items-center border border-blue-200">
                              PayPal: Active (Sandbox)
                           </span>
                           <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center border border-green-200">
                              WiPay: Coming Soon
                           </span>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <p className="text-xs font-bold text-gray-500 uppercase">Total Revenue (PayPal)</p>
                           <h3 className="text-3xl font-bold text-gray-900 mt-2">$0.00 <span className="text-sm text-gray-400 font-normal">USD</span></h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <p className="text-xs font-bold text-gray-500 uppercase">Pending Payouts</p>
                           <h3 className="text-3xl font-bold text-gray-900 mt-2">$0.00 <span className="text-sm text-gray-400 font-normal">USD</span></h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <p className="text-xs font-bold text-gray-500 uppercase">Transaction Count</p>
                           <h3 className="text-3xl font-bold text-gray-900 mt-2">0</h3>
                        </div>
                     </div>

                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                           <h3 className="font-bold text-lg text-gray-900">Recent Transactions</h3>
                        </div>
                        <div className="p-12 text-center text-gray-500">
                           <p>No transactions recorded yet.</p>
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
                           aria-label="Blog Topic"
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
                           aria-label="Blog Keywords"
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
                     <button onClick={() => setIsVerifyModalOpen(false)} aria-label="Close Modal"><X /></button>
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
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
