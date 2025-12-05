import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    MapPin,
    FileText,
    Send,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Download,
    Copy,
    Eye,
    Code,
    Zap,
    Globe,
    TrendingUp,
    Briefcase,
    Home,
    Car,
    Ticket,
    Store,
    ChevronDown,
    ChevronRight,
    Clock,
    BarChart3
} from 'lucide-react';
import {
    generateLocationBlog,
    generateBlogsForLocation,
    GeneratedBlog,
    BatchGenerationProgress,
    TRINIDAD_LOCATIONS,
    BLOG_VERTICALS,
    getLocationBySlug
} from '../services/blogEngineService';

const verticalIcons: Record<string, React.ReactNode> = {
    jobs: <Briefcase className="h-5 w-5" />,
    stores: <Store className="h-5 w-5" />,
    tickets: <Ticket className="h-5 w-5" />,
    real_estate: <Home className="h-5 w-5" />,
    rideshare: <Car className="h-5 w-5" />,
    combo: <Globe className="h-5 w-5" />
};

const verticalColors: Record<string, string> = {
    jobs: 'from-blue-500 to-indigo-600',
    stores: 'from-emerald-500 to-teal-600',
    tickets: 'from-purple-500 to-pink-600',
    real_estate: 'from-orange-500 to-red-600',
    rideshare: 'from-cyan-500 to-blue-600',
    combo: 'from-gray-600 to-gray-800'
};

export const BlogGenerator: React.FC = () => {
    // State
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedVertical, setSelectedVertical] = useState<string>('jobs');
    const [wordCountTarget, setWordCountTarget] = useState<number>(1200);
    const [toneVariant, setToneVariant] = useState<'default' | 'more_trini'>('default');
    const [includeStory, setIncludeStory] = useState<boolean>(true);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [batchMode, setBatchMode] = useState(false);
    const [batchProgress, setBatchProgress] = useState<BatchGenerationProgress | null>(null);
    const [batchResults, setBatchResults] = useState<GeneratedBlog[]>([]);

    const [viewMode, setViewMode] = useState<'preview' | 'markdown' | 'json'>('preview');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        seo: true,
        content: true,
        links: false,
        schema: false
    });

    // Group locations by region
    const locationsByRegion = TRINIDAD_LOCATIONS.reduce((acc, loc) => {
        if (!acc[loc.region_or_municipality]) {
            acc[loc.region_or_municipality] = [];
        }
        acc[loc.region_or_municipality].push(loc);
        return acc;
    }, {} as Record<string, typeof TRINIDAD_LOCATIONS>);

    const regions = Object.keys(locationsByRegion).sort();

    // Handlers
    const handleGenerate = async () => {
        if (!selectedLocation) {
            setError('Please select a location');
            return;
        }

        const location = getLocationBySlug(selectedLocation);
        if (!location) {
            setError('Invalid location selected');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedBlog(null);

        try {
            const blog = await generateLocationBlog({
                location,
                vertical_key: selectedVertical,
                word_count_target: wordCountTarget,
                tone_variant: toneVariant,
                include_hypothetical_story: includeStory
            });
            setGeneratedBlog(blog);
        } catch (err) {
            setError(String(err));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBatchGenerate = async () => {
        if (!selectedLocation) {
            setError('Please select a location');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setBatchResults([]);

        try {
            const results = await generateBlogsForLocation(
                selectedLocation,
                BLOG_VERTICALS.filter(v => v.key !== 'combo').map(v => v.key),
                (progress) => setBatchProgress(progress)
            );
            setBatchResults(results);
        } catch (err) {
            setError(String(err));
        } finally {
            setIsGenerating(false);
            setBatchProgress(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const downloadJson = () => {
        if (!generatedBlog) return;
        const blob = new Blob([JSON.stringify(generatedBlog, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${generatedBlog.url_slug}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-trini-red via-red-600 to-orange-500 py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">TriniBuild Blog Engine</h1>
                            <p className="text-white/80">AI-Powered SEO Blog Generator for Trinidad & Tobago</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Panel - Controls */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Location Selector */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin className="h-5 w-5 text-trini-red" />
                                <h2 className="text-lg font-semibold">Select Location</h2>
                            </div>

                            <select
                                id="location-selector"
                                aria-label="Select a location in Trinidad and Tobago"
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trini-red focus:border-transparent"
                            >
                                <option value="">Choose a location...</option>
                                {regions.map(region => (
                                    <optgroup key={region} label={region}>
                                        {locationsByRegion[region].map(loc => (
                                            <option key={loc.slug} value={loc.slug}>
                                                {loc.name} {loc.isMajorCity ? '★' : ''}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>

                            {selectedLocation && (
                                <div className="mt-3 p-3 bg-gray-700/30 rounded-lg text-sm">
                                    {(() => {
                                        const loc = getLocationBySlug(selectedLocation);
                                        return loc ? (
                                            <>
                                                <p className="font-medium">{loc.name}</p>
                                                <p className="text-gray-400">{loc.region_or_municipality}, {loc.island}</p>
                                                {loc.isMajorCity && <span className="text-yellow-400 text-xs">★ Major City</span>}
                                            </>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Vertical Selector */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="h-5 w-5 text-trini-red" />
                                <h2 className="text-lg font-semibold">Content Vertical</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {BLOG_VERTICALS.map(v => (
                                    <button
                                        key={v.key}
                                        onClick={() => setSelectedVertical(v.key)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedVertical === v.key
                                            ? `bg-gradient-to-r ${verticalColors[v.key]} border-transparent text-white shadow-lg`
                                            : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                                            }`}
                                    >
                                        {verticalIcons[v.key]}
                                        <span className="text-sm font-medium">{v.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Options */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="h-5 w-5 text-trini-red" />
                                <h2 className="text-lg font-semibold">Options</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="word-count-slider" className="block text-sm text-gray-400 mb-2">Word Count Target</label>
                                    <input
                                        type="range"
                                        id="word-count-slider"
                                        aria-label="Word count target slider"
                                        min="800"
                                        max="2000"
                                        step="100"
                                        value={wordCountTarget}
                                        onChange={(e) => setWordCountTarget(Number(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>800</span>
                                        <span className="text-white font-bold">{wordCountTarget} words</span>
                                        <span>2000</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Tone Variant</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setToneVariant('default')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${toneVariant === 'default'
                                                ? 'bg-trini-red text-white'
                                                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            Professional
                                        </button>
                                        <button
                                            onClick={() => setToneVariant('more_trini')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${toneVariant === 'more_trini'
                                                ? 'bg-trini-red text-white'
                                                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            More Trini 🇹🇹
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="includeStory"
                                        checked={includeStory}
                                        onChange={(e) => setIncludeStory(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-trini-red focus:ring-trini-red"
                                    />
                                    <label htmlFor="includeStory" className="text-sm text-gray-300">
                                        Include success story section
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="space-y-3">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !selectedLocation}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${isGenerating || !selectedLocation
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-trini-red to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5" />
                                        Generate Blog
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleBatchGenerate}
                                disabled={isGenerating || !selectedLocation}
                                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${isGenerating || !selectedLocation
                                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700 text-white'
                                    }`}
                            >
                                <Send className="h-4 w-4" />
                                Generate All Verticals (5 blogs)
                            </button>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Batch Progress */}
                        {batchProgress && (
                            <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
                                    <span className="text-blue-300 text-sm font-medium">
                                        Generating batch blogs...
                                    </span>
                                </div>
                                <div className="text-sm text-blue-200">
                                    {batchProgress.completed}/{batchProgress.total} - {batchProgress.current_vertical}
                                </div>
                                <div className="mt-2 h-2 bg-blue-900/50 rounded-full overflow-hidden" role="progressbar" aria-label="Blog generation progress">
                                    <div
                                        className="h-full bg-blue-500 transition-all"
                                        style={{ width: `${(batchProgress.completed / batchProgress.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Output */}
                    <div className="lg:col-span-2">
                        {generatedBlog ? (
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">

                                {/* Output Header */}
                                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg">{generatedBlog.h1}</h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <FileText className="h-4 w-4" />
                                                    {generatedBlog.word_count} words
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {generatedBlog.reading_time_minutes} min read
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <BarChart3 className="h-4 w-4" />
                                                    {generatedBlog.internal_links_used.length} links
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => copyToClipboard(generatedBlog.body_html)}
                                                className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                                                title="Copy HTML"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={downloadJson}
                                                className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                                                title="Download JSON"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* View Mode Tabs */}
                                    <div className="flex gap-2 mt-4">
                                        {(['preview', 'markdown', 'json'] as const).map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setViewMode(mode)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === mode
                                                    ? 'bg-trini-red text-white'
                                                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                                                    }`}
                                            >
                                                {mode === 'preview' && <Eye className="h-4 w-4 inline mr-1" />}
                                                {mode === 'markdown' && <FileText className="h-4 w-4 inline mr-1" />}
                                                {mode === 'json' && <Code className="h-4 w-4 inline mr-1" />}
                                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Collapsible Sections */}
                                <div className="p-6 space-y-4">

                                    {/* SEO Section */}
                                    <div className="bg-gray-900/50 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('seo')}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                                        >
                                            <span className="font-medium flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-green-400" />
                                                SEO Metadata
                                            </span>
                                            {expandedSections.seo ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        {expandedSections.seo && (
                                            <div className="px-4 pb-4 space-y-3 text-sm">
                                                <div>
                                                    <label className="text-gray-500 text-xs uppercase tracking-wide">Title ({generatedBlog.seo_title.length}/65)</label>
                                                    <p className="text-white font-medium mt-1">{generatedBlog.seo_title}</p>
                                                </div>
                                                <div>
                                                    <label className="text-gray-500 text-xs uppercase tracking-wide">Meta Description ({generatedBlog.meta_description.length}/160)</label>
                                                    <p className="text-gray-300 mt-1">{generatedBlog.meta_description}</p>
                                                </div>
                                                <div>
                                                    <label className="text-gray-500 text-xs uppercase tracking-wide">URL Slug</label>
                                                    <p className="text-blue-400 mt-1">/blog/{generatedBlog.url_slug}</p>
                                                </div>
                                                <div>
                                                    <label className="text-gray-500 text-xs uppercase tracking-wide">Primary Keyword</label>
                                                    <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">{generatedBlog.primary_keyword}</span>
                                                </div>
                                                <div>
                                                    <label className="text-gray-500 text-xs uppercase tracking-wide">Secondary Keywords</label>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {generatedBlog.secondary_keywords.map((kw, i) => (
                                                            <span key={i} className="px-2 py-1 bg-gray-700/50 rounded text-xs">{kw}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    <div className="bg-gray-900/50 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('content')}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                                        >
                                            <span className="font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-400" />
                                                Content
                                            </span>
                                            {expandedSections.content ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        {expandedSections.content && (
                                            <div className="px-4 pb-4">
                                                {viewMode === 'preview' && (
                                                    <div
                                                        className="prose prose-invert prose-sm max-w-none"
                                                        dangerouslySetInnerHTML={{ __html: generatedBlog.body_html }}
                                                    />
                                                )}
                                                {viewMode === 'markdown' && (
                                                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-950/50 p-4 rounded-lg overflow-x-auto">
                                                        {generatedBlog.body_markdown}
                                                    </pre>
                                                )}
                                                {viewMode === 'json' && (
                                                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-950/50 p-4 rounded-lg overflow-x-auto max-h-96">
                                                        {JSON.stringify(generatedBlog, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Internal Links */}
                                    <div className="bg-gray-900/50 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('links')}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                                        >
                                            <span className="font-medium flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-purple-400" />
                                                Internal Links ({generatedBlog.internal_links_used.length})
                                            </span>
                                            {expandedSections.links ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        {expandedSections.links && (
                                            <div className="px-4 pb-4 space-y-2">
                                                {generatedBlog.internal_links_used.map((link, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                                                        <span className="text-sm text-gray-300">{link.anchor_text}</span>
                                                        <span className="text-xs text-blue-400">{link.url}</span>
                                                    </div>
                                                ))}
                                                <div className="pt-2">
                                                    <label className="text-gray-500 text-xs uppercase tracking-wide">CTA Blocks</label>
                                                    {generatedBlog.cta_blocks.map((cta, i) => (
                                                        <div key={i} className="flex items-center gap-2 mt-2">
                                                            <span className="text-xs px-2 py-1 bg-trini-red/20 text-trini-red rounded uppercase">{cta.position}</span>
                                                            <span className="text-sm text-gray-300">{cta.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Schema.org */}
                                    <div className="bg-gray-900/50 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('schema')}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                                        >
                                            <span className="font-medium flex items-center gap-2">
                                                <Code className="h-4 w-4 text-yellow-400" />
                                                Schema.org & Social Tags
                                            </span>
                                            {expandedSections.schema ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        {expandedSections.schema && (
                                            <div className="px-4 pb-4">
                                                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono bg-gray-950/50 p-3 rounded-lg overflow-x-auto">
                                                    {JSON.stringify(generatedBlog.schema_org, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-12 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-trini-red/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <FileText className="h-10 w-10 text-trini-red" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No Blog Generated Yet</h3>
                                <p className="text-gray-400 max-w-md mx-auto">
                                    Select a location and vertical, then click "Generate Blog" to create an SEO-optimized article for TriniBuild.
                                </p>

                                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
                                    <div className="p-4 bg-gray-800/50 rounded-xl text-left">
                                        <MapPin className="h-6 w-6 text-trini-red mb-2" />
                                        <p className="text-sm font-medium">{TRINIDAD_LOCATIONS.length}</p>
                                        <p className="text-xs text-gray-500">Locations</p>
                                    </div>
                                    <div className="p-4 bg-gray-800/50 rounded-xl text-left">
                                        <TrendingUp className="h-6 w-6 text-green-400 mb-2" />
                                        <p className="text-sm font-medium">{BLOG_VERTICALS.length}</p>
                                        <p className="text-xs text-gray-500">Verticals</p>
                                    </div>
                                    <div className="p-4 bg-gray-800/50 rounded-xl text-left">
                                        <Sparkles className="h-6 w-6 text-yellow-400 mb-2" />
                                        <p className="text-sm font-medium">{TRINIDAD_LOCATIONS.length * 5}+</p>
                                        <p className="text-xs text-gray-500">Possible Blogs</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Batch Results */}
                        {batchResults.length > 0 && (
                            <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                    Batch Generation Complete ({batchResults.length} blogs)
                                </h3>
                                <div className="space-y-3">
                                    {batchResults.map((blog, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 cursor-pointer transition-colors"
                                            onClick={() => setGeneratedBlog(blog)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`p-2 rounded-lg bg-gradient-to-r ${verticalColors[blog.vertical_key]}`}>
                                                    {verticalIcons[blog.vertical_key]}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-sm">{blog.h1}</p>
                                                    <p className="text-xs text-gray-500">{blog.word_count} words • {blog.vertical_label}</p>
                                                </div>
                                            </div>
                                            <Eye className="h-4 w-4 text-gray-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogGenerator;
