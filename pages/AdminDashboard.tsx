
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
import { AdminLayout } from '../layouts/AdminLayout';

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
      sort_order: 1,
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
            sort_order: 1,
            active: true
         });
         alert('Video placement saved successfully');
      } catch (error: any) {
         console.error('Error saving video:', error);
         if (error.message?.includes('violates row-level security')) {
            alert('Permission Error: You must be logged in as an admin to save videos.');
         } else if (error.code === '23505' || error.message?.includes('unique constraint')) {
            alert('Duplicate Error: A video with this Sort Order already exists for this Page and Section. Please choose a different Sort Order.');
         } else {
            alert(`Failed to save video placement: ${error.message || 'Unknown error'}`);
         }
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

   const RightPanel = () => (
      <>
         <div className="admin-card mb-4">
            <div className="flex items-center gap-3 mb-4">
               <div className="h-10 w-10 bg-trini-black rounded-full flex items-center justify-center text-white font-bold">SU</div>
               <div>
                  <h4 className="font-bold text-gray-900">Super User</h4>
                  <p className="text-xs text-gray-500">Admin Access</p>
               </div>
            </div>
            <div className="bg-red-100 text-red-800 text-xs font-bold px-3 py-2 rounded-lg flex items-center border border-red-200">
               <ShieldAlert className="h-4 w-4 mr-2" />
               God Mode Active
            </div>
         </div>

         <div className="admin-card mb-4">
            <h3 className="font-bold text-gray-900 mb-3">System Status</h3>
            <div className="space-y-2">
               <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Server</span>
                  <span className="text-green-600 font-bold">Online</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Database</span>
                  <span className="text-green-600 font-bold">Healthy</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Storage</span>
                  <span className="text-green-600 font-bold">98% Free</span>
               </div>
            </div>
         </div>
      </>
   );

   return (
      <AdminLayout activeView={activeView} setActiveView={setActiveView} rightPanel={<RightPanel />}>
         {/* VIEW: OVERVIEW */}
         {activeView === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Overview</h1>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                     { label: 'Total Revenue', value: 'TT$ 12,450', sub: '+15% this month', icon: DollarSign, color: 'bg-green-100 text-green-600' },
                     { label: 'Total Users', value: '1,240', sub: '85 New today', icon: Users, color: 'bg-blue-100 text-blue-600' },
                     { label: 'Active Stores', value: '45', sub: '3 Pending Approval', icon: Globe, color: 'bg-purple-100 text-purple-600' },
                     { label: 'Pending Tickets', value: '12', sub: 'Action Required', icon: Ticket, color: 'bg-orange-100 text-orange-600' },
                  ].map((stat, i) => (
                     <div key={i} className="admin-card">
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
                  <div className="admin-card">
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
                  <div className="admin-card">
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

               <div className="admin-card overflow-hidden h-[600px] relative p-0">
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
                  <div className="admin-card">
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
                  <div className="admin-card">
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
                  <div className="lg:col-span-2 admin-card">
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

                  <div className="admin-card">
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
               <h2 className="text-2xl font-bold text-gray-900">Video Manager</h2>
               {/* Video Placements Grid */}
               <div className="grid grid-cols-1 gap-6">
                  {AVAILABLE_PAGES.map(page => {
                     const pageVideos = videos.filter(v => v.page === page.value);
                     return (
                        <div key={page.value} className="admin-card overflow-hidden p-0">
                           <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                              <div>
                                 <h3 className="font-bold text-lg text-gray-900">{page.label}</h3>
                                 <p className="text-xs text-gray-500">{pageVideos.length} video placement(s)</p>
                              </div>
                              <button
                                 onClick={() => {
                                    const maxOrder = pageVideos.reduce((max, v) => Math.max(max, v.sort_order || 0), 0);
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
                                       sort_order: maxOrder + 1,
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
                                             <div className="flex gap-2">
                                                <span className={`text-xs px-2 py-1 rounded font-bold ${video.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                   {video.active ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-bold">
                                                   Section: {video.section}
                                                </span>
                                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-bold">
                                                   Order: {video.sort_order}
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

         {/* VIEW: MONETIZATION (Campaigns) */}
         {activeView === 'monetization' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Traffic & Monetization</h2>
                  <button onClick={() => setIsCampaignModalOpen(true)} className="bg-trini-red text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700">
                     + New Campaign
                  </button>
               </div>
               <div className="admin-card overflow-hidden p-0">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Client</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Views</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Clicks</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {campaigns.map(campaign => (
                           <tr key={campaign.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="text-sm font-bold text-gray-900">{campaign.clientName}</div>
                                 <div className="text-xs text-gray-500">{campaign.placements.join(', ')}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${campaign.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {campaign.active ? 'Active' : 'Inactive'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.views}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.clicks}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                 <button onClick={() => handleDeleteCampaign(campaign.id)} className="text-red-600 hover:text-red-900">Delete</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* VIEW: STORES (Vendors) */}
         {activeView === 'stores' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
               <div className="admin-card overflow-hidden p-0">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Vendor</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Owner</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Plan</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {vendors.map(vendor => (
                           <tr key={vendor.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="text-sm font-bold text-gray-900">{vendor.name}</div>
                                 <div className="text-xs text-gray-500">{vendor.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.owner}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${vendor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {vendor.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.plan}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                 <button onClick={() => handleToggleStatus(vendor.id, 'vendor')} className="text-blue-600 hover:text-blue-900">
                                    {vendor.status === 'active' ? 'Ban' : 'Unban'}
                                 </button>
                                 <button onClick={() => handleGiftPremium(vendor.id, 'vendor')} className="text-purple-600 hover:text-purple-900">Gift Premium</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* VIEW: USERS */}
         {activeView === 'users' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
               <div className="admin-card overflow-hidden p-0">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">User</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Activity</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                           <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                 <div className="text-xs text-gray-500">{user.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {user.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                 {user.role === 'DRIVER' ? `${user.rides} rides` : `${user.orders} orders`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                 <button onClick={() => handleToggleStatus(user.id, 'user')} className="text-blue-600 hover:text-blue-900">
                                    {user.status === 'active' ? 'Ban' : 'Unban'}
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* VIEW: INTEGRATIONS */}
         {activeView === 'integrations' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <h2 className="text-2xl font-bold text-gray-900">System Integrations</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {integrations.map(integration => (
                     <div key={integration.id} className="admin-card flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-lg bg-gray-100 ${integration.color}`}>
                              <integration.icon className="h-6 w-6" />
                           </div>
                           <div>
                              <h3 className="font-bold text-gray-900">{integration.name}</h3>
                              <p className="text-xs text-gray-500">{integration.desc}</p>
                           </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" checked={integration.connected} onChange={() => toggleIntegration(integration.id)} />
                           <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Modals */}
         <VideoPlacementModal
            isOpen={isVideoModalOpen}
            editingVideo={editingVideo}
            onClose={() => setIsVideoModalOpen(false)}
            onSave={handleSaveVideo}
            onVideoChange={setEditingVideo}
         />
      </AdminLayout>
   );
};
