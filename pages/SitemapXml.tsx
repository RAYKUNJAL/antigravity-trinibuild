// Dynamic sitemap.xml — served at /sitemap.xml. Includes static marketing
// pages + every active store + every published AI-built site, so Google
// indexes merchants automatically as they onboard.
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const STATIC_PATHS = [
    '', 'website-builder', 'pricing', 'jobs', 'real-estate', 'classifieds',
    'events', 'driver-pass', 'documents',
];

export default function SitemapXml() {
    useEffect(() => {
        (async () => {
            const base = 'https://juvay.app';
            const urls: { loc: string; priority: string; changefreq: string }[] =
                STATIC_PATHS.map((p) => ({ loc: `${base}/${p}`, priority: p === '' ? '1.0' : '0.7', changefreq: 'weekly' }));

            const [{ data: stores }, { data: sites }] = await Promise.all([
                supabase.from('stores').select('slug,updated_at').eq('status', 'active').not('slug', 'is', null).limit(5000),
                supabase.from('builder_sites').select('slug,updated_at').eq('status', 'published').limit(5000),
            ]);
            (stores || []).forEach((s: any) => urls.push({ loc: `${base}/store/${s.slug}`, priority: '0.8', changefreq: 'daily' }));
            (sites || []).forEach((s: any) => urls.push({ loc: `${base}/site/${s.slug}`, priority: '0.8', changefreq: 'daily' }));

            const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
                .map((u) => `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
                .join('\n')}\n</urlset>`;

            document.open('text/xml');
            document.write(xml);
            document.close();
        })();
    }, []);
    return null;
}
