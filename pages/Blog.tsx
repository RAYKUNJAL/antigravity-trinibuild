import React, { useState, useMemo } from 'react';
import {
  Calendar,
  User,
  ArrowRight,
  TrendingUp,
  MapPin,
  Search,
  Filter,
  Clock,
  Briefcase,
  Store,
  Ticket,
  Home as HomeIcon,
  Car,
  Globe,
  ChevronRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Types
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  image: string;
  location?: string;
  vertical?: string;
  readTime?: number;
  slug: string;
  isFeatured?: boolean;
  isLocationBlog?: boolean;
}

// Vertical icons and colors
const verticalConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  jobs: { icon: <Briefcase className="h-4 w-4" />, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  stores: { icon: <Store className="h-4 w-4" />, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  tickets: { icon: <Ticket className="h-4 w-4" />, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  real_estate: { icon: <HomeIcon className="h-4 w-4" />, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  rideshare: { icon: <Car className="h-4 w-4" />, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  general: { icon: <Globe className="h-4 w-4" />, color: 'text-gray-600', bgColor: 'bg-gray-100' }
};

// Sample blog posts (mix of regular and location-specific AI blogs)
const allPosts: BlogPost[] = [
  // Featured posts
  {
    id: '1',
    title: "How 'Roti King' Increased Sales by 300% with TriniBuild",
    excerpt: "From a small roadside stall to shipping frozen roti to Tobago. Learn how digital tools transformed this local business.",
    category: "Success Stories",
    author: "Ray Kunjal",
    date: "Dec 05, 2025",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800",
    readTime: 5,
    slug: "roti-king-success-story",
    isFeatured: true
  },
  {
    id: '2',
    title: "5 Tips for Local SEO in Trinidad & Tobago",
    excerpt: "Getting found on Google Maps is crucial. Here are 5 easy steps to optimize your TriniBuild profile.",
    category: "Guides",
    author: "Sarah Lee",
    date: "Dec 01, 2025",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=800",
    readTime: 7,
    slug: "local-seo-tips-trinidad",
    isFeatured: true
  },
  // Location-specific AI-generated blogs
  {
    id: '3',
    title: "Jobs in Port of Spain: Find Work & Gigs Using TriniBuild",
    excerpt: "Discover job opportunities and gig work in Port of Spain, Trinidad. Learn how locals are finding work and building careers.",
    category: "Jobs & Gigs",
    author: "TriniBuild AI",
    date: "Dec 05, 2025",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800",
    location: "Port of Spain",
    vertical: "jobs",
    readTime: 6,
    slug: "jobs-in-port-of-spain",
    isLocationBlog: true
  },
  {
    id: '4',
    title: "Start Your Store in San Fernando: The Complete Guide",
    excerpt: "Learn how entrepreneurs in San Fernando are building successful online stores without credit cards or complex tech.",
    category: "Stores & Business",
    author: "TriniBuild AI",
    date: "Dec 04, 2025",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800",
    location: "San Fernando",
    vertical: "stores",
    readTime: 8,
    slug: "stores-in-san-fernando",
    isLocationBlog: true
  },
  {
    id: '5',
    title: "Real Estate in Arima: Buy, Sell & Rent Properties",
    excerpt: "The complete guide to navigating the Arima property market using TriniBuild's free tools.",
    category: "Real Estate",
    author: "TriniBuild AI",
    date: "Dec 03, 2025",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800",
    location: "Arima",
    vertical: "real_estate",
    readTime: 7,
    slug: "real-estate-in-arima",
    isLocationBlog: true
  },
  {
    id: '6',
    title: "Chaguanas Events & Tickets: Find Local Entertainment",
    excerpt: "From fetes to community events, discover what's happening in Chaguanas and how to sell or buy tickets easily.",
    category: "Events & Tickets",
    author: "TriniBuild AI",
    date: "Dec 02, 2025",
    image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=800",
    location: "Chaguanas",
    vertical: "tickets",
    readTime: 5,
    slug: "tickets-in-chaguanas",
    isLocationBlog: true
  },
  {
    id: '7',
    title: "Rideshare & Delivery in Scarborough, Tobago",
    excerpt: "How Tobagonians are earning extra income with rideshare and delivery services through TriniBuild.",
    category: "Rideshare",
    author: "TriniBuild AI",
    date: "Dec 01, 2025",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800",
    location: "Scarborough",
    vertical: "rideshare",
    readTime: 6,
    slug: "rideshare-in-scarborough",
    isLocationBlog: true
  },
  {
    id: '8',
    title: "Introducing TriniRides: The Future of Transport",
    excerpt: "We are expanding! Learn about our new rideshare features and how drivers can earn more.",
    category: "Platform News",
    author: "TriniBuild Team",
    date: "Nov 25, 2025",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800",
    readTime: 4,
    slug: "introducing-trinirides"
  }
];

// Categories
const categories = [
  { key: 'all', label: 'All Posts' },
  { key: 'location', label: 'By Location', icon: <MapPin className="h-4 w-4" /> },
  { key: 'jobs', label: 'Jobs & Gigs', icon: <Briefcase className="h-4 w-4" /> },
  { key: 'stores', label: 'Stores', icon: <Store className="h-4 w-4" /> },
  { key: 'real_estate', label: 'Real Estate', icon: <HomeIcon className="h-4 w-4" /> },
  { key: 'tickets', label: 'Events', icon: <Ticket className="h-4 w-4" /> },
  { key: 'rideshare', label: 'Rideshare', icon: <Car className="h-4 w-4" /> },
  { key: 'guides', label: 'Guides', icon: <BookOpen className="h-4 w-4" /> }
];

export const Blog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Filter posts
  const filteredPosts = useMemo(() => {
    let posts = allPosts;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (activeCategory !== 'all') {
      if (activeCategory === 'location') {
        posts = posts.filter(p => p.isLocationBlog);
      } else if (activeCategory === 'guides') {
        posts = posts.filter(p => p.category === 'Guides' || p.category === 'Success Stories');
      } else {
        posts = posts.filter(p => p.vertical === activeCategory);
      }
    }

    return posts;
  }, [searchQuery, activeCategory]);

  const featuredPosts = allPosts.filter(p => p.isFeatured);
  const locationPosts = allPosts.filter(p => p.isLocationBlog).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-trini-red/90 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">TriniBuild Blog</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Insights, Stories & Guides for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400"> Trinidad & Tobago</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Discover how to grow your business, find opportunities, and succeed in the T&T digital economy.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles, locations, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-12 pb-6 border-b border-gray-100">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.key
                  ? 'bg-trini-red text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured Section (only show when no search/filter) */}
        {!searchQuery && activeCategory === 'all' && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-trini-red" />
                Featured Stories
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <span className="inline-block px-3 py-1 bg-trini-red text-white text-xs font-bold rounded-full mb-3">
                        {post.category}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-300 text-sm line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {post.readTime} min read
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Location Blogs Section (only show when no filter) */}
        {!searchQuery && activeCategory === 'all' && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-trini-red" />
                Explore by Location
              </h2>
              <button
                onClick={() => setActiveCategory('location')}
                className="text-trini-red font-medium text-sm flex items-center gap-1 hover:underline"
              >
                View all <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {locationPosts.map((post) => {
                const config = verticalConfig[post.vertical || 'general'];
                return (
                  <Link
                    key={post.id}
                    to={`/blog/location/${post.slug}`}
                    className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-100"
                  >
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${config.bgColor} ${config.color}`}>
                          {config.icon}
                          {post.location}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 group-hover:text-trini-red transition-colors line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {post.readTime} min
                        </span>
                        <span className="flex items-center gap-1 text-trini-red font-medium">
                          Read <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* All Posts Grid */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {activeCategory === 'all' ? 'Latest Articles' :
              activeCategory === 'location' ? 'Location Guides' :
                categories.find(c => c.key === activeCategory)?.label || 'Articles'}
          </h2>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No articles found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => {
                const config = post.vertical ? verticalConfig[post.vertical] : null;
                return (
                  <article
                    key={post.id}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100"
                  >
                    <Link to={post.isLocationBlog ? `/blog/location/${post.slug}` : `/blog/${post.slug}`}>
                      <div className="h-48 relative overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          {post.isLocationBlog && post.location && config && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${config.bgColor} ${config.color}`}>
                              <MapPin className="h-3 w-3" />
                              {post.location}
                            </span>
                          )}
                          {!post.isLocationBlog && (
                            <span className="px-2 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-trini-red">
                              {post.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="p-5">
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {post.readTime} min
                        </span>
                      </div>

                      <Link to={post.isLocationBlog ? `/blog/location/${post.slug}` : `/blog/${post.slug}`}>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-trini-red transition-colors mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                      </Link>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="h-3 w-3" /> {post.author}
                        </span>
                        <Link
                          to={post.isLocationBlog ? `/blog/location/${post.slug}` : `/blog/${post.slug}`}
                          className="text-trini-red font-bold text-sm flex items-center gap-1 hover:underline"
                        >
                          Read <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="mt-20 relative overflow-hidden">
          <div className="bg-gradient-to-br from-trini-red to-orange-600 rounded-3xl p-12 md:p-16 text-white text-center relative z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <TrendingUp className="h-16 w-16 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Have a Success Story?</h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                If TriniBuild has helped your business grow, we'd love to feature you on our blog and share your journey with the community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white text-trini-red px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Submit Your Story
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Blog;