import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { realEstateService, RealEstateListing } from '../services/realEstateService';
import { Plus, Home, MessageSquare, Trash2, Edit, MapPin, DollarSign, Image as ImageIcon, Check, X, LayoutGrid, List as ListIcon, Loader2, Phone, Mail, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RealEstateAgentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'listings' | 'create' | 'leads'>('listings');
    const [listings, setListings] = useState<RealEstateListing[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form State for Create/Edit
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        listing_type: 'sale',
        property_type: 'house',
        bedrooms: '',
        bathrooms: '',
        sqft: '',
        address: '',
        city: '',
        region: 'North',
        images: '', // Comma separated URLs for now
        features: '' // Comma separated
    });

    useEffect(() => {
        checkUser();
    }, []);

    useEffect(() => {
        if (user) {
            if (activeTab === 'listings') fetchListings();
            if (activeTab === 'leads') fetchLeads();
        }
    }, [user, activeTab]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth'); // Redirect if not logged in
        } else {
            setUser(user);
        }
    };

    const fetchListings = async () => {
        setLoading(true);
        const data = await realEstateService.getMyListings(user.id);
        setListings(data);
        setLoading(false);
    };

    const fetchLeads = async () => {
        setLoading(true);
        const data = await realEstateService.getAgentLeads(user.id);
        setLeads(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this listing?')) {
            await realEstateService.deleteListing(id);
            fetchListings();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const files = Array.from(e.target.files);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('real-estate')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('real-estate')
                    .getPublicUrl(filePath);

                newUrls.push(publicUrl);
            }

            // Append to existing images
            const currentImages = formData.images ? formData.images.split(',').map(s => s.trim()).filter(s => s) : [];
            const allImages = [...currentImages, ...newUrls];
            setFormData({ ...formData, images: allImages.join(', ') });

        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Make sure you have applied the storage migration.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const imagesArray = formData.images.split(',').map(s => s.trim()).filter(s => s);
            const featuresArray = formData.features.split(',').map(s => s.trim()).filter(s => s);

            await realEstateService.createListing({
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                listing_type: formData.listing_type as any,
                property_type: formData.property_type as any,
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                sqft: Number(formData.sqft),
                address: formData.address,
                city: formData.city,
                region: formData.region,
                agent_id: user.id,
                status: 'active'
            }, imagesArray, featuresArray);

            alert('Listing Created Successfully!');
            setFormData({
                title: '', description: '', price: '', listing_type: 'sale', property_type: 'house',
                bedrooms: '', bathrooms: '', sqft: '', address: '', city: '', region: 'North', images: '', features: ''
            });
            setActiveTab('listings');
        } catch (error) {
            console.error(error);
            alert('Error creating listing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Home className="text-blue-600" /> Agent Hub
                    </h2>
                </div>
                <nav className="flex-grow p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('listings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'listings' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ListIcon className="h-5 w-5" /> My Listings
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'create' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Plus className="h-5 w-5" /> Create Listing
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'leads' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <MessageSquare className="h-5 w-5" /> Lead Inbox
                        {leads.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{leads.length}</span>}
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-grow p-8 overflow-y-auto h-screen">
                {/* Mobile Header */}
                <div className="md:hidden mb-6 flex gap-2 overflow-x-auto pb-2">
                    <button onClick={() => setActiveTab('listings')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${activeTab === 'listings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>My Listings</button>
                    <button onClick={() => setActiveTab('create')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>Create New</button>
                    <button onClick={() => setActiveTab('leads')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${activeTab === 'leads' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>Leads</button>
                </div>

                {activeTab === 'listings' && (
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
                            <button onClick={() => setActiveTab('create')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Add New
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                        ) : listings.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                                <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No listings yet</h3>
                                <p className="text-gray-500 mb-6">Create your first property listing to get started.</p>
                                <button onClick={() => setActiveTab('create')} className="text-blue-600 font-bold hover:underline">Create Listing</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {listings.map(listing => (
                                    <div key={listing.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="h-48 bg-gray-100 relative">
                                            <img src={listing.images?.[0]?.url || 'https://via.placeholder.com/400'} alt={listing.title} className="w-full h-full object-cover" />
                                            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold uppercase ${listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {listing.status}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 truncate mb-1">{listing.title}</h3>
                                            <p className="text-sm text-gray-500 mb-4">{listing.address}</p>
                                            <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                                                <span className="font-bold text-lg">${listing.price.toLocaleString()}</span>
                                                <div className="flex gap-2">
                                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" aria-label="Edit listing"><Edit className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDelete(listing.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full" aria-label="Delete listing"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Listing</h1>
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">

                            {/* Section 1: Basic Info */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Home className="h-5 w-5 text-blue-600" /> Property Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Listing Title</label>
                                        <input id="title" required type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Modern Apartment in Woodbrook" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (TTD)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                            <input id="price" required type="number" className="w-full pl-9 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="listing_type" className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
                                        <select id="listing_type" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.listing_type} onChange={e => setFormData({ ...formData, listing_type: e.target.value })}>
                                            <option value="sale">For Sale</option>
                                            <option value="rent">For Rent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                                        <select id="property_type" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.property_type} onChange={e => setFormData({ ...formData, property_type: e.target.value })}>
                                            <option value="house">House</option>
                                            <option value="apartment">Apartment</option>
                                            <option value="condo">Condo</option>
                                            <option value="land">Land</option>
                                            <option value="commercial">Commercial</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Specs */}
                            <div className="border-t border-gray-100 pt-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-blue-600" /> Specifications</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                                        <input id="bedrooms" required type="number" className="w-full p-3 border border-gray-300 rounded-lg" value={formData.bedrooms} onChange={e => setFormData({ ...formData, bedrooms: e.target.value })} />
                                    </div>
                                    <div>
                                        <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                                        <input id="bathrooms" required type="number" className="w-full p-3 border border-gray-300 rounded-lg" value={formData.bathrooms} onChange={e => setFormData({ ...formData, bathrooms: e.target.value })} />
                                    </div>
                                    <div>
                                        <label htmlFor="sqft" className="block text-sm font-medium text-gray-700 mb-1">Sq Ft</label>
                                        <input id="sqft" required type="number" className="w-full p-3 border border-gray-300 rounded-lg" value={formData.sqft} onChange={e => setFormData({ ...formData, sqft: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Location */}
                            <div className="border-t border-gray-100 pt-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-600" /> Location</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                        <input id="address" required type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="123 Example St" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                    </div>
                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input id="city" required type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Port of Spain" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                    </div>
                                    <div>
                                        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                                        <select id="region" className="w-full p-3 border border-gray-300 rounded-lg" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })}>
                                            <option value="North">North</option>
                                            <option value="South">South</option>
                                            <option value="East">East</option>
                                            <option value="West">West</option>
                                            <option value="Central">Central</option>
                                            <option value="Tobago">Tobago</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Media & Description */}
                            <div className="border-t border-gray-100 pt-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-blue-600" /> Media & Description</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea id="description" required rows={4} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Describe the property..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                                    </div>

                                    {/* Image Upload UI */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Property Images</label>
                                        <div className="mb-4">
                                            <div className="flex items-center gap-4 mb-2">
                                                <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                    {uploading ? 'Uploading...' : 'Upload Photos'}
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleImageUpload}
                                                        disabled={uploading}
                                                    />
                                                </label>
                                                <span className="text-xs text-gray-500">or enter URLs below</span>
                                            </div>

                                            {/* Preview Grid */}
                                            {formData.images && (
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {formData.images.split(',').map((url, idx) => url.trim() && (
                                                        <div key={idx} className="relative w-20 h-20 group">
                                                            <img src={url.trim()} alt="Preview" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const urls = formData.images.split(',').map(s => s.trim()).filter(s => s);
                                                                    urls.splice(idx, 1);
                                                                    setFormData({ ...formData, images: urls.join(', ') });
                                                                }}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <label htmlFor="images" className="block text-xs font-medium text-gray-500 mb-1">Image URLs (Comma Separated)</label>
                                        <textarea id="images" rows={2} className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm text-gray-600" placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" value={formData.images} onChange={e => setFormData({ ...formData, images: e.target.value })}></textarea>
                                    </div>

                                    <div>
                                        <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-1">Features (Comma Separated)</label>
                                        <input id="features" type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Pool, Gym, Gated, AC" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setActiveTab('listings')} className="px-6 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
                                <button type="submit" disabled={loading} className="px-8 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg disabled:opacity-50">
                                    {loading ? 'Publishing...' : 'Publish Listing'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {
                    activeTab === 'leads' && (
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">Lead Inbox</h1>
                            {loading ? (
                                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                            ) : leads.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">No leads yet</h3>
                                    <p className="text-gray-500">Inquiries from potential buyers/renters will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {leads.map(lead => (
                                        <div key={lead.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900">{lead.name}</h3>
                                                    <p className="text-sm text-gray-500">Interested in: <span className="font-medium text-blue-600">{lead.listing?.title || 'Unknown Property'}</span></p>
                                                </div>
                                                <span className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 mb-4 text-sm">
                                                "{lead.message}"
                                            </div>
                                            <div className="flex gap-4 text-sm">
                                                <a href={`tel:${lead.phone}`} className="flex items-center text-green-600 font-bold hover:underline"><Phone className="h-4 w-4 mr-1" /> {lead.phone}</a>
                                                {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center text-blue-600 font-bold hover:underline"><Mail className="h-4 w-4 mr-1" /> {lead.email}</a>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }
            </div >
        </div >
    );
};
