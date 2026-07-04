// =============================================================
// AI Website Builder — Wix-style, AI-first. Wizard → AI generates
// full site → section editor with live preview → publish.
// =============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Smartphone, Monitor, ChevronUp, ChevronDown, Trash2,
    Globe, Save, Wand2, ArrowRight, ArrowLeft, Loader2,
} from 'lucide-react';
import {
    BuilderSite, BusinessBrief, SiteSection, THEME_PRESETS, CATEGORIES, ISLANDS,
    generateSiteAI, regenerateSectionCopy, saveSite, publishSite, listMySites, getMyStores,
} from '../services/siteBuilderService';
import SiteSectionRenderer from '../components/SiteSectionRenderer';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

const SECTION_LABELS: Record<string, string> = {
    hero: 'Hero Banner', about: 'About', features: 'Why Choose Us', products: 'Products',
    gallery: 'Gallery', testimonials: 'Reviews', hours: 'Opening Hours', faq: 'FAQ', contact: 'Contact', cta: 'Call to Action',
};

const GEN_MESSAGES = ['Reading your business info…', 'Writing your copy…', 'Choosing your colours…', 'Building your sections…', 'Almost done…'];

export default function AISiteBuilder() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'wizard' | 'generating' | 'editor'>('wizard');
    const [wizardPage, setWizardPage] = useState(0);
    const [genMsg, setGenMsg] = useState(0);
    const [brief, setBrief] = useState<BusinessBrief>({
        businessName: '', category: CATEGORIES[0], island: ISLANDS[0],
        description: '', vibe: 'vibrant', whatsapp: '', phone: '', address: '', email: '', instagram: '',
    });
    const [site, setSite] = useState<BuilderSite | null>(null);
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [regenId, setRegenId] = useState<string | null>(null);
    const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
    const [mySites, setMySites] = useState<BuilderSite[]>([]);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        listMySites().then(setMySites).catch(() => { });
        getMyStores().then((s) => setStores(s as any)).catch(() => { });
    }, []);

    useEffect(() => {
        if (step !== 'generating') return;
        const t = setInterval(() => setGenMsg((m) => (m + 1) % GEN_MESSAGES.length), 900);
        return () => clearInterval(t);
    }, [step]);

    const generate = async () => {
        setStep('generating'); setError('');
        try {
            const generated = await generateSiteAI(brief);
            if (stores.length === 1) generated.store_id = stores[0].id;
            setSite(generated);
            setTimeout(() => setStep('editor'), 1400);
        } catch (e: any) {
            setError(e?.message || 'Generation failed. Please try again.');
            setStep('wizard');
        }
    };

    const updateSection = (id: string, patch: Partial<SiteSection>) =>
        setSite((s) => s ? { ...s, sections: s.sections.map((sec) => (sec.id === id ? { ...sec, ...patch } : sec)) } : s);

    const updateSectionData = (id: string, key: string, value: any) =>
        setSite((s) => s ? { ...s, sections: s.sections.map((sec) => (sec.id === id ? { ...sec, data: { ...sec.data, [key]: value } } : sec)) } : s);

    const moveSection = (idx: number, dir: -1 | 1) => setSite((s) => {
        if (!s) return s;
        const arr = [...s.sections]; const j = idx + dir;
        if (j < 0 || j >= arr.length) return s;
        [arr[idx], arr[j]] = [arr[j], arr[idx]];
        return { ...s, sections: arr };
    });

    const removeSection = (id: string) =>
        setSite((s) => s ? { ...s, sections: s.sections.filter((sec) => sec.id !== id) } : s);

    const regenerate = async (section: SiteSection) => {
        if (!site) return;
        setRegenId(section.id);
        try {
            const fresh = await regenerateSectionCopy(site, section, brief);
            updateSection(section.id, { data: fresh.data });
        } finally { setRegenId(null); }
    };

    const doSave = async () => {
        if (!site) return;
        setSaving(true); setError('');
        try {
            const saved = await saveSite(site);
            setSite(saved);
            setSavedMsg('Saved ✓'); setTimeout(() => setSavedMsg(''), 2500);
        } catch (e: any) { setError(e.message); }
        setSaving(false);
    };

    const doPublish = async () => {
        if (!site) return;
        setPublishing(true); setError('');
        try {
            const pub = await publishSite(site);
            setSite(pub);
            setSavedMsg(`🎉 Live at ${window.location.origin}/site/${pub.slug}`);
        } catch (e: any) { setError(e.message); }
        setPublishing(false);
    };

    // ============================ GENERATING ============================
    if (step === 'generating') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E61E2B] to-[#FFD700] flex items-center justify-center mb-8">
                    <Sparkles size={28} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-black mb-2">Building {brief.businessName}…</h2>
                <AnimatePresence mode="wait">
                    <motion.p key={genMsg} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-gray-400">
                        {GEN_MESSAGES[genMsg]}
                    </motion.p>
                </AnimatePresence>
            </div>
        );
    }

    // ============================ WIZARD ============================
    if (step === 'wizard') {
        const inputCls = 'w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:border-[#E61E2B] focus:outline-none';
        const pages = [
            <motion.div key="p0" {...fadeUp} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">What's your business called?</label>
                    <input value={brief.businessName} onChange={(e) => setBrief({ ...brief, businessName: e.target.value })}
                        placeholder="e.g. Island Vibes Kitchen" className={`${inputCls} text-lg`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">What do you do?</label>
                        <select value={brief.category} onChange={(e) => setBrief({ ...brief, category: e.target.value })} className={inputCls}>
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Which island?</label>
                        <select value={brief.island} onChange={(e) => setBrief({ ...brief, island: e.target.value })} className={inputCls}>
                            {ISLANDS.map((i) => <option key={i}>{i}</option>)}
                        </select>
                    </div>
                </div>
            </motion.div>,
            <motion.div key="p1" {...fadeUp} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Tell the AI about your business <span className="text-gray-500">(optional)</span></label>
                    <textarea value={brief.description} onChange={(e) => setBrief({ ...brief, description: e.target.value })} rows={4}
                        placeholder="e.g. We make homestyle roti and doubles fresh every morning, delivering across Chaguanas." className={inputCls} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Pick your vibe</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {([['vibrant', '🎉 Vibrant'], ['premium', '👑 Premium'], ['beachy', '🌊 Beachy'], ['minimal', '🥥 Minimal'], ['classic', '🌅 Classic']] as const).map(([v, label]) => (
                            <button key={v} onClick={() => setBrief({ ...brief, vibe: v })}
                                className={`rounded-xl px-3 py-4 text-sm font-semibold border transition-all ${brief.vibe === v ? 'border-[#E61E2B] bg-[#E61E2B]/15 text-white scale-105' : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>,
            <motion.div key="p2" {...fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([['whatsapp', 'WhatsApp number', '868 555 1234'], ['phone', 'Phone', '868 555 1234'], ['email', 'Email', 'hello@yourbiz.com'], ['instagram', 'Instagram', '@yourbiz'], ['address', 'Address', 'Port of Spain']] as const).map(([k, label, ph]) => (
                    <div key={k} className={k === 'address' ? 'sm:col-span-2' : ''}>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">{label} <span className="text-gray-500">(optional)</span></label>
                        <input value={(brief as any)[k] || ''} onChange={(e) => setBrief({ ...brief, [k]: e.target.value })} placeholder={ph} className={inputCls} />
                    </div>
                ))}
            </motion.div>,
        ];

        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-2xl">
                    <motion.div {...fadeUp} className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 bg-[#E61E2B]/15 border border-[#E61E2B]/40 rounded-full px-4 py-1.5 text-sm font-semibold text-[#FF5A66] mb-5">
                            <Sparkles size={15} /> AI Website Builder
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black leading-tight">Your whole website.<br /><span className="text-[#E61E2B]">Built by AI in seconds.</span></h1>
                        <p className="text-gray-400 mt-4">Answer a few quick questions — the AI writes your copy, picks your look, and builds every section. You tweak and publish.</p>
                    </motion.div>

                    {mySites.length > 0 && wizardPage === 0 && (
                        <div className="mb-8 bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
                            <p className="text-sm text-gray-400 mb-3">Continue an existing site:</p>
                            <div className="flex flex-wrap gap-2">
                                {mySites.slice(0, 4).map((s) => (
                                    <button key={s.id} onClick={() => { setSite(s); setBrief((b) => ({ ...b, businessName: s.business_name, category: s.business_category || CATEGORIES[0], island: s.island })); setStep('editor'); }}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                                        {s.business_name} {s.status === 'published' && <span className="text-green-400 ml-1">●</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6 sm:p-8">
                        <div className="flex gap-2 mb-7">
                            {[0, 1, 2].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= wizardPage ? 'bg-[#E61E2B]' : 'bg-gray-800'}`} />)}
                        </div>
                        <AnimatePresence mode="wait">{pages[wizardPage]}</AnimatePresence>
                        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                        <div className="flex justify-between mt-8">
                            <button onClick={() => (wizardPage > 0 ? setWizardPage(wizardPage - 1) : navigate(-1))}
                                className="flex items-center gap-2 px-5 py-3 text-gray-400 hover:text-white transition-colors font-medium">
                                <ArrowLeft size={17} /> Back
                            </button>
                            {wizardPage < 2 ? (
                                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                    disabled={wizardPage === 0 && !brief.businessName.trim()}
                                    onClick={() => setWizardPage(wizardPage + 1)}
                                    className="flex items-center gap-2 bg-[#E61E2B] disabled:opacity-40 hover:bg-[#c4172f] px-7 py-3 rounded-xl font-bold transition-colors">
                                    Next <ArrowRight size={17} />
                                </motion.button>
                            ) : (
                                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={generate}
                                    className="flex items-center gap-2 bg-gradient-to-r from-[#E61E2B] to-[#FF5A00] px-7 py-3 rounded-xl font-bold">
                                    <Wand2 size={17} /> Build My Website
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================ EDITOR ============================
    if (!site) return null;
    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* Top bar */}
            <div className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => setStep('wizard')} className="text-gray-400 hover:text-white"><ArrowLeft size={19} /></button>
                    <div className="min-w-0">
                        <p className="font-bold truncate">{site.business_name}</p>
                        <p className="text-xs text-gray-500">{site.status === 'published' ? `Live · /site/${site.slug}` : 'Draft'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex bg-gray-900 rounded-lg p-1 mr-1">
                        <button onClick={() => setDevice('desktop')} className={`p-2 rounded-md ${device === 'desktop' ? 'bg-gray-700' : 'text-gray-500'}`}><Monitor size={16} /></button>
                        <button onClick={() => setDevice('mobile')} className={`p-2 rounded-md ${device === 'mobile' ? 'bg-gray-700' : 'text-gray-500'}`}><Smartphone size={16} /></button>
                    </div>
                    {savedMsg && <span className="text-green-400 text-sm font-medium hidden md:block">{savedMsg}</span>}
                    <button onClick={doSave} disabled={saving}
                        className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
                    </button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={doPublish} disabled={publishing}
                        className="flex items-center gap-1.5 bg-[#E61E2B] hover:bg-[#c4172f] px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        {publishing ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />} Publish
                    </motion.button>
                </div>
            </div>

            {error && <div className="bg-red-950 border-b border-red-800 text-red-300 text-sm px-4 py-2">{error}</div>}
            {savedMsg && savedMsg.startsWith('🎉') && (
                <div className="bg-green-950 border-b border-green-800 text-green-300 text-sm px-4 py-2 flex items-center justify-between">
                    <span>{savedMsg}</span>
                    <a href={`/site/${site.slug}`} target="_blank" rel="noreferrer" className="underline font-semibold">Open site →</a>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Left panel */}
                <div className="w-full max-w-xs border-r border-gray-800 bg-black overflow-y-auto p-4 hidden lg:block">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Theme</p>
                    <div className="grid grid-cols-5 gap-2 mb-6">
                        {Object.values(THEME_PRESETS).map((t) => (
                            <button key={t.preset} title={t.preset} onClick={() => setSite({ ...site, theme: { ...t } })}
                                className={`h-10 rounded-lg border-2 transition-transform hover:scale-110 ${site.theme.preset === t.preset ? 'border-white' : 'border-transparent'}`}
                                style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }} />
                        ))}
                    </div>

                    {stores.length > 0 && (
                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Connect Store Products</p>
                            <select value={site.store_id || ''} onChange={(e) => setSite({ ...site, store_id: e.target.value || null })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm">
                                <option value="">No store connected</option>
                                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}

                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sections</p>
                    <div className="space-y-2">
                        {site.sections.map((sec, idx) => (
                            <div key={sec.id} className={`rounded-xl border p-3 ${sec.enabled ? 'border-gray-700 bg-gray-900' : 'border-gray-800 bg-gray-950 opacity-60'}`}>
                                <div className="flex items-center justify-between">
                                    <button onClick={() => setEditingId(editingId === sec.id ? null : sec.id)} className="text-sm font-semibold text-left flex-1">
                                        {SECTION_LABELS[sec.type] || sec.type}
                                    </button>
                                    <div className="flex items-center gap-1 text-gray-500">
                                        <button onClick={() => regenerate(sec)} title="Regenerate with AI" className="hover:text-[#FFD700] p-1">
                                            {regenId === sec.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                        </button>
                                        <button onClick={() => moveSection(idx, -1)} className="hover:text-white p-1"><ChevronUp size={14} /></button>
                                        <button onClick={() => moveSection(idx, 1)} className="hover:text-white p-1"><ChevronDown size={14} /></button>
                                        <button onClick={() => updateSection(sec.id, { enabled: !sec.enabled })} className="hover:text-white p-1 text-xs font-bold">
                                            {sec.enabled ? 'ON' : 'OFF'}
                                        </button>
                                        <button onClick={() => removeSection(sec.id)} className="hover:text-red-400 p-1"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                {editingId === sec.id && (
                                    <div className="mt-3 space-y-2 border-t border-gray-800 pt-3">
                                        {Object.entries(sec.data).filter(([, v]) => typeof v === 'string').map(([k, v]) => (
                                            <div key={k}>
                                                <label className="text-[10px] uppercase tracking-wide text-gray-500">{k}</label>
                                                {(v as string).length > 60
                                                    ? <textarea value={v as string} rows={3} onChange={(e) => updateSectionData(sec.id, k, e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg px-2.5 py-2 text-sm mt-0.5" />
                                                    : <input value={v as string} onChange={(e) => updateSectionData(sec.id, k, e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg px-2.5 py-2 text-sm mt-0.5" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live preview */}
                <div className="flex-1 overflow-y-auto bg-gray-900 p-3 sm:p-6 flex justify-center">
                    <div className={`transition-all duration-300 w-full ${device === 'mobile' ? 'max-w-[390px]' : 'max-w-5xl'}`}>
                        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-700" style={{ background: site.theme.background }}>
                            {site.sections.filter((s) => s.enabled).map((sec) => (
                                <SiteSectionRenderer key={sec.id} section={sec} theme={site.theme} storeId={site.store_id || undefined} preview />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
