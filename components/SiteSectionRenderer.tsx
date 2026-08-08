// Renders one builder section. Shared between the live editor preview
// and the published public site so what you see is exactly what ships.
import React, { useEffect, useState } from 'react';
import { SiteSection, SiteTheme, getStoreProducts } from '../services/siteBuilderService';

interface Props {
    section: SiteSection;
    theme: SiteTheme;
    storeId?: string;
    preview?: boolean;
}

const Star = () => <span style={{ color: '#FFD700' }}>★</span>;

export default function SiteSectionRenderer({ section, theme, storeId, preview }: Props) {
    const t = theme;
    const d = section.data || {};
    const pad = 'padding: clamp(40px, 7vw, 88px) clamp(20px, 6vw, 72px)';

    const S: Record<string, React.CSSProperties> = {
        wrap: { background: t.background, color: t.text, fontFamily: t.bodyFont },
        h2: { fontFamily: t.headingFont, fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', margin: 0, lineHeight: 1.15 },
        muted: { color: t.muted, lineHeight: 1.65 },
        card: { background: t.surface, borderRadius: t.radius, border: `1px solid ${t.muted}22` },
        btn: {
            display: 'inline-block', background: t.primary, color: '#fff', fontWeight: 800,
            padding: '15px 32px', borderRadius: t.radius, textDecoration: 'none', fontSize: 16,
        },
        btnGhost: {
            display: 'inline-block', background: 'transparent', color: t.text, fontWeight: 700,
            padding: '14px 30px', borderRadius: t.radius, textDecoration: 'none', border: `2px solid ${t.muted}66`, fontSize: 16,
        },
    };

    const sectionStyle: React.CSSProperties = { ...S.wrap, padding: 'clamp(44px, 7vw, 92px) clamp(20px, 6vw, 72px)' };

    switch (section.type) {
        case 'hero':
            return (
                <section style={{ ...sectionStyle, textAlign: 'center', background: `radial-gradient(ellipse at 50% -20%, ${t.primary}33, transparent 60%), ${t.background}` }}>
                    {d.eyebrow && (
                        <div style={{ display: 'inline-block', border: `1px solid ${t.primary}66`, color: t.primary, borderRadius: 999, padding: '6px 16px', fontSize: 13, fontWeight: 700, marginBottom: 22 }}>
                            {d.eyebrow}
                        </div>
                    )}
                    <h1 style={{ fontFamily: t.headingFont, fontWeight: 900, fontSize: 'clamp(36px,6.5vw,64px)', margin: '0 0 10px', lineHeight: 1.05 }}>{d.headline}</h1>
                    {d.tagline && <p style={{ color: t.primary, fontWeight: 800, fontSize: 'clamp(17px,2.4vw,22px)', margin: '0 0 14px' }}>{d.tagline}</p>}
                    {d.subheadline && <p style={{ ...S.muted, maxWidth: 620, margin: '0 auto 30px', fontSize: 17 }}>{d.subheadline}</p>}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {d.ctaText && <a href={preview ? undefined : d.ctaLink} style={S.btn}>{d.ctaText}</a>}
                        {d.secondaryCtaText && <a href={preview ? undefined : d.secondaryCtaLink} style={S.btnGhost}>{d.secondaryCtaText}</a>}
                    </div>
                </section>
            );

        case 'about':
            return (
                <section style={sectionStyle}>
                    <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={S.h2}>{d.title}</h2>
                        <div style={{ width: 56, height: 4, background: t.primary, borderRadius: 4, margin: '18px auto 24px' }} />
                        <p style={{ ...S.muted, fontSize: 17 }}>{d.body}</p>
                    </div>
                </section>
            );

        case 'features':
            return (
                <section style={{ ...sectionStyle, background: `${t.surface}` }}>
                    <h2 style={{ ...S.h2, textAlign: 'center', marginBottom: 40 }}>{d.title}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
                        {(d.items || []).map((it: any, i: number) => (
                            <div key={it.id || i} style={{ ...S.card, background: t.background, padding: 26 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${t.primary}22`, color: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, marginBottom: 14 }}>
                                    {i + 1}
                                </div>
                                <h3 style={{ fontFamily: t.headingFont, fontWeight: 800, fontSize: 18, margin: '0 0 8px' }}>{it.title}</h3>
                                <p style={{ ...S.muted, fontSize: 14.5, margin: 0 }}>{it.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            );

        case 'products':
            return <ProductsSection d={d} S={S} t={t} storeId={storeId} sectionStyle={sectionStyle} preview={preview} />;

        case 'testimonials':
            return (
                <section style={{ ...sectionStyle, background: t.surface }}>
                    <h2 style={{ ...S.h2, textAlign: 'center', marginBottom: 40 }}>{d.title}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 860, margin: '0 auto' }}>
                        {(d.items || []).map((it: any, i: number) => (
                            <div key={it.id || i} style={{ ...S.card, background: t.background, padding: 26 }}>
                                <div style={{ marginBottom: 10 }}>{Array.from({ length: it.stars || 5 }).map((_, s) => <Star key={s} />)}</div>
                                <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: '0 0 14px' }}>"{it.text}"</p>
                                <p style={{ ...S.muted, fontSize: 13.5, fontWeight: 700, margin: 0 }}>— {it.name}</p>
                            </div>
                        ))}
                    </div>
                </section>
            );

        case 'hours':
            return (
                <section style={sectionStyle}>
                    <div style={{ maxWidth: 520, margin: '0 auto' }}>
                        <h2 style={{ ...S.h2, textAlign: 'center', marginBottom: 30 }}>{d.title}</h2>
                        <div style={{ ...S.card, padding: '10px 26px' }}>
                            {(d.rows || []).map((r: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: i < (d.rows?.length || 0) - 1 ? `1px solid ${t.muted}22` : 'none' }}>
                                    <span style={{ fontWeight: 700 }}>{r.day}</span>
                                    <span style={S.muted}>{r.hours}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            );

        case 'faq':
            return (
                <section style={{ ...sectionStyle, background: t.surface }}>
                    <div style={{ maxWidth: 720, margin: '0 auto' }}>
                        <h2 style={{ ...S.h2, textAlign: 'center', marginBottom: 34 }}>{d.title}</h2>
                        {(d.items || []).map((it: any, i: number) => (
                            <details key={it.id || i} style={{ ...S.card, background: t.background, padding: '18px 22px', marginBottom: 12, cursor: 'pointer' }}>
                                <summary style={{ fontWeight: 800, fontSize: 16, listStyle: 'none' }}>{it.q}</summary>
                                <p style={{ ...S.muted, fontSize: 15, marginTop: 10, marginBottom: 0 }}>{it.a}</p>
                            </details>
                        ))}
                    </div>
                </section>
            );

        case 'contact': {
            const rows: [string, string, string][] = [
                ['📱', 'WhatsApp', d.whatsapp], ['☎️', 'Phone', d.phone], ['✉️', 'Email', d.email],
                ['📸', 'Instagram', d.instagram], ['📍', 'Address', d.address],
            ];
            const active = rows.filter(([, , v]) => v && String(v).trim());
            return (
                <section id="contact" style={sectionStyle}>
                    <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={S.h2}>{d.title}</h2>
                        <div style={{ marginTop: 30, display: 'grid', gap: 12 }}>
                            {active.length === 0 && <p style={S.muted}>Add your contact details in the editor.</p>}
                            {active.map(([icon, label, value], i) => {
                                const href = label === 'WhatsApp' ? `https://wa.me/${String(value).replace(/\D/g, '')}`
                                    : label === 'Phone' ? `tel:${value}`
                                        : label === 'Email' ? `mailto:${value}`
                                            : label === 'Instagram' ? `https://instagram.com/${String(value).replace('@', '')}` : undefined;
                                const inner = (
                                    <div style={{ ...S.card, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                                        <span style={{ fontSize: 22 }}>{icon}</span>
                                        <div>
                                            <p style={{ ...S.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>{label}</p>
                                            <p style={{ fontWeight: 700, margin: 0 }}>{value}</p>
                                        </div>
                                    </div>
                                );
                                return href && !preview
                                    ? <a key={i} href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: t.text }}>{inner}</a>
                                    : <div key={i}>{inner}</div>;
                            })}
                        </div>
                    </div>
                </section>
            );
        }

        case 'payments':
            return (
                <section style={sectionStyle}>
                    <div style={{ textAlign: 'center', marginBottom: 34 }}>
                        <h2 style={S.h2}>{d.title}</h2>
                        {d.subtitle && <p style={{ ...S.muted, marginTop: 10, fontWeight: 600 }}>{d.subtitle}</p>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, maxWidth: 900, margin: '0 auto' }}>
                        {(d.methods || []).map((m: any, i: number) => (
                            <div key={m.id || i} style={{ ...S.card, padding: 26, textAlign: 'center', borderTop: `3px solid ${t.primary}` }}>
                                <div style={{ fontSize: 34, marginBottom: 12 }}>{m.icon}</div>
                                <h3 style={{ fontFamily: t.headingFont, fontWeight: 800, fontSize: 17, margin: '0 0 7px' }}>{m.name}</h3>
                                <p style={{ ...S.muted, fontSize: 14, margin: 0 }}>{m.detail}</p>
                            </div>
                        ))}
                    </div>
                </section>
            );

        case 'cta':
            return (
                <section style={{ ...sectionStyle, textAlign: 'center', background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, color: '#fff' }}>
                    <h2 style={{ fontFamily: t.headingFont, fontWeight: 900, fontSize: 'clamp(26px,4vw,40px)', margin: '0 0 12px' }}>{d.headline}</h2>
                    {d.sub && <p style={{ opacity: 0.9, maxWidth: 560, margin: '0 auto 28px', fontSize: 17 }}>{d.sub}</p>}
                    {d.ctaText && (
                        <a href={preview ? undefined : d.ctaLink} style={{ display: 'inline-block', background: '#fff', color: t.primary, fontWeight: 900, padding: '15px 36px', borderRadius: t.radius, textDecoration: 'none', fontSize: 16 }}>
                            {d.ctaText}
                        </a>
                    )}
                </section>
            );

        default:
            return null;
    }
}

// Products section pulls live products from the connected store
function ProductsSection({ d, S, t, storeId, sectionStyle, preview }: any) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(!!storeId);

    useEffect(() => {
        if (!storeId) { setLoading(false); return; }
        setLoading(true);
        getStoreProducts(storeId).then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false));
    }, [storeId]);

    return (
        <section id="products" style={sectionStyle}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <h2 style={S.h2}>{d.title}</h2>
                {d.subtitle && <p style={{ ...S.muted, marginTop: 10 }}>{d.subtitle}</p>}
            </div>
            {loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18, maxWidth: 1000, margin: '0 auto' }}>
                    {[1, 2, 3, 4].map((i) => <div key={i} style={{ ...S.card, height: 260, opacity: 0.4, animation: 'pulse 1.5s infinite' }} />)}
                </div>
            )}
            {!loading && products.length === 0 && (
                <p style={{ ...S.muted, textAlign: 'center' }}>
                    {storeId ? 'No products yet — add products in your store dashboard and they appear here automatically.' : 'Connect your store in the editor to show live products here.'}
                </p>
            )}
            {!loading && products.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18, maxWidth: 1000, margin: '0 auto' }}>
                    {products.map((p) => (
                        <div key={p.id} style={{ ...S.card, overflow: 'hidden' }}>
                            <div style={{ height: 150, background: `${t.muted}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {p.image_url
                                    ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                                    : <span style={{ fontSize: 34 }}>🛍️</span>}
                            </div>
                            <div style={{ padding: 16 }}>
                                <p style={{ fontWeight: 800, fontSize: 15, margin: '0 0 6px', lineHeight: 1.3 }}>{p.name}</p>
                                <p style={{ color: t.primary, fontWeight: 900, fontSize: 17, margin: 0 }}>TT${Number(p.displayPrice || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
