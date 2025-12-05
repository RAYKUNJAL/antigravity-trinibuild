import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Search,
    MapPin,
    Briefcase,
    Home,
    Ticket,
    Car,
    Store,
    BookOpen,
    Sparkles,
    Filter,
    ChevronRight,
    Clock,
    Star,
    Shield,
    ExternalLink,
    Loader2,
    ArrowLeft,
    Grid,
    List
} from 'lucide-react';
import { AISearchBar } from '../components/AISearchBar';
import { performSearch, SearchResponse, SearchVertical, SearchResultBlock, SearchResultItem } from '../services/aiSearchService';

// ============================================
// VERTICAL CONFIG
// ============================================

const verticalConfig: Record<SearchVertical, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
    jobs: { icon: <Briefcase className="h-5 w-5" />, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Jobs & Gigs' },
    real_estate: { icon: <Home className="h-5 w-5" />, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Real Estate' },
    events: { icon: <Ticket className="h-5 w-5" />, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Events' },
    rideshare: { icon: <Car className="h-5 w-5" />, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', label: 'Rides' },
    stores: { icon: <Store className="h-5 w-5" />, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Stores' },
    marketplace: { icon: <Store className="h-5 w-5" />, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Marketplace' },
    services: { icon: <Briefcase className="h-5 w-5" />, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Services' },
    blog: { icon: <BookOpen className="h-5 w-5" />, color: 'text-pink-500', bgColor: 'bg-pink-500/10', label: 'Articles' },
    how_to: { icon: <Sparkles className="h-5 w-5" />, color: 'text-gray-500', bgColor: 'bg-gray-500/10', label: 'Help' }
};

// ============================================
// COMPONENT
// ============================================

export const SearchResults: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const verticalFilter = searchParams.get('vertical') as SearchVertical | null;

    const [results, setResults] = useState<SearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [expandedBlock, setExpandedBlock] = useState<SearchVertical | null>(null);

    // Perform search when query changes
    useEffect(() => {
        if (!query) {
            setIsLoading(false);
            return;
        }

        const search = async () => {
            setIsLoading(true);
            try {
                const response = await performSearch(query, {
                    limit_per_vertical: verticalFilter ? 20 : 5,
                    verticals: verticalFilter ? [verticalFilter] : undefined
                });
                setResults(response);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        search();
    }, [query, verticalFilter]);

    // Handle new search
    const handleSearch = (newQuery: string) => {
        setSearchParams({ q: newQuery });
    };

    // Handle vertical filter
    const handleVerticalFilter = (vertical: SearchVertical | null) => {
        if (vertical) {
            setSearchParams({ q: query, vertical });
        } else {
            setSearchParams({ q: query });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">Home</span>
                        </Link>

                        <div className="flex-1">
                            <AISearchBar
                                size="md"
                                showSuggestions={false}
                                onSearch={handleSearch}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-trini-red mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Searching across all of TriniBuild...</p>
                    </div>
                )}

                {/* No Query */}
                {!isLoading && !query && (
                    <div className="text-center py-20">
                        <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                            What are you looking for?
                        </h2>
                        <p className="text-gray-500">
                            Search for jobs, rentals, events, services, and more
                        </p>
                    </div>
                )}

                {/* Results */}
                {!isLoading && results && (
                    <div>
                        {/* Results Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {results.total_results} results for "{query}"
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Found in {results.search_time_ms}ms
                                    {results.intent.location && ` • Near ${results.intent.location.name}`}
                                    {results.intent.trini_slang_detected.length > 0 && (
                                        <span className="ml-2 text-trini-red">
                                            🇹🇹 Detected: {results.intent.trini_slang_detected.join(', ')}
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* View Toggle */}
                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                                        aria-label="List view"
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                                        aria-label="Grid view"
                                    >
                                        <Grid className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Vertical Filter Pills */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <button
                                onClick={() => handleVerticalFilter(null)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!verticalFilter
                                        ? 'bg-trini-red text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                All Results
                            </button>
                            {results.blocks.map(block => {
                                const config = verticalConfig[block.vertical];
                                return (
                                    <button
                                        key={block.vertical}
                                        onClick={() => handleVerticalFilter(block.vertical)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${verticalFilter === block.vertical
                                                ? 'bg-trini-red text-white'
                                                : `${config.bgColor} ${config.color} hover:opacity-80`
                                            }`}
                                    >
                                        {config.icon}
                                        {block.label} ({block.total_count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* AI Answer */}
                        {results.how_to_answer && (
                            <div className="mb-8 p-6 bg-gradient-to-r from-trini-red/5 to-orange-500/5 dark:from-trini-red/20 dark:to-orange-500/20 rounded-2xl border border-trini-red/10">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-trini-red/10 rounded-xl">
                                        <Sparkles className="h-6 w-6 text-trini-red" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">AI Answer</h3>
                                        <p className="text-gray-700 dark:text-gray-300">{results.how_to_answer}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Results */}
                        {results.blocks.length === 0 && (
                            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
                                <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    No results found
                                </h2>
                                <p className="text-gray-500 mb-6">
                                    We couldn't find anything matching "{query}"
                                </p>

                                {results.suggestions.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-3">Try searching for:</p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {results.suggestions.map((suggestion, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSearch(suggestion)}
                                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm hover:bg-trini-red/10 hover:text-trini-red"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Result Blocks */}
                        <div className="space-y-8">
                            {results.blocks.map(block => (
                                <ResultBlock
                                    key={block.vertical}
                                    block={block}
                                    viewMode={viewMode}
                                    isExpanded={expandedBlock === block.vertical || !!verticalFilter}
                                    onToggleExpand={() => setExpandedBlock(
                                        expandedBlock === block.vertical ? null : block.vertical
                                    )}
                                />
                            ))}
                        </div>

                        {/* Suggestions */}
                        {results.suggestions.length > 0 && !verticalFilter && (
                            <div className="mt-12 p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Related Searches</h3>
                                <div className="flex flex-wrap gap-2">
                                    {results.suggestions.map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSearch(suggestion)}
                                            className="px-4 py-2 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-trini-red/10 hover:text-trini-red border border-gray-200 dark:border-gray-600"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// RESULT BLOCK COMPONENT
// ============================================

interface ResultBlockProps {
    block: SearchResultBlock;
    viewMode: 'grid' | 'list';
    isExpanded: boolean;
    onToggleExpand: () => void;
}

const ResultBlock: React.FC<ResultBlockProps> = ({ block, viewMode, isExpanded, onToggleExpand }) => {
    const config = verticalConfig[block.vertical];
    const displayResults = isExpanded ? block.results : block.results.slice(0, 3);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Block Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                        {config.icon}
                    </span>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white">{block.label}</h2>
                        <p className="text-sm text-gray-500">{block.total_count} results</p>
                    </div>
                </div>

                <Link
                    to={block.see_more_url}
                    className="flex items-center gap-1 text-trini-red font-medium text-sm hover:underline"
                >
                    See all <ExternalLink className="h-4 w-4" />
                </Link>
            </div>

            {/* Results */}
            <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}`}>
                {displayResults.map(result => (
                    <ResultCard key={result.id} result={result} viewMode={viewMode} />
                ))}
            </div>

            {/* Show More */}
            {block.results.length > 3 && !isExpanded && (
                <div className="p-4 pt-0">
                    <button
                        onClick={onToggleExpand}
                        className="w-full py-3 text-center text-trini-red font-medium rounded-lg hover:bg-trini-red/5 transition-colors flex items-center justify-center gap-2"
                    >
                        Show {block.results.length - 3} more results
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

// ============================================
// RESULT CARD COMPONENT
// ============================================

interface ResultCardProps {
    result: SearchResultItem;
    viewMode: 'grid' | 'list';
}

const ResultCard: React.FC<ResultCardProps> = ({ result, viewMode }) => {
    const config = verticalConfig[result.type];

    if (viewMode === 'grid') {
        return (
            <Link
                to={result.url}
                className="block bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden hover:shadow-md transition-all group"
            >
                {result.image && (
                    <div className="h-40 overflow-hidden">
                        <img
                            src={result.image}
                            alt={result.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                    </div>
                )}
                <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-trini-red line-clamp-2 mb-1">
                        {result.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mb-2">{result.subtitle}</p>

                    <div className="flex items-center justify-between">
                        {result.price_label && (
                            <span className="font-bold text-trini-red">{result.price_label}</span>
                        )}
                        {result.location && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {result.location}
                            </span>
                        )}
                    </div>

                    {result.trust_score && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <Shield className="h-3 w-3 text-green-500" />
                            {result.trust_score}% Trust Score
                        </div>
                    )}
                </div>
            </Link>
        );
    }

    // List view
    return (
        <Link
            to={result.url}
            className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
        >
            {result.image && (
                <img
                    src={result.image}
                    alt={result.title}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-trini-red line-clamp-1">
                            {result.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{result.subtitle}</p>
                    </div>

                    {result.price_label && (
                        <span className="font-bold text-trini-red whitespace-nowrap">{result.price_label}</span>
                    )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                    {result.description}
                </p>

                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {result.location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {result.location}
                        </span>
                    )}
                    {result.trust_score && (
                        <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-green-500" /> {result.trust_score}%
                        </span>
                    )}
                    {result.rating && (
                        <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" /> {result.rating.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default SearchResults;
