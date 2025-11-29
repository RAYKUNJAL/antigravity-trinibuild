import React, { useState } from 'react';
import { X, Sparkles, Loader2, Copy, Check, ShoppingBag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService, ListingDescriptionRequest } from '../services/ai';

interface ListingDescriptionGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (description: string) => void;
}

export const ListingDescriptionGenerator: React.FC<ListingDescriptionGeneratorProps> = ({ isOpen, onClose, onSelect }) => {
    const [formData, setFormData] = useState<ListingDescriptionRequest>({
        title: '',
        category: '',
        features: [],
        condition: 'New',
        price: undefined,
        tone: 'persuasive',
    });
    const [featureInput, setFeatureInput] = useState('');
    const [generatedDescription, setGeneratedDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleAddFeature = () => {
        if (featureInput.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, featureInput.trim()]
            }));
            setFeatureInput('');
        }
    };

    const handleRemoveFeature = (featureToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter(f => f !== featureToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setGeneratedDescription('');

        try {
            const response = await aiService.generateListingDescription(formData);
            setGeneratedDescription(response.content);
        } catch (err: any) {
            setError(err.message || 'Failed to generate description.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedDescription);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUseDescription = () => {
        if (onSelect) {
            onSelect(generatedDescription);
            onClose();
        } else {
            copyToClipboard();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">AI Listing Optimizer</h2>
                        <p className="text-sm text-gray-500">Generate high-converting product descriptions.</p>
                    </div>
                </div>

                {!generatedDescription ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Product Title</label>
                            <input
                                type="text" required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="e.g. iPhone 13 Pro Max 256GB"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                <input
                                    type="text" required
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Electronics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Condition</label>
                                <select
                                    value={formData.condition}
                                    onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="New">New</option>
                                    <option value="Like New">Like New</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="For Parts">For Parts</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Price (Optional)</label>
                                <input
                                    type="number"
                                    value={formData.price || ''}
                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || undefined })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tone</label>
                                <select
                                    value={formData.tone}
                                    onChange={e => setFormData({ ...formData, tone: e.target.value as ListingDescriptionRequest['tone'] })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="persuasive">Persuasive</option>
                                    <option value="neutral">Neutral / Informative</option>
                                    <option value="urgent">Urgent (Sale)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Key Features</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={featureInput}
                                    onChange={e => setFeatureInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="e.g. Waterproof, 2-year warranty"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddFeature}
                                    className="bg-gray-100 text-gray-700 px-4 rounded-lg font-bold hover:bg-gray-200"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.features.map(feature => (
                                    <span key={feature} className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                        {feature}
                                        <button type="button" onClick={() => handleRemoveFeature(feature)} className="hover:text-red-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5" /> Generate Description
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 font-sans text-gray-800 leading-relaxed max-h-[50vh] overflow-y-auto">
                            <ReactMarkdown
                                className="prose prose-sm max-w-none prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal"
                                remarkPlugins={[remarkGfm]}
                            >
                                {generatedDescription}
                            </ReactMarkdown>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setGeneratedDescription('')}
                                className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Edit Details
                            </button>
                            <button
                                onClick={handleUseDescription}
                                className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                {onSelect ? <Check className="h-5 w-5" /> : (copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />)}
                                {onSelect ? 'Use This Description' : (copied ? 'Copied!' : 'Copy Text')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
