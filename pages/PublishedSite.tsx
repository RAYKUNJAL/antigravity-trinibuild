// Public page for AI-built websites: /site/:slug
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BuilderSite, getPublishedSite } from '../services/siteBuilderService';
import SiteSectionRenderer from '../components/SiteSectionRenderer';

export default function PublishedSite() {
    const { slug } = useParams<{ slug: string }>();
    const [site, setSite] = useState<BuilderSite | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!slug) return;
        getPublishedSite(slug)
            .then((s) => { if (s) setSite(s); else setNotFound(true); })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [slug]);

    useEffect(() => {
        if (!site) return;
        document.title = site.seo?.title || site.business_name;
        const meta = document.querySelector('meta[name="description"]');
        if (meta && site.seo?.description) meta.setAttribute('content', site.seo.description);
    }, [site]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="space-y-4 w-full max-w-3xl px-6">
                    <div className="h-48 bg-gray-900 rounded-2xl animate-pulse" />
                    <div className="h-24 bg-gray-900 rounded-2xl animate-pulse" />
                    <div className="h-24 bg-gray-900 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    if (notFound || !site) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 text-center">
                <p className="text-6xl mb-4">🏝️</p>
                <h1 className="text-3xl font-black mb-2">Site not found</h1>
                <p className="text-gray-400 mb-8">This website doesn't exist or hasn't been published yet.</p>
                <Link to="/" className="bg-[#E61E2B] px-6 py-3 rounded-xl font-bold">Go Home</Link>
            </div>
        );
    }

    return (
        <div style={{ background: site.theme.background, minHeight: '100vh' }}>
            {site.sections.filter((s) => s.enabled).map((sec) => (
                <SiteSectionRenderer key={sec.id} section={sec} theme={site.theme} storeId={site.store_id || undefined} />
            ))}
            {site.theme && (
                <div style={{ background: site.theme.background, color: site.theme.muted, textAlign: 'center', padding: '26px 16px', fontSize: 13, borderTop: `1px solid ${site.theme.muted}22` }}>
                    Built with ❤️ on <a href="/" style={{ color: site.theme.primary, fontWeight: 700, textDecoration: 'none' }}>the AI Website Builder</a>
                </div>
            )}
        </div>
    );
}
