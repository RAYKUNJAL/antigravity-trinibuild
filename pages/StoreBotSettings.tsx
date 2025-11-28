import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Save, ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { authService, User } from '../services/authService';

export const StoreBotSettings: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);

    const [settings, setSettings] = useState({
        bot_name: 'TriniBuild Support Bot',
        bot_persona: 'support_bot',
        bot_system_prompt: ''
    });

    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                fetchStoreSettings(currentUser.id);
            } else {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const fetchStoreSettings = async (userId: string) => {
        try {
            const { data: store, error } = await supabase
                .from('stores')
                .select('id, bot_name, bot_persona, bot_system_prompt')
                .eq('owner_id', userId)
                .single();

            if (error) throw error;

            if (store) {
                setStoreId(store.id);
                setSettings({
                    bot_name: store.bot_name || 'TriniBuild Support Bot',
                    bot_persona: store.bot_persona || 'support_bot',
                    bot_system_prompt: store.bot_system_prompt || ''
                });
            }
        } catch (error) {
            console.error('Error fetching store settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!storeId) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('stores')
                .update({
                    bot_name: settings.bot_name,
                    bot_persona: settings.bot_persona,
                    bot_system_prompt: settings.bot_system_prompt
                })
                .eq('id', storeId);

            if (error) throw error;
            alert('Bot settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
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

                <div className="p-8 space-y-8">
                    {/* Bot Identity */}
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

                    {/* Custom Instructions */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                                System Instructions
                            </h2>
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200">
                                Advanced
                            </span>
                        </div>

                        <p className="text-sm text-gray-500">
                            Define exactly how your bot should behave. This overrides the default persona instructions.
                        </p>

                        <textarea
                            value={settings.bot_system_prompt}
                            onChange={(e) => setSettings({ ...settings, bot_system_prompt: e.target.value })}
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red/20 focus:border-trini-red outline-none transition-all font-mono text-sm"
                            placeholder="You are a helpful assistant for [Store Name]. You speak with a heavy Trinidadian accent and use local slang. You should focus on selling [Product Category]..."
                        />
                    </section>

                    {/* Save Button */}
                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-trini-red text-white px-8 py-3 rounded-full font-semibold hover:bg-red-700 transform hover:scale-105 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:scale-100"
                        >
                            {saving ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    Save Configuration
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
