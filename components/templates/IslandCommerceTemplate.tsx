import React, { useState, useMemo } from 'react';
import {
  ShoppingBag, MessageCircle, Phone, Search, X, Plus, Minus,
  Truck, ShieldCheck, BadgeCheck, ChevronRight, Check, MapPin,
} from 'lucide-react';
import type { Product, ProductVariant, Store } from '../../types';
import { getContrastColor } from './contrast';

/**
 * ISLAND COMMERCE TEMPLATE — TriniBuild flagship
 *
 * Design language: Vercel Next.js Commerce (Geist) adapted for the islands.
 *  - Shadow-as-border (box-shadow 0 0 0 1px) instead of hard borders
 *  - Near-white canvas (#fff), near-black text (#171717)
 *  - Tight display typography, three-weight system
 *  - Achromatic chrome; brand color used only for primary CTAs + active states
 *
 * Island commerce reality:
 *  - WhatsApp-first ordering + Cash on Delivery (COD)
 *  - Real product VARIANTS (Color / Size swatches + pills)
 *  - Slide-out cart drawer; "Order whole cart on WhatsApp" as the checkout
 *  - Mobile sticky action bar (Add + WhatsApp, co-primary)
 */

// Map common island color names → hex for swatch rendering
const COLOR_MAP: Record<string, string> = {
  black: '#171717', white: '#ffffff', red: '#dc2626', green: '#16a34a',
  blue: '#2563eb', navy: '#1e3a5f', yellow: '#facc15', gold: '#d4af37',
  pink: '#ec4899', purple: '#7c3aed', orange: '#ea580c', brown: '#92400e',
  beige: '#e7d8b1', grey: '#6b7280', gray: '#6b7280', teal: '#0d9488',
  maroon: '#7f1d1d', cream: '#fdf6e3', khaki: '#bdb76b', denim: '#3b5b75',
};

const SHADOW_BORDER = '0 0 0 1px rgba(0,0,0,0.08)';
const SHADOW_CARD = '0 0 0 1px rgba(0,0,0,0.08), 0 2px 2px rgba(0,0,0,0.04), #fafafa 0 0 0 1px';

interface CartLine {
  key: string;
  product: Product;
  variant?: ProductVariant;
  qty: number;
}

export const IslandCommerceTemplate: React.FC<{
  storeName?: string;
  storeData?: Store;
  products?: Product[];
  primaryColor?: string;
}> = ({ storeName = 'Store', storeData, products = [], primaryColor = '#0d9488' }) => {
  const onPrimary = getContrastColor(primaryColor);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [picker, setPicker] = useState<Product | null>(null);

  const phone = (storeData?.whatsapp || storeData?.phone || '').replace(/\D/g, '');
  const active = useMemo(() => products.filter((p) => p.status === 'active'), [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    active.forEach((p) => { if (p.category) set.add(p.category); });
    return ['All', ...Array.from(set)];
  }, [active]);

  const visible = useMemo(() => active.filter((p) => {
    const catOk = activeCat === 'All' || p.category === activeCat;
    const qOk = !query || p.name.toLowerCase().includes(query.toLowerCase());
    return catOk && qOk;
  }), [active, activeCat, query]);

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cart.reduce((s, l) => s + (l.variant?.price ?? l.product.price) * l.qty, 0);

  // ─── Cart ops ───
  function addToCart(product: Product, variant?: ProductVariant) {
    const key = variant ? `${product.id}:${variant.id}` : product.id;
    setCart((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { key, product, variant, qty: 1 }];
    });
    setCartOpen(true);
    setPicker(null);
  }
  function setQty(key: string, qty: number) {
    if (qty <= 0) { setCart((p) => p.filter((l) => l.key !== key)); return; }
    setCart((p) => p.map((l) => (l.key === key ? { ...l, qty } : l)));
  }

  // ─── WhatsApp ───
  function waOrderCart() {
    if (!phone) return;
    let msg = `Hi ${storeName}! I'd like to order (Cash on Delivery):\n\n`;
    cart.forEach((l) => {
      const unit = l.variant?.price ?? l.product.price;
      const v = l.variant ? ` [${l.variant.title}]` : '';
      msg += `• ${l.product.name}${v} ×${l.qty} — TT$${(unit * l.qty).toFixed(2)}\n`;
    });
    msg += `\nTotal: TT$${cartTotal.toFixed(2)}\n\nMy delivery address: `;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }
  function waProduct(product: Product, variant?: ProductVariant) {
    if (!phone) return;
    const unit = variant?.price ?? product.price;
    const v = variant ? ` [${variant.title}]` : '';
    const msg = `Hi ${storeName}! I'm interested in ${product.name}${v} (TT$${unit.toFixed(2)}). Is it available for COD?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  const card = { background: '#fff', borderRadius: 12, boxShadow: SHADOW_CARD } as const;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#171717', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.01em' }}>
      {/* ─── HEADER ─── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', boxShadow: SHADOW_BORDER }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: primaryColor, color: onPrimary, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 15 }}>
              {storeName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.03em' }}>{storeName}</span>
          </div>

          <div style={{ flex: 1, maxWidth: 420, marginLeft: 'auto', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, color: '#808080' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, border: 'none', boxShadow: SHADOW_BORDER, fontSize: 14, outline: 'none', color: '#171717', background: '#fff' }}
            />
          </div>

          <button onClick={() => setCartOpen(true)} aria-label="Cart"
            style={{ position: 'relative', padding: 9, borderRadius: 8, border: 'none', boxShadow: SHADOW_BORDER, background: '#fff', cursor: 'pointer', color: '#171717' }}>
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9999, background: primaryColor, color: onPrimary, fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 20px 32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: '#ebf5ff', color: '#0068d6', fontSize: 12, fontWeight: 500, marginBottom: 20 }}>
          <MapPin size={12} /> {storeData?.address || 'Trinidad & Tobago'} · Island-wide delivery
        </div>
        <h1 style={{ fontSize: 'clamp(34px, 6vw, 52px)', fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.045em', margin: 0, maxWidth: 760 }}>
          {storeData?.tagline || `Shop ${storeName}.`}
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.6, color: '#4d4d4d', marginTop: 16, maxWidth: 560 }}>
          {storeData?.description || 'Quality products with Cash on Delivery and fast WhatsApp ordering across the islands.'}
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
          <a href="#shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 8, background: '#171717', color: '#fff', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>
            Browse products <ChevronRight size={15} />
          </a>
          {phone && (
            <button onClick={() => waProduct(active[0] ?? ({ name: 'your products', price: 0 } as Product))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 8, background: '#fff', color: '#171717', fontWeight: 500, fontSize: 14, border: 'none', boxShadow: SHADOW_BORDER, cursor: 'pointer' }}>
              <MessageCircle size={15} /> Order on WhatsApp
            </button>
          )}
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { icon: <Truck size={18} />, t: 'Cash on Delivery', s: 'Pay when it arrives' },
            { icon: <MessageCircle size={18} />, t: 'WhatsApp Ordering', s: 'Chat & confirm instantly' },
            { icon: <ShieldCheck size={18} />, t: 'Trusted Seller', s: 'Built on TriniBuild' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 10, boxShadow: SHADOW_BORDER }}>
              <span style={{ color: primaryColor }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{f.t}</div>
                <div style={{ fontSize: 12.5, color: '#666' }}>{f.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CATEGORY FILTER ─── */}
      {categories.length > 1 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 20px' }} id="shop">
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map((c) => {
              const on = activeCat === c;
              return (
                <button key={c} onClick={() => setActiveCat(c)}
                  style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 9999, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: 'none',
                    background: on ? '#171717' : '#fff', color: on ? '#fff' : '#171717', boxShadow: on ? 'none' : SHADOW_BORDER }}>
                  {c}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── PRODUCT GRID ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 80px' }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#808080' }}>
            <ShoppingBag size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: 16, fontWeight: 500, color: '#171717' }}>No products yet</p>
            <p style={{ fontSize: 14 }}>Products will appear here once added.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
            {visible.map((p) => {
              const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
              const low = typeof p.stock === 'number' && p.stock > 0 && p.stock <= 5;
              const out = p.stock === 0 && !hasVariants;
              return (
                <article key={p.id} style={{ ...card, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform .15s, box-shadow .15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.08), 0 8px 20px -8px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = SHADOW_CARD; }}>
                  <div style={{ position: 'relative', aspectRatio: '1', background: '#fafafa', overflow: 'hidden' }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#c4c4c4' }}><ShoppingBag size={32} /></div>
                    )}
                    {p.compare_at_price && p.compare_at_price > p.price && (
                      <span style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', borderRadius: 9999, background: '#171717', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                        SAVE TT${(p.compare_at_price - p.price).toFixed(0)}
                      </span>
                    )}
                    {low && (
                      <span style={{ position: 'absolute', top: 10, right: 10, padding: '3px 9px', borderRadius: 9999, background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 600 }}>
                        Only {p.stock} left
                      </span>
                    )}
                    {out && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'grid', placeItems: 'center' }}>
                        <span style={{ padding: '5px 12px', borderRadius: 8, background: '#171717', color: '#fff', fontSize: 13, fontWeight: 600 }}>Sold Out</span>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <h3 style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.3 }}>{p.name}</h3>
                    {p.description && <p style={{ fontSize: 12.5, color: '#666', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>TT${p.price.toFixed(2)}</span>
                      {p.compare_at_price && p.compare_at_price > p.price && (
                        <span style={{ fontSize: 12.5, color: '#999', textDecoration: 'line-through' }}>TT${p.compare_at_price.toFixed(2)}</span>
                      )}
                    </div>

                    {/* swatch preview for variant products */}
                    {hasVariants && <VariantSwatchPreview variants={p.variants} />}

                    <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
                      <button disabled={out}
                        onClick={() => (hasVariants ? setPicker(p) : addToCart(p))}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 10px', borderRadius: 8, border: 'none', cursor: out ? 'not-allowed' : 'pointer',
                          background: out ? '#f3f4f6' : primaryColor, color: out ? '#9ca3af' : onPrimary, fontWeight: 600, fontSize: 13 }}>
                        {hasVariants ? 'Choose options' : (<><Plus size={14} /> Add</>)}
                      </button>
                      {phone && (
                        <button onClick={() => waProduct(p)} aria-label="WhatsApp"
                          style={{ padding: 9, borderRadius: 8, border: 'none', boxShadow: SHADOW_BORDER, background: '#fff', cursor: 'pointer', color: '#25D366' }}>
                          <MessageCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ boxShadow: SHADOW_BORDER, padding: '40px 20px', background: '#fafafa' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em' }}>{storeName}</div>
          <p style={{ fontSize: 13.5, color: '#666', marginTop: 6 }}>{storeData?.description || 'Your trusted island store on TriniBuild.'}</p>
          {phone && (
            <button onClick={() => waProduct(active[0] ?? ({ name: 'your products', price: 0 } as Product))}
              style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, border: 'none', background: '#25D366', color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
              <MessageCircle size={15} /> Chat on WhatsApp
            </button>
          )}
          <div style={{ fontSize: 12, color: '#999', marginTop: 20 }}>Powered by TriniBuild · Cash on Delivery available</div>
        </div>
      </footer>

      {/* ─── VARIANT PICKER MODAL ─── */}
      {picker && (
        <VariantPicker product={picker} primaryColor={primaryColor} onPrimary={onPrimary}
          onClose={() => setPicker(null)} onAdd={addToCart} onWhatsApp={waProduct} phone={phone} />
      )}

      {/* ─── CART DRAWER ─── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, pointerEvents: cartOpen ? 'auto' : 'none' }}>
        <div onClick={() => setCartOpen(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: cartOpen ? 1 : 0, transition: 'opacity .25s' }} />
        <aside style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 'min(400px, 100%)', background: '#fff', boxShadow: '-8px 0 30px rgba(0,0,0,0.12)', transform: cartOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .28s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: SHADOW_BORDER }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Your Cart ({cartCount})</span>
            <button onClick={() => setCartOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#171717' }}><X size={20} /></button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#808080', paddingTop: 60 }}>
                <ShoppingBag size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>Your cart is empty</p>
              </div>
            ) : cart.map((l) => {
              const unit = l.variant?.price ?? l.product.price;
              return (
                <div key={l.key} style={{ display: 'flex', gap: 12, padding: '12px 0', boxShadow: '0 1px 0 0 rgba(0,0,0,0.06)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: '#fafafa', overflow: 'hidden', flexShrink: 0, boxShadow: SHADOW_BORDER }}>
                    {l.product.image_url && <img src={l.product.image_url} alt={l.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{l.product.name}</div>
                    {l.variant && <div style={{ fontSize: 12, color: '#666' }}>{l.variant.title}</div>}
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>TT${(unit * l.qty).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 'fit-content' }}>
                    <button onClick={() => setQty(l.key, l.qty - 1)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', boxShadow: SHADOW_BORDER, background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Minus size={13} /></button>
                    <span style={{ fontSize: 13.5, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{l.qty}</span>
                    <button onClick={() => setQty(l.key, l.qty + 1)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', boxShadow: SHADOW_BORDER, background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Plus size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div style={{ padding: 18, boxShadow: SHADOW_BORDER }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: '#666' }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 700 }}>TT${cartTotal.toFixed(2)}</span>
              </div>
              <button onClick={waOrderCart} disabled={!phone}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 8, border: 'none', background: '#25D366', color: '#fff', fontWeight: 600, fontSize: 15, cursor: phone ? 'pointer' : 'not-allowed' }}>
                <MessageCircle size={17} /> Order on WhatsApp (COD)
              </button>
              <p style={{ fontSize: 11.5, color: '#999', textAlign: 'center', marginTop: 8 }}>
                <BadgeCheck size={11} style={{ verticalAlign: -1 }} /> Pay cash on delivery — no upfront payment
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ─── MOBILE STICKY BAR ─── */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: 12, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 -1px 0 0 rgba(0,0,0,0.08)' }}>
          <button onClick={() => setCartOpen(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: 'none', background: primaryColor, color: onPrimary, fontWeight: 600, fontSize: 14.5, cursor: 'pointer' }}>
            <span>View Cart ({cartCount})</span>
            <span>TT${cartTotal.toFixed(2)} →</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Variant swatch preview (on card) ───
const VariantSwatchPreview: React.FC<{ variants: ProductVariant[] }> = ({ variants }) => {
  const colors = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    variants.forEach((v) => {
      const c = v.options?.Color || v.options?.color;
      if (c && !seen.has(c)) { seen.add(c); out.push(c); }
    });
    return out.slice(0, 5);
  }, [variants]);
  if (colors.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
      {colors.map((c) => (
        <span key={c} title={c}
          style={{ width: 16, height: 16, borderRadius: 9999, background: COLOR_MAP[c.toLowerCase()] || '#ccc', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }} />
      ))}
    </div>
  );
};

// ─── Variant picker modal ───
const VariantPicker: React.FC<{
  product: Product;
  primaryColor: string;
  onPrimary: string;
  phone: string;
  onClose: () => void;
  onAdd: (p: Product, v?: ProductVariant) => void;
  onWhatsApp: (p: Product, v?: ProductVariant) => void;
}> = ({ product, primaryColor, onPrimary, phone, onClose, onAdd, onWhatsApp }) => {
  // Build option groups from variants: { Color: [Red, Blue], Size: [S,M,L] }
  const optionGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    product.variants.forEach((v) => {
      Object.entries(v.options || {}).forEach(([k, val]) => {
        groups[k] = groups[k] || [];
        if (!groups[k].includes(val)) groups[k].push(val);
      });
    });
    return groups;
  }, [product]);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    Object.entries(optionGroups).forEach(([k, vals]) => { init[k] = vals[0]; });
    return init;
  });

  const matched = useMemo(() => product.variants.find((v) =>
    Object.entries(selected).every(([k, val]) => v.options?.[k] === val)
  ), [product, selected]);

  const price = matched?.price ?? product.price;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', width: 'min(440px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, border: 'none', background: '#fff', borderRadius: 9999, padding: 6, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)', cursor: 'pointer', color: '#171717', zIndex: 1 }}><X size={16} /></button>
        <div style={{ aspectRatio: '16/10', background: '#fafafa', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
          {product.image_url && <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ padding: 20 }}>
          <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.025em', margin: 0 }}>{product.name}</h3>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>TT${price.toFixed(2)}</div>

          {Object.entries(optionGroups).map(([groupName, values]) => {
            const isColor = groupName.toLowerCase() === 'color';
            return (
              <div key={groupName} style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{groupName}: <span style={{ color: '#171717' }}>{selected[groupName]}</span></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {values.map((val) => {
                    const on = selected[groupName] === val;
                    if (isColor) {
                      return (
                        <button key={val} onClick={() => setSelected((s) => ({ ...s, [groupName]: val }))} title={val}
                          style={{ width: 34, height: 34, borderRadius: 9999, background: COLOR_MAP[val.toLowerCase()] || '#ccc', cursor: 'pointer', border: 'none',
                            boxShadow: on ? `0 0 0 2px #fff, 0 0 0 4px ${primaryColor}` : '0 0 0 1px rgba(0,0,0,0.15)', display: 'grid', placeItems: 'center' }}>
                          {on && <Check size={15} color={getContrastColor(COLOR_MAP[val.toLowerCase()] || '#cccccc')} />}
                        </button>
                      );
                    }
                    return (
                      <button key={val} onClick={() => setSelected((s) => ({ ...s, [groupName]: val }))}
                        style={{ minWidth: 44, padding: '8px 14px', borderRadius: 9999, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: 'none',
                          background: on ? '#171717' : '#fff', color: on ? '#fff' : '#171717', boxShadow: on ? 'none' : '0 0 0 1px rgba(0,0,0,0.12)' }}>
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={() => onAdd(product, matched)}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px', borderRadius: 10, border: 'none', background: primaryColor, color: onPrimary, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              <Plus size={16} /> Add to Cart
            </button>
            {phone && (
              <button onClick={() => onWhatsApp(product, matched)}
                style={{ padding: '13px 16px', borderRadius: 10, border: 'none', background: '#25D366', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <MessageCircle size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IslandCommerceTemplate;
