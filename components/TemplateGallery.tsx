import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TRINIDAD_TEMPLATES, StoreTemplate } from '../services/templateService';
import { ArrowRight, X, Globe } from 'lucide-react';

// ─── Mini site previews: pure React/CSS, no images needed ────────────────────

const P_basic_storefront = () => (
  <div style={{ fontFamily: 'system-ui', background: '#f8f7f4', height: '100%', overflow: 'hidden', fontSize: 11 }}>
    <div style={{ background: '#1a1a1a', color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 800, fontSize: 13 }}>MyShop TT</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ opacity: 0.6, fontSize: 10 }}>Products</span>
        <span style={{ opacity: 0.6, fontSize: 10 }}>About</span>
        <div style={{ background: '#E61E2B', borderRadius: 20, padding: '3px 10px', fontSize: 9, fontWeight: 700 }}>Cart 0</div>
      </div>
    </div>
    <div style={{ background: 'linear-gradient(135deg,#E61E2B,#b01520)', color: '#fff', padding: '20px 14px' }}>
      <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.1 }}>Your Store, Your Rules</div>
      <div style={{ opacity: 0.8, fontSize: 10, marginTop: 4 }}>Everything Trinidad needs, online.</div>
      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <div style={{ background: '#fff', color: '#E61E2B', borderRadius: 20, padding: '4px 12px', fontWeight: 800, fontSize: 9 }}>Shop Now</div>
        <div style={{ border: '1px solid rgba(255,255,255,0.5)', borderRadius: 20, padding: '4px 12px', fontSize: 9 }}>Learn More</div>
      </div>
    </div>
    <div style={{ padding: '10px 14px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 8, color: '#888', letterSpacing: 1 }}>FEATURED PRODUCTS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {[['#e8f4fd','#2563eb'],['#fef3f2','#E61E2B'],['#f0fdf4','#16a34a']].map(([bg, ac], i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ background: bg, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 22, height: 22, background: ac, borderRadius: 6, opacity: 0.5 }} />
            </div>
            <div style={{ padding: '5px 6px' }}>
              <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, marginBottom: 3 }} />
              <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3, width: '60%', marginBottom: 4 }} />
              <div style={{ height: 14, background: ac, borderRadius: 4, opacity: 0.85 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const P_roti_shop_pro = () => (
  <div style={{ fontFamily: 'system-ui', background: '#fffbf5', height: '100%', overflow: 'hidden', fontSize: 11 }}>
    <div style={{ background: '#7c2d12', color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: 12 }}>Mama's Roti Shop</div>
        <div style={{ opacity: 0.6, fontSize: 9 }}>Open now · Chaguanas</div>
      </div>
      <div style={{ background: '#FFD700', color: '#7c2d12', borderRadius: 20, padding: '3px 10px', fontSize: 9, fontWeight: 800 }}>Order Now</div>
    </div>
    <div style={{ background: 'linear-gradient(160deg,#9a3412,#7c2d12)', padding: '16px 14px', color: '#fff', display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>Fresh Roti &amp; Curry Daily</div>
        <div style={{ opacity: 0.75, fontSize: 9, marginTop: 4 }}>Doubles · Buss-up-shut · Dhal Puri</div>
        <div style={{ marginTop: 8, background: '#FFD700', color: '#7c2d12', borderRadius: 20, padding: '4px 14px', fontWeight: 800, fontSize: 9, display: 'inline-block' }}>See Menu</div>
      </div>
      <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🍛</div>
    </div>
    <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {[['Chicken Curry Roti','$35'],['Dhal Puri','$28'],['Doubles','$12'],['Shark & Bake','$45']].map(([n, p], i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '7px 9px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ height: 4, background: i % 2 === 0 ? '#fed7aa' : '#fde68a', borderRadius: 3, marginBottom: 5 }} />
          <div style={{ fontWeight: 700, fontSize: 10, color: '#1a1a1a' }}>{n}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ color: '#9a3412', fontWeight: 800, fontSize: 11 }}>TT{p}</span>
            <div style={{ background: '#9a3412', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 8 }}>Add</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const P_restaurant_premium = () => (
  <div style={{ fontFamily: 'Georgia, serif', background: '#0c0a07', height: '100%', overflow: 'hidden', fontSize: 11, color: '#fff' }}>
    <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,215,0,0.15)' }}>
      <span style={{ color: '#FFD700', fontWeight: 700, fontStyle: 'italic', fontSize: 14 }}>Saveur</span>
      <div style={{ display: 'flex', gap: 10, opacity: 0.5, fontFamily: 'system-ui', fontSize: 9 }}>
        <span>Menu</span><span>Reserve</span><span>About</span>
      </div>
    </div>
    <div style={{ textAlign: 'center', padding: '16px 14px 10px' }}>
      <div style={{ color: '#FFD700', fontSize: 8, letterSpacing: 4, fontFamily: 'system-ui', fontWeight: 600, marginBottom: 6 }}>PORT OF SPAIN · FINE DINING</div>
      <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1, fontStyle: 'italic' }}>An Unforgettable<br />Culinary Journey</div>
      <div style={{ marginTop: 10, display: 'inline-flex', gap: 6 }}>
        <div style={{ background: '#FFD700', color: '#0c0a07', padding: '4px 14px', borderRadius: 2, fontFamily: 'system-ui', fontWeight: 800, fontSize: 9 }}>Reserve Table</div>
        <div style={{ border: '1px solid rgba(255,215,0,0.4)', padding: '4px 14px', borderRadius: 2, fontFamily: 'system-ui', fontSize: 9 }}>View Menu</div>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, padding: '0 14px' }}>
      {[['#1a1208','Pan-Seared Snapper','$189'],['#0f1a0a','Jerk Lamb Rack','$215'],['#1a1218','Passion Fruit Soufflé','$95']].map(([bg, n, p], i) => (
        <div key={i} style={{ background: bg, borderRadius: 6, border: '1px solid rgba(255,215,0,0.1)', padding: '6px' }}>
          <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: 'rgba(255,215,0,0.04)', borderRadius: 4, marginBottom: 5 }}>
            {['🐟','🥩','🍮'][i]}
          </div>
          <div style={{ fontSize: 8, fontStyle: 'italic', opacity: 0.8, lineHeight: 1.3 }}>{n}</div>
          <div style={{ color: '#FFD700', fontSize: 9, fontFamily: 'system-ui', fontWeight: 700, marginTop: 2 }}>TT{p}</div>
        </div>
      ))}
    </div>
    <div style={{ margin: '8px 14px 0', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 6, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', fontFamily: 'system-ui' }}>
      <span style={{ fontSize: 9, opacity: 0.6 }}>Tue–Sun  6pm–11pm</span>
      <span style={{ fontSize: 9, color: '#FFD700' }}>Michelin Recognised</span>
    </div>
  </div>
);

const P_clothing_store_pro = () => (
  <div style={{ fontFamily: 'system-ui', background: '#fafaf8', height: '100%', overflow: 'hidden', fontSize: 11 }}>
    <div style={{ background: '#fff', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1a1a1a' }}>
      <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>ISLE MODE</span>
      <div style={{ display: 'flex', gap: 8, fontSize: 9, fontWeight: 700 }}>
        <span>WOMEN</span><span>MEN</span><span>SALE</span>
      </div>
    </div>
    <div style={{ background: '#1a1a1a', color: '#fff', padding: '18px 14px', display: 'flex', gap: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, letterSpacing: 3, opacity: 0.4, marginBottom: 4 }}>NEW ARRIVALS</div>
        <div style={{ fontSize: 20, lineHeight: 1, fontWeight: 900 }}>TRINI SUMMER<br />COLLECTION</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 5 }}>
          <div style={{ background: '#E61E2B', color: '#fff', padding: '3px 10px', borderRadius: 2, fontSize: 9, fontWeight: 800 }}>SHOP NOW</div>
          <div style={{ border: '1px solid rgba(255,255,255,0.25)', padding: '3px 10px', borderRadius: 2, fontSize: 9 }}>LOOKBOOK</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: 64 }}>
        {['#c7d2fe','#fce7f3','#d1fae5','#fff7ed'].map((c, i) => (
          <div key={i} style={{ background: c, borderRadius: 4, height: 30 }} />
        ))}
      </div>
    </div>
    <div style={{ padding: '10px 14px', display: 'flex', gap: 6 }}>
      {[['MAXI DRESS','$299','#fce7f3'],['LINEN SET','$349','#d1fae5'],['BEACH BAG','$199','#fff7ed']].map(([n, p, bg], i) => (
        <div key={i} style={{ flex: 1, background: '#fff', borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ background: bg, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 22, height: 30, background: 'rgba(0,0,0,0.1)', borderRadius: 4 }} />
          </div>
          <div style={{ padding: '5px 5px' }}>
            <div style={{ fontSize: 8, letterSpacing: 1, fontWeight: 700 }}>{n}</div>
            <div style={{ color: '#E61E2B', fontSize: 9, fontWeight: 800 }}>TT{p}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const P_salon_barber_pro = () => (
  <div style={{ fontFamily: 'system-ui', background: '#111', height: '100%', overflow: 'hidden', fontSize: 11, color: '#fff' }}>
    <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 1 }}>FADE KINGS</div>
        <div style={{ opacity: 0.4, fontSize: 8 }}>San Fernando · Est. 2015</div>
      </div>
      <div style={{ background: '#FFD700', color: '#111', borderRadius: 3, padding: '3px 10px', fontSize: 9, fontWeight: 800 }}>BOOK NOW</div>
    </div>
    <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>Precision Cuts.<br />Fresh Always.</div>
        <div style={{ opacity: 0.4, fontSize: 9, marginTop: 4 }}>Walk-ins welcome</div>
        <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['Mon–Sat','8am–8pm'].map((t, i) => (
            <div key={i} style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 3, padding: '3px 7px', fontSize: 8 }}>{t}</div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[['Fade & Lineup','$80'],['Hot Towel Shave','$60'],['Wash & Style','$90'],["Kid's Cut",'$50']].map(([s, p]) => (
          <div key={s} style={{ background: '#1a1a1a', borderRadius: 4, padding: '5px 8px', display: 'flex', justifyContent: 'space-between', borderLeft: '2px solid #FFD700' }}>
            <span style={{ fontSize: 9 }}>{s}</span>
            <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 9 }}>TT{p}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{ margin: '0 14px', background: '#E61E2B', borderRadius: 6, padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 9, fontWeight: 700 }}>Next slot: Today 2:30pm</span>
      <div style={{ background: '#fff', color: '#E61E2B', borderRadius: 3, padding: '3px 10px', fontSize: 9, fontWeight: 800 }}>Book</div>
    </div>
  </div>
);

const P_electronics_tech = () => (
  <div style={{ fontFamily: 'system-ui', background: '#030712', height: '100%', overflow: 'hidden', fontSize: 11, color: '#fff' }}>
    <div style={{ background: '#0d1117', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #21262d' }}>
      <span style={{ fontWeight: 800, fontSize: 13, color: '#60a5fa' }}>TechHub TT</span>
      <div style={{ background: '#3b82f6', borderRadius: 4, padding: '3px 10px', fontSize: 9, fontWeight: 700 }}>All Products</div>
    </div>
    <div style={{ padding: '12px 14px', background: 'linear-gradient(160deg,#0d1b40,#030712)' }}>
      <div style={{ fontSize: 9, color: '#60a5fa', letterSpacing: 2, marginBottom: 4, fontWeight: 600 }}>NEW ARRIVALS</div>
      <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.15 }}>Latest Tech,<br />Trinidad Price.</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 5 }}>
        <div style={{ background: '#3b82f6', borderRadius: 4, padding: '4px 12px', fontSize: 9, fontWeight: 700 }}>Shop Deals</div>
        <div style={{ border: '1px solid #21262d', borderRadius: 4, padding: '4px 12px', fontSize: 9 }}>Compare</div>
      </div>
    </div>
    <div style={{ padding: '8px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
      {[['💻','MacBook M3','$8,999'],['📱','iPhone 16','$6,499'],['🎮','PS5','$4,999']].map(([e, n, p]) => (
        <div key={n} style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 6, padding: '7px 5px', textAlign: 'center' }}>
          <div style={{ fontSize: 16 }}>{e}</div>
          <div style={{ fontSize: 8, fontWeight: 700, marginTop: 3 }}>{n}</div>
          <div style={{ color: '#60a5fa', fontSize: 9, fontWeight: 800, marginTop: 2 }}>TT{p}</div>
          <div style={{ background: '#1d4ed8', borderRadius: 3, padding: '2px 4px', marginTop: 4, fontSize: 8 }}>Buy</div>
        </div>
      ))}
    </div>
  </div>
);

const P_pharmacy_health = () => (
  <div style={{ fontFamily: 'system-ui', background: '#f0fdf4', height: '100%', overflow: 'hidden', fontSize: 11 }}>
    <div style={{ background: '#166534', color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 800, fontSize: 12 }}>+ CarePlus Pharmacy</span>
      <div style={{ background: '#16a34a', borderRadius: 20, padding: '3px 10px', fontSize: 9, fontWeight: 700 }}>Order Online</div>
    </div>
    <div style={{ background: 'linear-gradient(135deg,#166534,#15803d)', color: '#fff', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.2 }}>Your Health,<br />Our Priority</div>
        <div style={{ opacity: 0.7, fontSize: 9, marginTop: 3 }}>Prescription · OTC · Wellness</div>
      </div>
      <div style={{ background: '#fff', color: '#166534', borderRadius: 20, padding: '5px 12px', fontSize: 9, fontWeight: 800 }}>Upload Rx</div>
    </div>
    <div style={{ padding: '8px 14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 7 }}>
        {[['💊','Meds'],['🩺','Consult'],['🧴','Skincare'],['🌿','Natural']].map(([e, l]) => (
          <div key={l} style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 6, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 13 }}>{e}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#166534', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      {[['Metformin 500mg','$45/mo'],['Vitamin D3 2000IU','$38']].map(([n, p]) => (
        <div key={n} style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 6, padding: '6px 10px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 700 }}>{n}</span>
          <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 9 }}>TT{p}</span>
        </div>
      ))}
    </div>
  </div>
);

const P_bakery_desserts = () => (
  <div style={{ fontFamily: 'system-ui', background: '#fff0f6', height: '100%', overflow: 'hidden', fontSize: 11 }}>
    <div style={{ background: 'linear-gradient(90deg,#be185d,#7c3aed)', color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 800, fontSize: 12 }}>Sweet Trini Bakes</span>
      <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 9 }}>Order Custom</div>
    </div>
    <div style={{ background: 'linear-gradient(160deg,#fdf2f8,#ede9fe)', padding: '14px', textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: '#831843', lineHeight: 1.2 }}>Baked with Love,<br />Made in Trinidad</div>
      <div style={{ opacity: 0.55, fontSize: 9, marginTop: 3 }}>Custom cakes · Pastries · Catering</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 5, justifyContent: 'center' }}>
        <div style={{ background: '#be185d', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 9, fontWeight: 800 }}>Order Now</div>
        <div style={{ border: '1px solid #be185d', color: '#be185d', borderRadius: 20, padding: '4px 12px', fontSize: 9 }}>Gallery</div>
      </div>
    </div>
    <div style={{ padding: '8px 14px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
      {[['🎂','Custom Cake','$380+','#fce7f3'],['🧁','Cupcakes','$8 ea','#ede9fe'],['🍩','Donuts','$6 ea','#fef3c7'],['🥐','Pastries','$12','#dcfce7']].map(([e, n, p, bg]) => (
        <div key={n} style={{ background: bg, borderRadius: 8, padding: '7px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: 16 }}>{e}</div>
          <div style={{ fontSize: 8, fontWeight: 700, marginTop: 2, color: '#1a1a1a' }}>{n}</div>
          <div style={{ fontSize: 8, color: '#be185d', fontWeight: 800, marginTop: 1 }}>TT{p}</div>
        </div>
      ))}
    </div>
  </div>
);

const P_auto_parts = () => (
  <div style={{ fontFamily: 'system-ui', background: '#0f0f0f', height: '100%', overflow: 'hidden', fontSize: 11, color: '#fff' }}>
    <div style={{ background: '#1a1a1a', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f97316' }}>
      <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>AUTO KING TT</span>
      <div style={{ background: '#f97316', borderRadius: 3, padding: '3px 10px', fontSize: 9, fontWeight: 700 }}>Find My Part</div>
    </div>
    <div style={{ background: 'linear-gradient(160deg,#1c0a00,#0f0f0f)', padding: '14px', display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#f97316', fontSize: 9, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>PARTS & ACCESSORIES</div>
        <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.1 }}>OEM & AFTERMARKET PARTS</div>
        <div style={{ marginTop: 8, background: '#f97316', display: 'inline-flex', borderRadius: 3, padding: '4px 12px', fontSize: 9, fontWeight: 800 }}>Search Parts</div>
      </div>
      <div style={{ fontSize: 36 }}>🚗</div>
    </div>
    <div style={{ padding: '8px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
      {[['🔧','Engine','$450+'],['🛞','Tyres','$299+'],['🔋','Battery','$380+'],['💡','Electrical','$120+'],['🪝','Body Parts','$200+'],['⚙️','Gearbox','$600+']].map(([e, n, p]) => (
        <div key={n} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 5, padding: '6px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: 13 }}>{e}</div>
          <div style={{ fontSize: 8, fontWeight: 700, marginTop: 2 }}>{n}</div>
          <div style={{ color: '#f97316', fontSize: 8, marginTop: 1 }}>{p}</div>
        </div>
      ))}
    </div>
  </div>
);

const P_hardware_home = () => (
  <div style={{ fontFamily: 'system-ui', background: '#fafaf9', height: '100%', overflow: 'hidden', fontSize: 11 }}>
    <div style={{ background: '#78350f', color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.5 }}>BUILD RIGHT HARDWARE</span>
      <div style={{ background: '#FFD700', color: '#78350f', borderRadius: 3, padding: '3px 10px', fontSize: 9, fontWeight: 800 }}>Get Quote</div>
    </div>
    <div style={{ background: 'linear-gradient(135deg,#92400e,#78350f)', color: '#fff', padding: '14px' }}>
      <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>Everything You Need<br />to Build & Fix</div>
      <div style={{ opacity: 0.7, fontSize: 9, marginTop: 3 }}>Tools · Lumber · Paint · Plumbing</div>
      <div style={{ marginTop: 8, background: '#FFD700', color: '#78350f', display: 'inline-flex', borderRadius: 3, padding: '4px 12px', fontSize: 9, fontWeight: 800 }}>Shop All</div>
    </div>
    <div style={{ padding: '8px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
      {[['🔨','Tools'],['🪚','Lumber'],['🪣','Paint'],['💡','Electrical'],['🚰','Plumbing'],['🏠','Roofing']].map(([e, n]) => (
        <div key={n} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '7px 4px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 14 }}>{e}</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#374151', marginTop: 3 }}>{n}</div>
        </div>
      ))}
    </div>
  </div>
);

const P_gym_fitness = () => (
  <div style={{ fontFamily: 'system-ui', background: '#000', height: '100%', overflow: 'hidden', fontSize: 11, color: '#fff' }}>
    <div style={{ background: '#111', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E61E2B' }}>
      <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: 1 }}>IRON TRINI GYM</span>
      <div style={{ background: '#E61E2B', borderRadius: 3, padding: '3px 10px', fontSize: 9, fontWeight: 700 }}>Join Now</div>
    </div>
    <div style={{ background: 'linear-gradient(160deg,#3b0000,#000)', padding: '16px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, lineHeight: 1, color: '#E61E2B', fontWeight: 900 }}>TRAIN HARD.</div>
        <div style={{ fontSize: 18, lineHeight: 1, fontWeight: 900 }}>STAY TRINI.</div>
        <div style={{ opacity: 0.45, fontSize: 9, marginTop: 4 }}>24/7 Access · 50+ Classes · Expert Coaches</div>
        <div style={{ marginTop: 8, background: '#E61E2B', display: 'inline-flex', borderRadius: 3, padding: '4px 14px', fontSize: 9, fontWeight: 800 }}>Start Free Trial</div>
      </div>
      <div style={{ fontSize: 32 }}>💪</div>
    </div>
    <div style={{ padding: '8px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
      {[['Basic','$299/mo','#1a1a1a','#666'],['Pro','$499/mo','#1a0000','#E61E2B'],['Elite','$799/mo','#1a1500','#FFD700']].map(([tier, price, bg, ac]) => (
        <div key={tier} style={{ background: bg, border: `1px solid ${ac}`, borderRadius: 6, padding: '8px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 1, fontWeight: 700 }}>{tier}</div>
          <div style={{ color: ac, fontSize: 9, fontWeight: 800, marginTop: 2 }}>TT{price}</div>
          <div style={{ background: ac, borderRadius: 3, padding: '2px', marginTop: 4, fontSize: 8, fontWeight: 700, color: ac === '#FFD700' ? '#000' : '#fff' }}>Select</div>
        </div>
      ))}
    </div>
  </div>
);

const P_jewelry_luxury = () => (
  <div style={{ fontFamily: 'Georgia, serif', background: '#080806', height: '100%', overflow: 'hidden', fontSize: 11, color: '#fff' }}>
    <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,215,0,0.2)' }}>
      <span style={{ fontStyle: 'italic', fontSize: 15, color: '#FFD700', letterSpacing: 1 }}>Aurum T&T</span>
      <div style={{ display: 'flex', gap: 10, opacity: 0.45, fontFamily: 'system-ui', fontSize: 9 }}>
        <span>Collections</span><span>Bespoke</span>
      </div>
    </div>
    <div style={{ textAlign: 'center', padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,215,0,0.1)' }}>
      <div style={{ color: '#FFD700', fontSize: 8, letterSpacing: 4, fontFamily: 'system-ui', fontWeight: 600, marginBottom: 6 }}>FINE JEWELLERY · PORT OF SPAIN</div>
      <div style={{ fontSize: 16, fontStyle: 'italic', lineHeight: 1.2 }}>Crafted for<br />the Caribbean Soul</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center' }}>
        <div style={{ border: '1px solid #FFD700', color: '#FFD700', padding: '4px 14px', borderRadius: 2, fontFamily: 'system-ui', fontSize: 9 }}>Browse</div>
        <div style={{ background: '#FFD700', color: '#080806', padding: '4px 14px', borderRadius: 2, fontFamily: 'system-ui', fontWeight: 700, fontSize: 9 }}>Book Consult</div>
      </div>
    </div>
    <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
      {[['💍','Rings','From $1,200'],['📿','Necklaces','From $800'],['⌚','Watches','From $2,500']].map(([e, n, p]) => (
        <div key={n} style={{ background: '#110f08', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 6, padding: '10px 5px', textAlign: 'center' }}>
          <div style={{ fontSize: 18 }}>{e}</div>
          <div style={{ fontSize: 9, fontStyle: 'italic', marginTop: 4 }}>{n}</div>
          <div style={{ color: '#FFD700', fontFamily: 'system-ui', fontSize: 8, marginTop: 2 }}>{p}</div>
        </div>
      ))}
    </div>
  </div>
);

const P_doubles_breakfast_pro = () => (
  <div style={{ fontFamily: 'system-ui', background: '#fffbeb', height: '100%', overflow: 'hidden', fontSize: 11 }}>
    <div style={{ background: '#d97706', color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 900, fontSize: 12 }}>Raj's Doubles</span>
      <div style={{ background: '#fff', color: '#d97706', borderRadius: 20, padding: '3px 10px', fontSize: 9, fontWeight: 800 }}>WhatsApp Order</div>
    </div>
    <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', padding: '14px', display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>Best Doubles in T&T</div>
        <div style={{ opacity: 0.85, fontSize: 9, marginTop: 3 }}>Open 5am–2pm daily · Cash & Linx</div>
        <div style={{ marginTop: 8, background: '#fff', display: 'inline-flex', color: '#d97706', borderRadius: 20, padding: '4px 12px', fontSize: 9, fontWeight: 800 }}>See Menu</div>
      </div>
      <div style={{ fontSize: 32 }}>🫓</div>
    </div>
    <div style={{ padding: '8px 14px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e', marginBottom: 6, letterSpacing: 1 }}>TODAY'S MENU</div>
      {[["Slight",'$7'],['Medium','$7'],['Extra Pepper','$7'],['With Cheese','$9'],['Pholorie (6pcs)','$15']].map(([n, p]) => (
        <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #fde68a', fontSize: 9 }}>
          <span style={{ color: '#78350f', fontWeight: 600 }}>{n}</span>
          <span style={{ color: '#d97706', fontWeight: 800 }}>TT{p}</span>
        </div>
      ))}
    </div>
  </div>
);

const P_multi_location_enterprise = () => (
  <div style={{ fontFamily: 'system-ui', background: '#f8fafc', height: '100%', overflow: 'hidden', fontSize: 11 }}>
    <div style={{ background: '#0f172a', color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 800, fontSize: 13 }}>Enterprise Suite</span>
      <div style={{ display: 'flex', gap: 5 }}>
        <div style={{ background: '#1e293b', borderRadius: 4, padding: '3px 8px', fontSize: 8, color: '#fff' }}>Analytics</div>
        <div style={{ background: '#3b82f6', borderRadius: 4, padding: '3px 8px', fontSize: 8, color: '#fff' }}>+ Location</div>
      </div>
    </div>
    <div style={{ padding: '8px 14px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
      {[['12','Locations','#dbeafe'],['$2.4M','Revenue','#dcfce7'],['98%','Satisfied','#fef9c3'],['4.8★','Rating','#fce7f3']].map(([v, l, bg]) => (
        <div key={l} style={{ background: bg, borderRadius: 6, padding: '7px 4px', textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 11, color: '#0f172a' }}>{v}</div>
          <div style={{ fontSize: 7, color: '#64748b', marginTop: 1 }}>{l}</div>
        </div>
      ))}
    </div>
    <div style={{ padding: '0 14px 8px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 6 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>LOCATIONS MAP</div>
        <div style={{ background: '#eff6ff', borderRadius: 6, height: 64, position: 'relative' }}>
          {[[25,40],[55,25],[75,50],[40,65],[60,70]].map(([x, y], i) => (
            <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 8, height: 8, background: '#E61E2B', borderRadius: '50%', border: '2px solid #fff', transform: 'translate(-50%,-50%)' }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {['Port of Spain','San Fernando','Chaguanas','Tobago'].map(loc => (
          <div key={loc} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 5, padding: '4px 7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: '#0f172a', fontWeight: 600 }}>{loc}</span>
            <div style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%' }} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Map of id → component
const PREVIEWS: Record<string, React.FC> = {
  basic_storefront:        P_basic_storefront,
  roti_shop_pro:           P_roti_shop_pro,
  doubles_breakfast_pro:   P_doubles_breakfast_pro,
  restaurant_premium:      P_restaurant_premium,
  clothing_store_pro:      P_clothing_store_pro,
  salon_barber_pro:        P_salon_barber_pro,
  electronics_tech:        P_electronics_tech,
  pharmacy_health:         P_pharmacy_health,
  bakery_desserts:         P_bakery_desserts,
  auto_parts:              P_auto_parts,
  hardware_home:           P_hardware_home,
  gym_fitness:             P_gym_fitness,
  jewelry_luxury:          P_jewelry_luxury,
  multi_location_enterprise: P_multi_location_enterprise,
};

// ─── Main Gallery ─────────────────────────────────────────────────────────────

interface TemplateGalleryProps {
  onSelectTemplate?: (template: StoreTemplate) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [preview, setPreview] = useState<StoreTemplate | null>(null);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'Food & Beverage', name: 'Food & Drinks' },
    { id: 'Retail', name: 'Retail' },
    { id: 'Services', name: 'Services' },
    { id: 'Automotive', name: 'Automotive' },
    { id: 'Enterprise', name: 'Enterprise' },
  ];

  const filtered = selectedCategory === 'all'
    ? TRINIDAD_TEMPLATES
    : TRINIDAD_TEMPLATES.filter(t => t.category === selectedCategory);

  const tierConfig: Record<string, { bg: string; color: string; label: string }> = {
    free:    { bg: '#e5e7eb', color: '#374151', label: 'FREE' },
    pro:     { bg: '#E61E2B', color: '#fff',    label: 'PRO' },
    premium: { bg: '#FFD700', color: '#000',    label: 'PREMIUM' },
  };

  const handleUse = (template: StoreTemplate) => {
    onSelectTemplate?.(template);
    navigate(`/create-store?template=${template.id}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: "'Inter', sans-serif", color: '#fff' }}>

      {/* Hero */}
      <div style={{ padding: '60px 24px 44px', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 0%,rgba(230,30,43,0.12) 0%,transparent 70%)' }}>
        <div style={{ fontSize: 10, letterSpacing: 6, color: '#E61E2B', fontWeight: 700, marginBottom: 14, textTransform: 'uppercase' }}>TriniBuild · Store Templates</div>
        <h1 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
          Pick your store.<br />
          <span style={{ color: '#E61E2B' }}>Launch in minutes.</span>
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.6 }}>
          {TRINIDAD_TEMPLATES.length} professionally designed templates built for Trinidad &amp; Tobago businesses.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                background: selectedCategory === cat.id ? '#E61E2B' : 'transparent',
                color: selectedCategory === cat.id ? '#fff' : '#6b7280',
                border: `1px solid ${selectedCategory === cat.id ? '#E61E2B' : '#2a2a2a'}`,
                borderRadius: 24, padding: '7px 20px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{cat.name}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '8px 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map((template, i) => {
            const Preview = PREVIEWS[template.id] || (() => (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', opacity: 0.3 }}>
                <Globe size={40} />
              </div>
            ));
            const tier = tierConfig[template.tier] || tierConfig.free;

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                style={{ background: '#111', borderRadius: 14, overflow: 'hidden', border: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column' }}
                whileHover={{ y: -5, boxShadow: '0 16px 48px rgba(230,30,43,0.15)', borderColor: '#E61E2B' } as any}
              >
                {/* Preview thumbnail — click to expand */}
                <div
                  onClick={() => setPreview(template)}
                  style={{ height: 210, overflow: 'hidden', position: 'relative', cursor: 'zoom-in', flexShrink: 0 }}
                >
                  {/* Scale down the full preview to fit the card */}
                  <div style={{ transform: 'scale(0.82)', transformOrigin: 'top left', width: '122%', height: '122%', pointerEvents: 'none' }}>
                    <div style={{ height: 256 }}>
                      <Preview />
                    </div>
                  </div>
                  {/* Tier badge */}
                  <div style={{ position: 'absolute', top: 10, left: 10, background: tier.bg, color: tier.color, borderRadius: 20, padding: '3px 10px', fontSize: 9, fontWeight: 900, letterSpacing: 0.5 }}>
                    {tier.label}
                  </div>
                  {/* Hover overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <div style={{ background: '#fff', color: '#000', borderRadius: 24, padding: '8px 20px', fontWeight: 700, fontSize: 12 }}>
                      Preview Full Size
                    </div>
                  </motion.div>
                </div>

                {/* Info */}
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{template.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{template.category}</div>
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: 11, lineHeight: 1.5, marginBottom: 12, flex: 1 }}>
                    {(template.description || '').slice(0, 85)}{(template.description || '').length > 85 ? '…' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                    {(template.features || []).slice(0, 3).map((f: string) => (
                      <div key={f} style={{ background: '#1a1a1a', color: '#9ca3af', borderRadius: 4, padding: '3px 8px', fontSize: 9 }}>{f}</div>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleUse(template)}
                    style={{
                      width: '100%', background: '#E61E2B', color: '#fff', border: 'none',
                      borderRadius: 10, padding: '11px 0', fontWeight: 800, fontSize: 13,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    Use This Template <ArrowRight size={14} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Full-size preview modal */}
      <AnimatePresence>
        {preview && (() => {
          const ModalPreview = PREVIEWS[preview.id] || (() => <div style={{ background: '#111', height: '100%' }} />);
          const tier = tierConfig[preview.tier] || tierConfig.free;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreview(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            >
              <motion.div
                initial={{ scale: 0.92, y: 32 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 32 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#111', borderRadius: 20, overflow: 'hidden', border: '1px solid #2a2a2a', width: '100%', maxWidth: 460, boxShadow: '0 40px 100px rgba(230,30,43,0.25)' }}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f1f1f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{preview.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{preview.category} · <span style={{ color: tier.bg === '#e5e7eb' ? '#9ca3af' : tier.bg }}>{tier.label}</span></div>
                  </div>
                  <button onClick={() => setPreview(null)} style={{ background: '#1a1a1a', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                    <X size={15} />
                  </button>
                </div>
                {/* Preview at full scale */}
                <div style={{ height: 340, overflow: 'hidden' }}>
                  <ModalPreview />
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', gap: 10 }}>
                  <button onClick={() => setPreview(null)} style={{ flex: 1, background: '#1a1a1a', color: '#9ca3af', border: '1px solid #2a2a2a', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { handleUse(preview); setPreview(null); }}
                    style={{ flex: 2, background: '#E61E2B', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    Use This Template <ArrowRight size={14} />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
