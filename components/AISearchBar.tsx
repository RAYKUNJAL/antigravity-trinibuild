import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    X,
    ChevronRight,
    Clock,
    TrendingUp,
    Loader2,
    ArrowRight
} from 'lucide-react';
import { quickSearch, performSearch, SearchResponse, SearchVertical } from '../services/aiSearchService';
import { TRINIDAD_LOCATIONS } from '../data/trinidadLocations';

// ============================================
// TYPES
// ============================================

interface AISearchBarProps {
    size?: 'sm' | 'md' | 'lg' | 'hero';
    placeholder?: string;
    showSuggestions?: boolean;
    autoFocus?: boolean;
    onSearch?: (query: string) => void;
    className?: string;
}

// ============================================
// VERTICAL ICONS
// ============================================

const verticalIcons: Record<string, React.ReactNode> = {
    jobs: <Briefcase className="h-4 w-4" />,
    real_estate: <Home className="h-4 w-4" />,
    events: <Ticket className="h-4 w-4" />,
    rideshare: <Car className="h-4 w-4" />,
    stores: <Store className="h-4 w-4" />,
    marketplace: <Store className="h-4 w-4" />,
    blog: <BookOpen className="h-4 w-4" />,
    services: <Briefcase className="h-4 w-4" />
};

const verticalColors: Record<string, string> = {
    jobs: 'text-blue-500 bg-blue-500/10',
    real_estate: 'text-orange-500 bg-orange-500/10',
    events: 'text-purple-500 bg-purple-500/10',
    rideshare: 'text-cyan-500 bg-cyan-500/10',
    stores: 'text-emerald-500 bg-emerald-500/10',
    marketplace: 'text-emerald-500 bg-emerald-500/10',
    blog: 'text-pink-500 bg-pink-500/10',
    services: 'text-yellow-500 bg-yellow-500/10'
};

// ============================================
// SIZE CONFIGS
// ============================================

const sizeConfigs = {
    sm: {
        container: 'h-10',
        input: 'text-sm px-10',
        icon: 'h-4 w-4 left-3',
    },
    md: {
        container: 'h-12',
        input: 'text-base px-12',
        icon: 'h-5 w-5 left-4',
    },
    lg: {
        container: 'h-14',
        input: 'text-lg px-14',
        icon: 'h-6 w-6 left-4',
    },
    hero: {
        container: 'h-16 md:h-20',
        input: 'text-lg md:text-xl px-14 md:px-16',
        icon: 'h-6 w-6 md:h-7 md:w-7 left-5',
    }
};

// ============================================
// COMPONENT
// ============================================

export const AISearchBar: React.FC<AISearchBarProps> = ({
    size = 'md',
    placeholder = 'Search jobs, rentals, events, services...',
    showSuggestions = true,
    autoFocus = false,
    onSearch,
    className = ''
}) => {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<{
        locations: string[];
        categories: string[];
        recent: string[];
    }>({ locations: [], categories: [], recent: [] });
    const [quickResults, setQuickResults] = useState<SearchResponse | null>(null);

    // Popular searches for empty state
    const popularSearches = [
        { text: 'Jobs in Port of Spain', icon: <Briefcase className="h-4 w-4" /> },
        { text: 'Rentals under $3000', icon: <Home className="h-4 w-4" /> },
        { text: 'Events this weekend', icon: <Ticket className="h-4 w-4" /> },
        { text: 'Taxi to Piarco Airport', icon: <Car className="h-4 w-4" /> }
    ];

    const config = sizeConfigs[size];

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions({ locations: [], categories: [], recent: [] });
            setQuickResults(null);
            return;
        }

        const timer = setTimeout(async () => {
            // Get autocomplete suggestions
            const suggestionData = await quickSearch(query, 8);
            setSuggestions(suggestionData);

            // Get quick results preview if query is long enough
            if (query.length >= 3) {
                setIsSearching(true);
                try {
                    const results = await performSearch(query, { limit_per_vertical: 2 });
                    setQuickResults(results);
                } catch (err) {
                    console.error('Quick search error:', err);
                } finally {
                    setIsSearching(false);
                }
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Handle search submission
    const handleSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setIsOpen(false);

        if (onSearch) {
            onSearch(searchQuery);
        } else {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    }, [navigate, onSearch]);

    // Handle key press
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(query);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Search Input */}
            <div className={`relative ${config.container}`}>
                <div className={`absolute top-1/2 -translate-y-1/2 ${config.icon} text-gray-400 pointer-events-none z-10`}>
                    {isSearching ? (
                        <Loader2 className="h-full w-full animate-spin" />
                    ) : (
                        <Search className="h-full w-full" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className={`w-full h-full ${config.input} pr-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-trini-red/50 focus:border-trini-red transition-all text-gray-900 dark:text-white placeholder-gray-400`}
                    aria-label="Search TriniBuild"
                />

                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                <button
                    onClick={() => handleSearch(query)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-trini-red to-orange-500 text-white rounded-xl font-medium text-sm hover:shadow-md transition-all flex items-center gap-1"
                    aria-label="Search"
                >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden md:inline">Search</span>
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 max-h-[80vh] overflow-y-auto">

                    {/* Empty State - Popular Searches */}
                    {!query && (
                        <div className="p-4">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" />
                                Popular Searches
                            </div>
                            <div className="space-y-1">
                                {popularSearches.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setQuery(item.text);
                                            handleSearch(item.text);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                                    >
                                        <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                            {item.icon}
                                        </span>
                                        <span className="text-gray-800 dark:text-gray-200">{item.text}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Location Quick Access */}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    Browse by Location
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {TRINIDAD_LOCATIONS.filter(l => l.isMajorCity).slice(0, 6).map(loc => (
                                        <button
                                            key={loc.slug}
                                            onClick={() => handleSearch(`in ${loc.name}`)}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-trini-red/10 hover:text-trini-red transition-colors"
                                        >
                                            {loc.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Suggestions */}
                    {query && (suggestions.locations.length > 0 || suggestions.categories.length > 0) && (
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                            {suggestions.locations.map((loc, i) => (
                                <button
                                    key={`loc-${i}`}
                                    onClick={() => handleSearch(`in ${loc}`)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                                >
                                    <MapPin className="h-4 w-4 text-trini-red" />
                                    <span className="text-gray-800 dark:text-gray-200">Search in <strong>{loc}</strong></span>
                                </button>
                            ))}
                            {suggestions.categories.map((cat, i) => (
                                <button
                                    key={`cat-${i}`}
                                    onClick={() => handleSearch(cat.toLowerCase())}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                                >
                                    <Search className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-800 dark:text-gray-200">{cat}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Quick Results Preview */}
                    {quickResults && quickResults.blocks.length > 0 && (
                        <div className="p-4">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Sparkles className="h-3 w-3 text-trini-red" />
                                {quickResults.total_results} Results Found
                            </div>

                            {/* How-to Answer */}
                            {quickResults.how_to_answer && (
                                <div className="mb-4 p-4 bg-gradient-to-r from-trini-red/5 to-orange-500/5 rounded-xl border border-trini-red/10">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="h-5 w-5 text-trini-red flex-shrink-0 mt-0.5" />
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">{quickResults.how_to_answer}</p>
                                    </div>
                                </div>
                            )}

                            {/* Result Blocks */}
                            {quickResults.blocks.slice(0, 2).map(block => (
                                <div key={block.vertical} className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`flex items-center gap-2 text-sm font-medium ${verticalColors[block.vertical]?.split(' ')[0] || 'text-gray-600'}`}>
                                            {verticalIcons[block.vertical]}
                                            {block.label}
                                        </span>
                                        <button
                                            onClick={() => navigate(block.see_more_url)}
                                            className="text-xs text-trini-red hover:underline flex items-center gap-1"
                                        >
                                            See all <ChevronRight className="h-3 w-3" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {block.results.slice(0, 2).map(result => (
                                            <button
                                                key={result.id}
                                                onClick={() => navigate(result.url)}
                                                className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                                            >
                                                {result.image && (
                                                    <img src={result.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 dark:text-white truncate">{result.title}</div>
                                                    <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                                                </div>
                                                {result.price_label && (
                                                    <span className="text-sm font-bold text-trini-red">{result.price_label}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* View All Results */}
                            <button
                                onClick={() => handleSearch(query)}
                                className="w-full mt-2 py-3 bg-gradient-to-r from-trini-red to-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                            >
                                View All Results <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Loading State */}
                    {isSearching && !quickResults && (
                        <div className="p-8 text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-trini-red" />
                            <p className="mt-2 text-sm text-gray-500">Searching...</p>
                        </div>
                    )}

                    {/* No Results */}
                    {query && !isSearching && quickResults && quickResults.blocks.length === 0 && (
                        <div className="p-8 text-center">
                            <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-600 dark:text-gray-400">No results found for "{query}"</p>
                            <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AISearchBar;
