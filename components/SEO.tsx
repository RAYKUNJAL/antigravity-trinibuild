import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    url?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, keywords, image, url }) => {
    const siteTitle = "TriniBuild - The Digital Ecosystem of Trinidad & Tobago";
    const fullTitle = `${title} | TriniBuild`;
    const defaultImage = "https://trinibuild.com/og-image.jpg"; // Placeholder
    const siteUrl = "https://trinibuild.com";

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url || siteUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image || defaultImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url || siteUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image || defaultImage} />
        </Helmet>
    );
};
