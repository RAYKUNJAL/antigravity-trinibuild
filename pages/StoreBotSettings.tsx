import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Save, ArrowLeft, MessageSquare, Sparkles, Lock, Brain, Check, Eye } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { authService, User } from '../services/authService';
import { subscriptionService } from '../services/subscriptionService';

export const StoreBotSettings: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [storeName, setStoreName] = useState<string>('');

    // Plan state
    const [planSlug, setPlanSlug] = useState<string>('free');
    const [botEnabled, setBotEnabled] = useState<boolean>(false);

    const [settings, setSettings] = useState({
        bot_name: 'TriniBuild Support Bot',
        bot_persona: 'support_bot',
        bot_system_prompt: ''
    });

    // Guided training fields
    const [field1, setField1] = useState(''); // What do you sell?
    const [field2, setField2] = useState(''); // Opening hours?
    const [field3, setField3] = useState(''); // How to order?
    const [field4, setField4] = useState(''); // What makes you special?
    const [field5, setField5] = useState(''); // Common questions?

    const [assembledPrompt, setAssembledPrompt] = useState<string>('');
    const [showPreview, setShowPreview] = useState<boolean>(false);

    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                await fetchStoreSettings(currentUser.id);
                await fetchUserPlan(currentUser.id);
            } else {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const fetchUserPlan = async (userId: string) => {
        try {
            const { plan } = await subscriptionService.getUserPlan(userId);
            if (plan) {
                setPlanSlug(plan.slug);
            }
        } catch (error) {
            console.error('Error fetching user plan:', error);
        }
    };

    const fetchStoreSettings = async (userId: string) => {
        try {
            const { data: store, error } = await supabase
                .from('stores')
                .select('id, name, bot_name, bot_persona, bot_system_prompt, bot_enabled')
                .eq('owner_id', userId)
                .single();

            if (error) throw error;

            if (store) {
                setStoreId(store.id);
                setStoreName(store.name || 'My Store');
                setBotEnabled(!!store.bot_enabled);
                setSettings({
                    bot_name: store.bot_name || 'TriniBuild Support Bot',
                    bot_persona: store.bot_persona || 'support_bot',
                    bot_system_prompt: store.bot_system_prompt || ''
                });

                // If there's an existing assembled prompt, show it in the preview
                if (store.bot_system_prompt) {
                    setAssembledPrompt(store.bot_system_prompt);
                    setShowPreview(true);
                }
            }
        } catch (error) {
            console.error('Error fetching store settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssemblePrompt = () => {
        const botName = settings.bot_name || 'Support Bot';
        const assembled = `You are ${botName}, a helpful assistant for ${storeName}.

ABOUT THIS BUSINESS:
${field1 ? 'Products/Services: ' + field1 : ''}
${field2 ? 'Hours: ' + field2 : ''}
${field3 ? 'How to order: ' + field3 : ''}
${field4 ? 'What makes us special: ' + field4 : ''}
${field5 ? 'Common questions: ' + field5 : ''}

Always be friendly, speak with a Caribbean warmth, and help customers find what they need. If you don't know the answer, invite them to WhatsApp or call.`;

        setAssembledPrompt(assembled);
        setShowPreview(true);
    };

    const handleSaveAssembled = async () => {
        if (!storeId) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('stores')
                .update({
                    bot_name: settings.bot_name,
                    bot_persona: settings.bot_persona,
                    bot_system_prompt: assembledPrompt
                })
                .eq('id', storeId);

            if (error) throw error;

            setSettings(prev => ({ ...prev, bot_system_prompt: assembledPrompt }));
            alert('Bot training saved successfully! ✨');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleBot = async (enabled: boolean) => {
        if (!storeId) return;
        try {
            const { error } = await supabase
                .from('stores')
                .update({ bot_enabled: enabled })
                .eq('id', storeId);

            if (error) throw error;
            setBotEnabled(enabled);
        } catch (error) {
            console.error('Error toggling bot:', error);
            alert('Failed to update bot status');
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!storeId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold mb-4">No Store Found</h2>
                <p className="text-gray-600 mb-6">You need to create a store before you can configure a bot.</p>
                <button
                    onClick={() => navigate('/create-store')}
                    className="bg-trini-red text-white px-6 py-2 rounded-full"
                >
                    Create Store
                </button>
            </div>
        );
    }

    const isFreePlan = planSlug === 'free';

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-trini-red mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
            </button>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-trini-black to-gray-800 p-8 text-white">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <Bot className="h-8 w-8 text-trini-teal" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">AI Bot Configuration</h1>
                            <p className="text-gray-300">Customize your store's AI assistant</p>
                        </div>
                    </div>
                </div>

                {/* SECTION 4 — PLAN GATE */}
                {isFreePlan && (
                    <div className="m-6 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                            <Lock className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Pro Feature Locked</h2>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            The AI Chatbot is a Pro feature. Upgrade to Pro for TT$300/mo to enable your storefront bot.
                        </p>
                        <button
                            onClick={() => navigate('/pricing')}
                            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors shadow-lg"
                        >
                            Upgrade to Pro →
                        </button>
                    </div>
                )}

                {/* Wrapper for sections 1-3 with optional lock overlay */}
                <div className={`relative ${isFreePlan ? 'pointer-events-none' : ''}`}>
                    {isFreePlan && (
                        <div className="absolute inset-0 z-10 bg-gray-100/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                            <div className="text-center">
                                <Lock className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">Unlock with Pro</p>
                            </div>
                        </div>
                    )}

                    <div className="p-8 space-y-8">
                        {/* SECTION 1 — Bot Identity */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                                <MessageSquare className="h-5 w-5 text-trini-red" />
                                Bot Identity
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bot Name</label>
                                    <input
                                        type="text"
                                        value={settings.bot_name}
                                        onChange={(e) => setSettings({ ...settings, bot_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red/20 focus:border-trini-red outline-none transition-all"
                                        placeholder="e.g. Rasta Pasta Bot"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Persona Type</label>
                                    <select
                                        value={settings.bot_persona}
                                        onChange={(e) => setSettings({ ...settings, bot_persona: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red/20 focus:border-trini-red outline-none transition-all"
                                    >
                                        <option value="support_bot">Support Assistant (Standard)</option>
                                        <option value="sales_agent">Sales Agent (Persuasive)</option>
                                        <option value="custom">Custom Persona</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 2 — GUIDED TRAINING */}
                        <section className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                                    <Brain className="h-5 w-5 text-purple-600" />
                                    🧠 Train Your Bot
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Answer these questions and we'll build your bot's knowledge automatically.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">What do you sell?</label>
                                    <textarea
                                        value={field1}
                                        onChange={(e) => setField1(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red/20 focus:border-trini-red outline-none transition-all"
                                        placeholder="e.g. Handmade Caribbean dresses, sizes XS-XXL, starting at TT$250"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">What are your opening hours?</label>
                                    <textarea
                                        value={field2}
                                        onChange={(e) => setField2(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red/20 focus:border-trini-red outline-none transition-all"
                                        placeholder="e.g. Mon-Fri 9am-6pm, Sat 10am-4pm, closed Sundays"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">How do customers order from you?</label>
                                    <textarea
                                        value={field3}
                                        onChange={(e) => setField3(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red/20 focus:border-trini-red outline-none transition-all"
                                        placeholder="e.g. Add to cart on this site, or WhatsApp us at 868-XXX-XXXX"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">What makes your business special?</label>
                                    <textarea
                                        value={field4}
                                        onChange={(e) => setField4(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red/20 focus:border-trini-red outline-none transition-all"
                                        placeholder="e.g. All items are handmade locally, we offer COD in Trinidad"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">What are your most common customer questions?</label>
                                    <textarea
                                        value={field5}
                                        onChange={(e) => setField5(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red/20 focus:border-trini-red outline-none transition-all"
                                        placeholder="e.g. Do you deliver? How long does it take? Can I get a custom order?"
                                    />
                                </div>
                            </div>

                            {/* Assemble Prompt Button */}
                            <button
                                onClick={handleAssemblePrompt}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
                            >
                                <Sparkles className="h-5 w-5" />
                                ✨ Build My Bot from These Answers
                            </button>

                            {/* Preview Box */}
                            {showPreview && assembledPrompt && (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Eye className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-semibold text-gray-700">Preview — Your Bot's System Prompt</span>
                                        </div>
                                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">{assembledPrompt}</pre>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveAssembled}
                                            disabled={saving}
                                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-all shadow-lg disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <>Saving...</>
                                            ) : (
                                                <>
                                                    <Check className="h-5 w-5" />
                                                    Looks good, save it
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* SECTION 3 — ENABLE BOT */}
                        <section className="space-y-4 pt-6 border-t border-gray-100">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                                <Bot className="h-5 w-5 text-trini-teal" />
                                Enable Bot
                            </h2>

                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div>
                                    <p className="font-medium text-gray-800">Show chatbot on my storefront</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Status: <span className={`font-semibold ${botEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                                            {botEnabled ? '✅ Bot is LIVE on your storefront' : '⚫ Bot is currently OFF'}
                                        </span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggleBot(!botEnabled)}
                                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${botEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${botEnabled ? 'translate-x-9' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </section>

                        {/* Save Button (for identity changes) */}
                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={async () => {
                                    if (!storeId) return;
                                    setSaving(true);
                                    try {
                                        const { error } = await supabase
                                            .from('stores')
                                            .update({
                                                bot_name: settings.bot_name,
                                                bot_persona: settings.bot_persona,
                                            })
                                            .eq('id', storeId);
                                        if (error) throw error;
                                        alert('Bot identity saved!');
                                    } catch (error) {
                                        console.error('Error saving settings:', error);
                                        alert('Failed to save settings');
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                disabled={saving}
                                className="bg-trini-red text-white px-8 py-3 rounded-full font-semibold hover:bg-red-700 transform hover:scale-105 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:scale-100"
                            >
                                {saving ? 'Saving...' : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        Save Identity
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
