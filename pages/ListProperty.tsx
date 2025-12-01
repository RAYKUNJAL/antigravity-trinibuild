import React, { useState } from 'react';
import { Home, Upload, MapPin, DollarSign, Bed, Bath, Square, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ListProperty: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        listingType: 'sale',
        propertyType: 'house',
        title: '',
        description: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        sqft: '',
        address: '',
        city: '',
        zip: '',
        features: [] as string[]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // TODO: Implement actual listing creation with realEstateService
        setTimeout(() => {
            alert('Property listing submitted! (Note: Full implementation pending)');
            setLoading(false);
            navigate('/real-estate');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Property</h1>
                        <p className="text-gray-600">Fill out the details below to list your property for sale or rent.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Listing Type */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Listing Type</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, listingType: 'sale' })}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium border-2 transition-all ${formData.listingType === 'sale'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                        }`}
                                >
                                    For Sale
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, listingType: 'rent' })}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium border-2 transition-all ${formData.listingType === 'rent'
                                            ? 'border-green-600 bg-green-50 text-green-700'
                                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                        }`}
                                >
                                    For Rent
                                </button>
                            </div>
                        </div>

                        {/* Property Type */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Property Type</label>
                            <select
                                value={formData.propertyType}
                                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="house">House</option>
                                <option value="apartment">Apartment</option>
                                <option value="condo">Condo</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="land">Land</option>
                                <option value="commercial">Commercial</option>
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Property Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Beautiful 3BR Home in Maraval"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe your property..."
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Price and Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    <DollarSign className="inline h-4 w-4 mr-1" />
                                    Price (TTD)
                                </label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="5000000"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    <Square className="inline h-4 w-4 mr-1" />
                                    Square Feet
                                </label>
                                <input
                                    type="number"
                                    value={formData.sqft}
                                    onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
                                    placeholder="2000"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    <Bed className="inline h-4 w-4 mr-1" />
                                    Bedrooms
                                </label>
                                <input
                                    type="number"
                                    value={formData.bedrooms}
                                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                                    placeholder="3"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    <Bath className="inline h-4 w-4 mr-1" />
                                    Bathrooms
                                </label>
                                <input
                                    type="number"
                                    value={formData.bathrooms}
                                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                                    placeholder="2"
                                    step="0.5"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                <MapPin className="inline h-4 w-4 mr-1" />
                                Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="123 Main Street"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                                required
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="City"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                <input
                                    type="text"
                                    value={formData.zip}
                                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                    placeholder="ZIP Code"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Photos Placeholder */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                <ImageIcon className="inline h-4 w-4 mr-1" />
                                Property Photos
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600">Photo upload feature coming soon</p>
                                <p className="text-sm text-gray-500 mt-1">For now, photos can be added after submission</p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-6">
                            <button
                                type="button"
                                onClick={() => navigate('/real-estate')}
                                className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Home className="h-5 w-5" />
                                        List Property
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
