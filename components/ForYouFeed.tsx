import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Sparkles,
    MapPin,
    Briefcase,
    Home,
    Ticket,
    Store,
    BookOpen,
    ChevronRight,
    Star,
    Clock,
    TrendingUp,
    RefreshCw,
    Heart,
    ArrowRight
} from 'lucide-react';
import {
    getForYouFeed,
    RecommendationItem,
    RecommendationType,
    trackClick
} from '../services/recommenderService';
import { MiniTrustIndicator } from './TrustBadge';

// ============================================
// TYPES
// ============================================

interface ForYouFeedProps {
    userId?: string | null;
    location?: string;
    className?: string;
}

interface RecommendationCardProps {
    item: RecommendationItem;
    size?: 'sm' | 'md' | 'lg';
    onSave?: (item: RecommendationItem) => void;
}

// ============================================
// ICON MAP
// ============================================

const typeIcons: Record<RecommendationType, React.ReactNode> = {
    jobs: <Briefcase className="h-4 w-4" />,
    properties: <Home className="h-4 w-4" />,
    events: <Ticket className="h-4 w-4" />,
    rides: <MapPin className="h-4 w-4" />,
    stores: <Store className="h-4 w-4" />,
    products: <Store className="h-4 w-4" />,
    services: <Briefcase className="h-4 w-4" />,
    blogs: <BookOpen className="h-4 w-4" />
};

const typeColors: Record<RecommendationType, string> = {
    jobs: 'text-blue-500 bg-blue-500/10',
    properties: 'text-orange-500 bg-orange-500/10',
    events: 'text-purple-500 bg-purple-500/10',
    rides: 'text-cyan-500 bg-cyan-500/10',
    stores: 'text-emerald-500 bg-emerald-500/10',
    products: 'text-emerald-500 bg-emerald-500/10',
    services: 'text-yellow-500 bg-yellow-500/10',
    blogs: 'text-pink-500 bg-pink-500/10'
};

const typeLabels: Record<RecommendationType, string> = {
    jobs: 'Job',
    properties: 'Property',
    events: 'Event',
    rides: 'Ride',
    stores: 'Store',
    products: 'Product',
    services: 'Service',
    blogs: 'Article'
};

// ============================================
// FOR YOU FEED COMPONENT
// ============================================

export const ForYouFeed: React.FC<ForYouFeedProps> = ({
    userId,
    location,
    className = ''
}) => {
    const [feed, setFeed] = useState<{
        featured: RecommendationItem[];
        jobs: RecommendationItem[];
        properties: RecommendationItem[];
        events: RecommendationItem[];
        stores: RecommendationItem[];
        blogs: RecommendationItem[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadFeed();
    }, [userId, location]);

    const loadFeed = async () => {
        setIsLoading(true);
        try {
            const data = await getForYouFeed(userId || null, location);
            setFeed(data);
        } catch (err) {
            console.error('Error loading feed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = (item: RecommendationItem) => {
        setSavedItems(prev => {
            const next = new Set(prev);
            if (next.has(item.id)) {
                next.delete(item.id);
            } else {
                next.add(item.id);
            }
            return next;
        });
    };

    const handleClick = (item: RecommendationItem) => {
        trackClick(userId || null, item.type, item.id, 'for_you_feed');
    };

    if (isLoading) {
        return (
            <div className={`${className}`}>
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="h-8 w-8 animate-spin text-trini-red" />
                </div>
            </div>
        );
    }

    if (!feed) return null;

    return (
        <div className={`space-y-12 ${className}`}>
            {/* Featured Section */}
            {feed.featured.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-trini-red to-orange-500 rounded-lg">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">For You</h2>
                                <p className="text-sm text-gray-500">Personalized picks based on your activity</p>
                            </div>
                        </div>
                        <button
                            onClick={loadFeed}
                            className="text-sm text-trini-red hover:underline flex items-center gap-1"
                            aria-label="Refresh recommendations"
                        >
                            <RefreshCw className="h-4 w-4" /> Refresh
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {feed.featured.map(item => (
                            <RecommendationCard
                                key={item.id}
                                item={item}
                                size="md"
                                onSave={handleSave}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Jobs Section */}
            {feed.jobs.length > 0 && (
                <FeedSection
                    title="Jobs for You"
                    subtitle="Based on your searches and location"
                    icon={<Briefcase className="h-5 w-5" />}
                    color="blue"
                    items={feed.jobs}
                    seeMoreUrl="/jobs"
                    onSave={handleSave}
                />
            )}

            {/* Properties Section */}
            {feed.properties.length > 0 && (
                <FeedSection
                    title="Properties for You"
                    subtitle="Rentals matching your preferences"
                    icon={<Home className="h-5 w-5" />}
                    color="orange"
                    items={feed.properties}
                    seeMoreUrl="/real-estate"
                    onSave={handleSave}
                />
            )}

            {/* Events Section */}
            {feed.events.length > 0 && (
                <FeedSection
                    title="Events for You"
                    subtitle="Upcoming events near you"
                    icon={<Ticket className="h-5 w-5" />}
                    color="purple"
                    items={feed.events}
                    seeMoreUrl="/tickets"
                    onSave={handleSave}
                />
            )}

            {/* Stores Section */}
            {feed.stores.length > 0 && (
                <FeedSection
                    title="Stores for You"
                    subtitle="Popular local businesses"
                    icon={<Store className="h-5 w-5" />}
                    color="emerald"
                    items={feed.stores}
                    seeMoreUrl="/marketplace"
                    onSave={handleSave}
                />
            )}

            {/* Blogs Section */}
            {feed.blogs.length > 0 && (
                <FeedSection
                    title="Articles for You"
                    subtitle="Trending content"
                    icon={<BookOpen className="h-5 w-5" />}
                    color="pink"
                    items={feed.blogs}
                    seeMoreUrl="/blog"
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

// ============================================
// FEED SECTION COMPONENT
// ============================================

interface FeedSectionProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    items: RecommendationItem[];
    seeMoreUrl: string;
    onSave?: (item: RecommendationItem) => void;
}

const FeedSection: React.FC<FeedSectionProps> = ({
    title,
    subtitle,
    icon,
    color,
    items,
    seeMoreUrl,
    onSave
}) => (
    <section>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 bg-${color}-500/10 rounded-lg text-${color}-500`}>
                    {icon}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
            </div>
            <Link
                to={seeMoreUrl}
                className="text-sm text-trini-red hover:underline flex items-center gap-1"
            >
                See all <ChevronRight className="h-4 w-4" />
            </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map(item => (
                <RecommendationCard
                    key={item.id}
                    item={item}
                    size="sm"
                    onSave={onSave}
                />
            ))}
        </div>
    </section>
);

// ============================================
// RECOMMENDATION CARD COMPONENT
// ============================================

const RecommendationCard: React.FC<RecommendationCardProps> = ({
    item,
    size = 'md',
    onSave
}) => {
    const [isSaved, setIsSaved] = useState(false);

    const handleSaveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSaved(!isSaved);
        onSave?.(item);
    };

    if (size === 'sm') {
        return (
            <Link
                to={item.url}
                className="block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group border border-gray-100 dark:border-gray-700"
            >
                {item.image && (
                    <div className="h-32 overflow-hidden relative">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <button
                            onClick={handleSaveClick}
                            className={`absolute top-2 right-2 p-1.5 rounded-full ${isSaved ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
                                }`}
                            aria-label={isSaved ? 'Remove from saved' : 'Save item'}
                        >
                            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                )}
                <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`p-1 rounded ${typeColors[item.type]}`}>
                            {typeIcons[item.type]}
                        </span>
                        <span className="text-xs text-gray-500">{typeLabels[item.type]}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-trini-red">
                        {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{item.subtitle}</p>
                    {item.price_label && (
                        <div className="mt-2 font-bold text-trini-red">{item.price_label}</div>
                    )}
                </div>
            </Link>
        );
    }

    // Medium/Large card
    return (
        <Link
            to={item.url}
            className="block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-100 dark:border-gray-700"
        >
            <div className="flex">
                {item.image && (
                    <div className="w-1/3 h-40 overflow-hidden relative">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                    </div>
                )}
                <div className={`${item.image ? 'w-2/3' : 'w-full'} p-4`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded ${typeColors[item.type]}`}>
                                {typeIcons[item.type]}
                            </span>
                            <span className="text-xs font-medium text-gray-500">{typeLabels[item.type]}</span>
                        </div>
                        <button
                            onClick={handleSaveClick}
                            className={`p-1.5 rounded-full ${isSaved ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 hover:bg-gray-200'
                                }`}
                            aria-label={isSaved ? 'Remove from saved' : 'Save item'}
                        >
                            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-trini-red line-clamp-1">
                        {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{item.subtitle}</p>

                    {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                            {item.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            {item.location && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {item.location}
                                </span>
                            )}
                            {item.rating && (
                                <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500" /> {item.rating.toFixed(1)}
                                </span>
                            )}
                            {item.trust_score && (
                                <MiniTrustIndicator score={item.trust_score} />
                            )}
                        </div>
                        {item.price_label && (
                            <span className="font-bold text-trini-red">{item.price_label}</span>
                        )}
                    </div>

                    {/* Reason tag */}
                    <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                        <TrendingUp className="h-3 w-3" />
                        {item.reason}
                    </div>
                </div>
            </div>
        </Link>
    );
};

// ============================================
// HORIZONTAL SCROLL SECTION
// ============================================

interface HorizontalFeedProps {
    title: string;
    items: RecommendationItem[];
    seeMoreUrl?: string;
}

export const HorizontalFeed: React.FC<HorizontalFeedProps> = ({
    title,
    items,
    seeMoreUrl
}) => (
    <section className="py-6">
        <div className="flex items-center justify-between mb-4 px-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            {seeMoreUrl && (
                <Link
                    to={seeMoreUrl}
                    className="text-sm text-trini-red hover:underline flex items-center gap-1"
                >
                    See all <ArrowRight className="h-4 w-4" />
                </Link>
            )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {items.map(item => (
                <div key={item.id} className="flex-shrink-0 w-72 snap-start">
                    <RecommendationCard item={item} size="sm" />
                </div>
            ))}
        </div>
    </section>
);

export default ForYouFeed;
