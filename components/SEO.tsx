import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    /** Override canonical URL. If not provided, derived from window.location.pathname. */
    url?: string;
    /** Optional JSON-LD structured data (e.g. FAQ schema, Service schema, Organization). */
    structuredData?: Record<string, any> | Record<string, any>[];
    /** Set true on pages we don't want crawled (admin, dashboards, search results). */
    noindex?: boolean;
}

const SITE_URL = 'https://trinibuild.com';
const SITE_TITLE = 'TriniBuild - The Digital Ecosystem of Trinidad & Tobago';
const DEFAULT_IMAGE = 'https://trinibuild.com/og-image.jpg';

/**
 * Computes a canonical URL.
 * - If caller passed an explicit `url`, use it
 * - Else derive from window.location.pathname (CSR-safe; no SSR in this app)
 * - Strips query strings and trailing slashes for stability
 */
const computeCanonical = (override?: string): string => {
    if (override) return override;
    if (typeof window === 'undefined') return SITE_URL;
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    return `${SITE_URL}${path}`;
};

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    image,
    url,
    structuredData,
    noindex,
}) => {
    const fullTitle = `${title} | TriniBuild`;
    const canonical = computeCanonical(url);
    const ogImage = image || DEFAULT_IMAGE;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}

            {/* CANONICAL — prevents duplicate-content penalties between
                /services/* (canonical) and /solutions/* (legacy alias) */}
            <link rel="canonical" href={canonical} />

            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_TITLE} />
            <meta property="og:url" content={canonical} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={canonical} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={ogImage} />

            {/* JSON-LD structured data — supports rich snippets in Google */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(
                        Array.isArray(structuredData) ? structuredData : structuredData
                    )}
                </script>
            )}
        </Helmet>
    );
};
