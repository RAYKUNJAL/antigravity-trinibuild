/**
 * TriniBuild Platform Features
 * Core features to be woven into SEO blog articles
 */

export interface TriniBuildFeature {
    key: string;
    label: string;
    summary: string;
    internal_url: string;
    benefits: string[];
    anchor_examples: string[];
}

export interface BlogVertical {
    key: string;
    label: string;
    search_intent_examples: string[];
    topic_templates: string[];
    related_features: string[];
}

export const TRINIBUILD_FEATURES: TriniBuildFeature[] = [
    {
        key: "free_webpages",
        label: "Free Webpages",
        summary: "TriniBuild gives every user a free, modern webpage to showcase their hustle, business, or services.",
        internal_url: "/free-website",
        benefits: [
            "No credit card required",
            "Professional design templates",
            "Mobile-optimized pages",
            "Custom domain support",
            "Built-in analytics"
        ],
        anchor_examples: [
            "create your free TriniBuild page",
            "get your free business webpage",
            "start with a free TriniBuild website"
        ]
    },
    {
        key: "marketplace",
        label: "Marketplace Stores",
        summary: "Sell goods and services online in a local T&T marketplace.",
        internal_url: "/marketplace",
        benefits: [
            "Up to 10 free product listings",
            "WhatsApp checkout integration",
            "Local delivery options",
            "No payment processor needed initially",
            "AI-powered product descriptions"
        ],
        anchor_examples: [
            "open your marketplace store",
            "list your products on TriniBuild",
            "start selling on the marketplace"
        ]
    },
    {
        key: "jobs",
        label: "Job Board",
        summary: "Find work, freelance gigs, and post jobs in your area.",
        internal_url: "/jobs",
        benefits: [
            "Browse local job listings",
            "Post freelance gigs",
            "AI-generated job letters",
            "Proof of income documents",
            "Skills verification"
        ],
        anchor_examples: [
            "browse jobs and gigs",
            "find work on TriniBuild",
            "post a job listing"
        ]
    },
    {
        key: "real_estate",
        label: "Real-Estate Listings",
        summary: "List rentals, homes for sale, land and commercial spaces.",
        internal_url: "/real-estate",
        benefits: [
            "Free property listings",
            "Tenant screening tools",
            "Virtual property tours",
            "Direct landlord-tenant communication",
            "Verified listings"
        ],
        anchor_examples: [
            "list your property",
            "find rentals on TriniBuild",
            "search real estate listings"
        ]
    },
    {
        key: "tickets",
        label: "Tickets & Events",
        summary: "Create and sell tickets for fetes, shows, and local events.",
        internal_url: "/tickets",
        benefits: [
            "E-ticket generation with QR codes",
            "Event promotion tools",
            "Secure ticket scanning",
            "Instant payouts",
            "Audience analytics"
        ],
        anchor_examples: [
            "sell tickets for your event",
            "promote your fete on TriniBuild",
            "create event tickets"
        ]
    },
    {
        key: "rideshare",
        label: "Rideshare & Delivery",
        summary: "Offer or request rides and deliveries through the platform.",
        internal_url: "/rides",
        benefits: [
            "GPS-tracked rides",
            "Fair local pricing",
            "Delivery service options",
            "Driver verification",
            "In-app payments"
        ],
        anchor_examples: [
            "start offering rides or deliveries",
            "book a ride on TriniBuild Go",
            "become a TriniBuild driver"
        ]
    }
];

export const BLOG_VERTICALS: BlogVertical[] = [
    {
        key: "jobs",
        label: "Jobs & Gigs",
        search_intent_examples: [
            "jobs in {{location_name}}",
            "gig work in {{location_name}}",
            "side hustle {{location_name}}",
            "freelance work {{location_name}}",
            "work from home {{location_name}}"
        ],
        topic_templates: [
            "How People in {{location_name}} Can Find Online Jobs and Gigs Using TriniBuild",
            "Side Hustle Guide for {{location_name}}: Turn Your Skills into Income with TriniBuild",
            "{{location_name}} Jobs: How TriniBuild Helps You Prove Income and Get Opportunities",
            "Top 10 Ways to Make Money Online in {{location_name}} with TriniBuild",
            "From Unemployed to Self-Employed: A {{location_name}} Success Story"
        ],
        related_features: ["jobs", "free_webpages", "marketplace"]
    },
    {
        key: "stores",
        label: "Stores & Small Businesses",
        search_intent_examples: [
            "online store in {{location_name}}",
            "small business in {{location_name}}",
            "sell products {{location_name}}",
            "start a business {{location_name}}",
            "ecommerce {{location_name}}"
        ],
        topic_templates: [
            "How to Launch an Online Store in {{location_name}} (Without a Credit Card) Using TriniBuild",
            "From Corner Shop to Online Shop: A Simple Guide for {{location_name}} Small Businesses",
            "Why Businesses in {{location_name}} Need a Free TriniBuild Webpage in 2025",
            "The Ultimate Guide to Selling Online in {{location_name}}",
            "How {{location_name}} Entrepreneurs Are Using TriniBuild to Scale"
        ],
        related_features: ["marketplace", "free_webpages"]
    },
    {
        key: "tickets",
        label: "Events & Tickets",
        search_intent_examples: [
            "events in {{location_name}}",
            "{{location_name}} fetes tickets",
            "buy tickets in {{location_name}}",
            "parties in {{location_name}}",
            "upcoming events {{location_name}}"
        ],
        topic_templates: [
            "How to Promote and Sell Event Tickets in {{location_name}} Using TriniBuild",
            "Fetes, Shows and Fundraisers in {{location_name}}: A New Way to Sell Tickets Online",
            "Step-by-Step: Listing Your {{location_name}} Event on TriniBuild's Ticket Platform",
            "The Complete Guide to Event Promotion in {{location_name}}",
            "Why {{location_name}} Promoters Are Switching to TriniBuild E-Tick"
        ],
        related_features: ["tickets", "free_webpages"]
    },
    {
        key: "real_estate",
        label: "Real Estate & Rentals",
        search_intent_examples: [
            "rentals in {{location_name}}",
            "apartments in {{location_name}}",
            "houses for sale {{location_name}}",
            "property for rent {{location_name}}",
            "land for sale {{location_name}}"
        ],
        topic_templates: [
            "Renting Smarter in {{location_name}}: How to List or Find Rentals on TriniBuild",
            "Landlords in {{location_name}}: Use TriniBuild to Screen and Reach More Tenants",
            "Buying or Selling in {{location_name}}? Why Real-Estate Listings on TriniBuild Help You Stand Out",
            "{{location_name}} Property Guide: Where to Buy, Rent, and Invest",
            "Finding Your Dream Home in {{location_name}} with TriniBuild"
        ],
        related_features: ["real_estate", "free_webpages"]
    },
    {
        key: "rideshare",
        label: "Rideshare & Transport",
        search_intent_examples: [
            "taxi in {{location_name}}",
            "rideshare {{location_name}}",
            "delivery service {{location_name}}",
            "uber alternative {{location_name}}",
            "driver jobs {{location_name}}"
        ],
        topic_templates: [
            "How Drivers in {{location_name}} Can Earn More with TriniBuild Rideshare & Delivery",
            "Safer, Smarter Transport in {{location_name}}: A Look at TriniBuild's Rideshare Tools",
            "From Taxi Stand to App: Bringing {{location_name}} Transport Online with TriniBuild",
            "The Complete Guide to Rideshare and Delivery in {{location_name}}",
            "Why {{location_name}} Drivers Are Joining TriniBuild Go"
        ],
        related_features: ["rideshare", "jobs"]
    },
    {
        key: "combo",
        label: "All-in-One Guide",
        search_intent_examples: [
            "TriniBuild {{location_name}}",
            "digital services {{location_name}}",
            "online business {{location_name}}"
        ],
        topic_templates: [
            "Digital Opportunities in {{location_name}}: Jobs, Rentals, Events and More with TriniBuild",
            "The Complete Guide to Using TriniBuild in {{location_name}} for Work, Business and Everyday Life",
            "How {{location_name}} Is Going Digital with TriniBuild",
            "Everything You Can Do on TriniBuild in {{location_name}}"
        ],
        related_features: ["free_webpages", "marketplace", "jobs", "real_estate", "tickets", "rideshare"]
    }
];

// SEO Configuration
export const SEO_RULES = {
    title_length_max: 65,
    meta_description_length_min: 120,
    meta_description_length_max: 160,
    word_count_min: 1000,
    word_count_max: 1500,
    required_fields: [
        "seo_title",
        "meta_description",
        "url_slug",
        "h1",
        "body_html"
    ],
    keyword_strategy: {
        primary_keyword_pattern: "{{vertical_label}} in {{location_name}}",
        secondary_keywords_patterns: [
            "TriniBuild in {{location_name}}",
            "online {{vertical_label}} {{location_name}}",
            "{{location_name}} {{vertical_key}} platform"
        ]
    }
};

// CTA Templates
export const CTA_TEMPLATES = {
    intro: [
        "Ready to get started? TriniBuild is free and built for {{location_name}}.",
        "Join thousands in {{location_name}} already using TriniBuild."
    ],
    mid: [
        "Create your free TriniBuild page today and put {{location_name}} on the map.",
        "List your {{vertical_label}} in {{location_name}} on TriniBuild and reach more locals."
    ],
    end: [
        "Sign up free and start using TriniBuild in {{location_name}} now.",
        "Don't wait—{{location_name}} is going digital. Join TriniBuild today.",
        "Your {{location_name}} business deserves to be seen. Get your free TriniBuild page now."
    ]
};

// Helper functions
export const getFeatureByKey = (key: string): TriniBuildFeature | undefined => {
    return TRINIBUILD_FEATURES.find(f => f.key === key);
};

export const getVerticalByKey = (key: string): BlogVertical | undefined => {
    return BLOG_VERTICALS.find(v => v.key === key);
};

export const getFeaturesForVertical = (verticalKey: string): TriniBuildFeature[] => {
    const vertical = getVerticalByKey(verticalKey);
    if (!vertical) return [];
    return TRINIBUILD_FEATURES.filter(f => vertical.related_features.includes(f.key));
};
