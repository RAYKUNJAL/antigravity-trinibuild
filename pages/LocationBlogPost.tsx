import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Calendar,
    User,
    ArrowLeft,
    Share2,
    MapPin,
    Clock,
    Tag,
    TrendingUp,
    CheckCircle,
    ExternalLink,
    ChevronRight,
    Briefcase,
    Home as HomeIcon,
    Car,
    Ticket,
    Store,
    Globe
} from 'lucide-react';
import { GeneratedBlog } from '../services/blogEngineService';

// Type for stored blogs
interface StoredBlog extends GeneratedBlog {
    id: string;
    created_at: string;
    featured_image?: string;
    author?: string;
}

// Mock data - In production, this would come from Supabase
const SAMPLE_BLOGS: StoredBlog[] = [
    {
        id: '1',
        location_name: 'Port of Spain',
        location_slug: 'port-of-spain',
        region: 'Port of Spain',
        island: 'Trinidad',
        vertical_key: 'jobs',
        vertical_label: 'Jobs & Gigs',
        seo_title: 'Jobs in Port of Spain: Find Work & Gigs | TriniBuild',
        meta_description: 'Discover job opportunities and gig work in Port of Spain, Trinidad. TriniBuild helps you find local jobs, prove income, and build your career. Start free today!',
        url_slug: 'jobs-in-port-of-spain',
        primary_keyword: 'jobs in Port of Spain',
        secondary_keywords: ['work in Port of Spain', 'gigs Port of Spain', 'TriniBuild jobs'],
        h1: 'How People in Port of Spain Can Find Online Jobs and Gigs Using TriniBuild',
        headings: ['The Job Hunt Challenge in Port of Spain', 'How TriniBuild Helps You Find Work', 'Getting Started: Your Step-by-Step Guide'],
        body_markdown: '',
        body_html: `
      <p class="lead text-xl text-gray-600 mb-6">In the heart of Trinidad's capital, finding stable work or side hustles can feel like navigating Queen's Park Savannah during rush hour—overwhelming but not impossible.</p>
      
      <h2>The Job Hunt Challenge in Port of Spain</h2>
      <p>For many in Port of Spain, the traditional job search means endless scrolling through outdated newspaper classifieds or walking from office to office with a stack of résumés. Banks require proof of income for everything from credit cards to apartment rentals, but how do you prove income when you're hustling between gigs?</p>
      
      <h2>How TriniBuild Helps You Find Work</h2>
      <p>TriniBuild's free platform changes everything. Create your profile, list your skills, and connect with employers looking for talent in Port of Spain. Our AI-powered job letters help you present yourself professionally, while our income tracking gives you the documentation banks and landlords need.</p>
      
      <h2>Getting Started: Your Step-by-Step Guide</h2>
      <ol>
        <li>Sign up for your free TriniBuild account</li>
        <li>Complete your professional profile</li>
        <li>Browse jobs in Port of Spain</li>
        <li>Apply directly or set up your service page</li>
        <li>Track your earnings and download proof of income</li>
      </ol>
      
      <p class="mt-6 p-4 bg-trini-red/10 rounded-lg border border-trini-red/20">
        <strong>Ready to get started?</strong> Join thousands in Port of Spain already using TriniBuild to find work and build their careers. 
        <a href="/signup" class="text-trini-red font-bold hover:underline">Sign up free today →</a>
      </p>
    `,
        cta_blocks: [
            { position: 'intro', text: 'Join thousands in Port of Spain already using TriniBuild.' },
            { position: 'end', text: 'Sign up free and start using TriniBuild in Port of Spain now.' }
        ],
        internal_links_used: [
            { anchor_text: 'browse jobs and gigs', url: '/jobs', feature_key: 'jobs' },
            { anchor_text: 'create your free TriniBuild page', url: '/free-website', feature_key: 'free_webpages' }
        ],
        word_count: 450,
        reading_time_minutes: 3,
        generated_at: '2025-12-01T00:00:00Z',
        tone_variant: 'default',
        schema_org: {},
        open_graph: {},
        twitter_card: {},
        created_at: '2025-12-01T00:00:00Z',
        author: 'TriniBuild Team',
        featured_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200'
    }
];

const verticalIcons: Record<string, React.ReactNode> = {
    jobs: <Briefcase className="h-5 w-5" />,
    stores: <Store className="h-5 w-5" />,
    tickets: <Ticket className="h-5 w-5" />,
    real_estate: <HomeIcon className="h-5 w-5" />,
    rideshare: <Car className="h-5 w-5" />,
    combo: <Globe className="h-5 w-5" />
};

const verticalColors: Record<string, string> = {
    jobs: 'bg-blue-500',
    stores: 'bg-emerald-500',
    tickets: 'bg-purple-500',
    real_estate: 'bg-orange-500',
    rideshare: 'bg-cyan-500',
    combo: 'bg-gray-600'
};

// Helper to update meta tags dynamically
const updateMetaTags = (blog: StoredBlog, shareUrl: string) => {
    // Set document title
    document.title = blog.seo_title;

    // Helper to set or create meta tag
    const setMetaTag = (name: string, content: string, isProperty: boolean = false) => {
        const attr = isProperty ? 'property' : 'name';
        let tag = document.querySelector(`meta[${attr}="${name}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(attr, name);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    };

    // Basic meta tags
    setMetaTag('description', blog.meta_description);
    setMetaTag('keywords', [blog.primary_keyword, ...blog.secondary_keywords].join(', '));

    // Open Graph
    setMetaTag('og:type', 'article', true);
    setMetaTag('og:title', blog.seo_title, true);
    setMetaTag('og:description', blog.meta_description, true);
    setMetaTag('og:url', shareUrl, true);
    setMetaTag('og:site_name', 'TriniBuild', true);
    if (blog.featured_image) {
        setMetaTag('og:image', blog.featured_image, true);
    }

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', blog.seo_title);
    setMetaTag('twitter:description', blog.meta_description);
    if (blog.featured_image) {
        setMetaTag('twitter:image', blog.featured_image);
    }

    // Set or update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', shareUrl);

    // Add JSON-LD structured data
    let jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (!jsonLd) {
        jsonLd = document.createElement('script');
        jsonLd.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": blog.h1,
        "description": blog.meta_description,
        "author": {
            "@type": "Organization",
            "name": blog.author || "TriniBuild"
        },
        "publisher": {
            "@type": "Organization",
            "name": "TriniBuild",
            "logo": {
                "@type": "ImageObject",
                "url": "https://trinibuild.com/logo.png"
            }
        },
        "datePublished": blog.created_at,
        "dateModified": blog.created_at,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": shareUrl
        },
        "about": {
            "@type": "Place",
            "name": blog.location_name,
            "containedIn": {
                "@type": "Country",
                "name": "Trinidad and Tobago"
            }
        }
    });
};

export const LocationBlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [blog, setBlog] = useState<StoredBlog | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedBlogs, setRelatedBlogs] = useState<StoredBlog[]>([]);

    useEffect(() => {
        // In production, fetch from Supabase
        const fetchBlog = async () => {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            const foundBlog = SAMPLE_BLOGS.find(b => b.url_slug === slug);
            setBlog(foundBlog || null);

            // Get related blogs (same location or vertical)
            if (foundBlog) {
                const related = SAMPLE_BLOGS.filter(b =>
                    b.id !== foundBlog.id &&
                    (b.location_slug === foundBlog.location_slug || b.vertical_key === foundBlog.vertical_key)
                ).slice(0, 3);
                setRelatedBlogs(related);

                // Update meta tags for SEO
                const shareUrl = `https://trinibuild.com/blog/${foundBlog.url_slug}`;
                updateMetaTags(foundBlog, shareUrl);
            }

            setLoading(false);
        };

        fetchBlog();

        // Cleanup function to reset title when leaving
        return () => {
            document.title = 'TriniBuild - Build Your Digital Hustle';
        };
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
                <p className="text-gray-500 mb-6">The article you're looking for doesn't exist.</p>
                <Link to="/blog" className="text-trini-red hover:underline flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Blog
                </Link>
            </div>
        );
    }

    const shareUrl = `https://trinibuild.com/blog/${blog.url_slug}`;

    const handleShare = async (platform: string) => {
        const shareData = {
            title: blog.seo_title,
            text: blog.meta_description,
            url: shareUrl
        };

        if (platform === 'native' && navigator.share) {
            await navigator.share(shareData);
        } else {
            const urls: Record<string, string> = {
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.seo_title)}&url=${encodeURIComponent(shareUrl)}`,
                whatsapp: `https://wa.me/?text=${encodeURIComponent(blog.seo_title + ' ' + shareUrl)}`,
                linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(blog.seo_title)}`
            };
            if (urls[platform]) {
                window.open(urls[platform], '_blank', 'width=600,height=400');
            }
        }
    };

    return (
        <>
            <article className="min-h-screen bg-white">
                {/* Hero Header */}
                <header className="relative h-[50vh] min-h-[400px] w-full">
                    {blog.featured_image && (
                        <img
                            src={blog.featured_image}
                            alt={blog.h1}
                            className="w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
                        <div className="max-w-4xl mx-auto">
                            <Link
                                to="/blog"
                                className="inline-flex items-center text-white/80 hover:text-white mb-4 text-sm font-medium"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
                            </Link>

                            <div className="flex flex-wrap gap-3 mb-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-sm font-bold ${verticalColors[blog.vertical_key]}`}>
                                    {verticalIcons[blog.vertical_key]}
                                    {blog.vertical_label}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-sm">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {blog.location_name}, {blog.island}
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                                {blog.h1}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <User className="h-4 w-4" />
                                    {blog.author || 'TriniBuild Team'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(blog.created_at).toLocaleDateString('en-TT', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {blog.reading_time_minutes} min read
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                        {/* Article Body */}
                        <div className="lg:col-span-8">
                            {/* Keywords Bar */}
                            <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-gray-100">
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Tag className="h-4 w-4" /> Keywords:
                                </span>
                                <span className="text-sm font-medium text-trini-red bg-trini-red/10 px-2 py-1 rounded">
                                    {blog.primary_keyword}
                                </span>
                                {blog.secondary_keywords.map((kw, i) => (
                                    <span key={i} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                        {kw}
                                    </span>
                                ))}
                            </div>

                            {/* Article Content */}
                            <div
                                className="prose prose-lg prose-gray max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-p:text-gray-700 prose-p:leading-relaxed
                  prose-a:text-trini-red prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900
                  prose-ul:my-4 prose-li:text-gray-700
                  prose-ol:my-4
                  prose-blockquote:border-l-4 prose-blockquote:border-trini-red prose-blockquote:italic prose-blockquote:text-gray-600"
                                dangerouslySetInnerHTML={{ __html: blog.body_html }}
                            />

                            {/* Internal Links Section */}
                            {blog.internal_links_used.length > 0 && (
                                <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <ExternalLink className="h-5 w-5 text-trini-red" />
                                        Explore More on TriniBuild
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {blog.internal_links_used.map((link, i) => (
                                            <Link
                                                key={i}
                                                to={link.url}
                                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-trini-red hover:shadow-md transition-all group"
                                            >
                                                <span className="text-gray-700 group-hover:text-trini-red">{link.anchor_text}</span>
                                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-trini-red" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="lg:col-span-4 space-y-6">
                            {/* Share Widget */}
                            <div className="sticky top-8 space-y-6">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="font-bold mb-4 flex items-center gap-2">
                                        <Share2 className="h-5 w-5" />
                                        Share this article
                                    </h3>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleShare('facebook')}
                                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            Facebook
                                        </button>
                                        <button
                                            onClick={() => handleShare('twitter')}
                                            className="flex-1 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium"
                                        >
                                            Twitter
                                        </button>
                                        <button
                                            onClick={() => handleShare('whatsapp')}
                                            className="flex-1 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                                        >
                                            WhatsApp
                                        </button>
                                    </div>
                                </div>

                                {/* CTA Widget */}
                                <div className="bg-gradient-to-br from-trini-red to-orange-500 rounded-2xl p-6 text-white">
                                    <TrendingUp className="h-10 w-10 mb-4 opacity-80" />
                                    <h3 className="font-bold text-xl mb-2">Start Your Journey</h3>
                                    <p className="text-white/80 text-sm mb-6">
                                        Join thousands in {blog.location_name} using TriniBuild to grow their business and find opportunities.
                                    </p>
                                    <Link
                                        to="/signup"
                                        className="block w-full py-3 bg-white text-trini-red font-bold rounded-lg text-center hover:bg-gray-100 transition-colors"
                                    >
                                        Sign Up Free
                                    </Link>
                                </div>

                                {/* Location Info */}
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="font-bold mb-4 flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-trini-red" />
                                        About {blog.location_name}
                                    </h3>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            Region: {blog.region}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            Island: {blog.island}
                                        </li>
                                    </ul>
                                    <Link
                                        to={`/blog?location=${blog.location_slug}`}
                                        className="mt-4 flex items-center text-trini-red font-medium text-sm hover:underline"
                                    >
                                        More articles about {blog.location_name}
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>

                                {/* Related Articles */}
                                {relatedBlogs.length > 0 && (
                                    <div className="bg-gray-50 rounded-2xl p-6">
                                        <h3 className="font-bold mb-4">Related Articles</h3>
                                        <div className="space-y-3">
                                            {relatedBlogs.map(related => (
                                                <Link
                                                    key={related.id}
                                                    to={`/blog/${related.url_slug}`}
                                                    className="block p-3 bg-white rounded-lg hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`p-1 rounded ${verticalColors[related.vertical_key]}`}>
                                                            <Briefcase className="h-3 w-3 text-white" />
                                                        </span>
                                                        <span className="text-xs text-gray-500">{related.location_name}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-800 group-hover:text-trini-red line-clamp-2">
                                                        {related.h1}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </article>
        </>
    );
};

export default LocationBlogPost;
