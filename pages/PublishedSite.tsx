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
        const title = site.seo?.title || `${site.business_name} | ${site.island}`;
        const desc = site.seo?.description || `Shop ${site.business_name} online — cash on delivery available in ${site.island}.`;
        const url = `https://juvay.app/site/${site.slug}`;

        document.title = title;
        const setMeta = (selector: string, attr: string, content: string) => {
            let el = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
            if (!el) {
                el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
                if (selector.includes('property=')) el.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
                else if (selector.includes('name=')) el.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
                else if (selector.includes('rel=')) el.setAttribute('rel', selector.match(/rel="([^"]+)"/)?.[1] || '');
                document.head.appendChild(el);
            }
            el.setAttribute(attr, content);
        };
        setMeta('meta[name="description"]', 'content', desc);
        setMeta('link[rel="canonical"]', 'href', url);
        setMeta('meta[property="og:title"]', 'content', title);
        setMeta('meta[property="og:description"]', 'content', desc);
        setMeta('meta[property="og:url"]', 'content', url);
        setMeta('meta[property="og:type"]', 'content', 'business.business');
        setMeta('meta[name="twitter:title"]', 'content', title);
        setMeta('meta[name="twitter:description"]', 'content', desc);

        // JSON-LD LocalBusiness — this is what gets merchants into Google's
        // local pack / maps results, not just blue-link search.
        const contact = site.sections.find((s) => s.type === 'contact')?.data || {};
        let ld = document.getElementById('ld-json-store') as HTMLScriptElement | null;
        if (!ld) { ld = document.createElement('script'); ld.id = 'ld-json-store'; ld.type = 'application/ld+json'; document.head.appendChild(ld); }
        ld.textContent = JSON.stringify({
            '@context': 'https://schema.org', '@type': 'LocalBusiness',
            name: site.business_name, description: desc, url,
            address: { '@type': 'PostalAddress', addressLocality: contact.address || site.island, addressCountry: site.island },
            telephone: contact.phone || contact.whatsapp || undefined,
            priceRange: '$$',
            areaServed: site.island,
        });
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

    const contact = site.sections.find((s) => s.type === 'contact')?.data || {};
    const wa = String(contact.whatsapp || '').replace(/\D/g, '');

    return (
        <div style={{ background: site.theme.background, minHeight: '100vh' }}>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&display=swap" />
            {wa && (
                <a href={`https://wa.me/${wa}?text=${encodeURIComponent('Hi! I want to place an order 🛍️')}`} target="_blank" rel="noreferrer"
                    style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 50, background: '#25D366', color: '#fff', fontWeight: 800, padding: '14px 22px', borderRadius: 999, textDecoration: 'none', boxShadow: '0 8px 28px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                    💬 Order on WhatsApp
                </a>
            )}
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
