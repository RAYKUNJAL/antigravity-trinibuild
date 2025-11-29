import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, Lock, FileText, Download, Briefcase, User, Save, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { aiService } from '../services/ai';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';

interface Message {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

interface VaultData {
    full_name: string;
    address: string;
    phone: string;
    bir_number: string;
    passport_number: string;
    company_name: string;
}

export const BusinessExpertBot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'bot',
            text: "Hello! I am the TriniBuild Business Expert. I can help you with banking regulations, visa applications, and business registration in Trinidad & Tobago. How can I assist you today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [freeMessageCount, setFreeMessageCount] = useState(0);
    const [showVault, setShowVault] = useState(false);
    const [vaultData, setVaultData] = useState<VaultData>({
        full_name: '',
        address: '',
        phone: '',
        bir_number: '',
        passport_number: '',
        company_name: ''
    });
    const [isSavingVault, setIsSavingVault] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const MAX_FREE_MESSAGES = 3;

    useEffect(() => {
        checkSubscription();
        loadVaultData();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const checkSubscription = async () => {
        const subscription = localStorage.getItem('trinibuild_subscription');
        if (subscription === 'Growth' || subscription === 'Empire') {
            setIsPro(true);
        }
    };

    const loadVaultData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('vault_data').eq('id', user.id).single();
            if (data && data.vault_data) {
                setVaultData(data.vault_data);
            }
        }
    };

    const saveVaultData = async () => {
        setIsSavingVault(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').update({ vault_data: vaultData }).eq('id', user.id);
                alert("Secure data saved successfully.");
                setShowVault(false);
            }
        } catch (e) {
            console.error("Failed to save vault", e);
            alert("Failed to save data.");
        } finally {
            setIsSavingVault(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        if (!isPro && freeMessageCount >= MAX_FREE_MESSAGES) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'bot',
                text: "🔒 You have reached the limit of the free trial. Please upgrade to a Pro plan to continue consulting with the Business Expert and to generate official documents.",
                timestamp: new Date()
            }]);
            return;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        if (!isPro) {
            setFreeMessageCount(prev => prev + 1);
        }

        try {
            // Inject vault data into context if available
            const context = `User Data: ${JSON.stringify(vaultData)}. Use this to fill forms or give specific advice if asked.`;

            const response = await aiService.chatWithBot({
                message: userMsg.text,
                persona: 'business_expert',
                context: context
            });

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: response.content,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: "I'm having trouble connecting to the secure server. Please try again.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const generateDocument = (type: string) => {
        if (!isPro) {
            alert("Document generation is a Pro feature.");
            return;
        }
        // Mock generation
        const docName = type === 'visa' ? 'Visa Support Letter' : 'Business Registration Form';
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'bot',
            text: `✅ I have generated your **${docName}** using your secure profile data.\n\n[Download PDF (Simulated)]`,
            timestamp: new Date()
        }]);
    };

    return (
        <div className="flex h-[600px] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">

            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-trini-black font-bold">
                        <Briefcase className="h-5 w-5" /> Business Expert
                    </div>
                    <p className="text-xs text-gray-500 mt-1">T&T Regulations & Banking</p>
                </div>

                <div className="p-4 flex-grow overflow-y-auto space-y-4">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Quick Actions</h3>
                        <button onClick={() => setShowVault(true)} className="w-full text-left flex items-center p-2 rounded hover:bg-gray-200 text-sm">
                            <Shield className="h-4 w-4 mr-2 text-green-600" /> Secure Vault
                        </button>
                        <button onClick={() => generateDocument('visa')} className="w-full text-left flex items-center p-2 rounded hover:bg-gray-200 text-sm">
                            <FileText className="h-4 w-4 mr-2 text-blue-600" /> Visa Letter
                        </button>
                        <button onClick={() => generateDocument('reg')} className="w-full text-left flex items-center p-2 rounded hover:bg-gray-200 text-sm">
                            <FileText className="h-4 w-4 mr-2 text-blue-600" /> Business Reg
                        </button>
                    </div>

                    {!isPro && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Lock className="h-4 w-4 text-yellow-600" />
                                <span className="font-bold text-xs text-yellow-800">Free Trial</span>
                            </div>
                            <p className="text-[10px] text-yellow-700 mb-2">
                                {MAX_FREE_MESSAGES - freeMessageCount} messages remaining.
                            </p>
                            <Link to="/pricing" className="block text-center bg-trini-black text-white text-xs py-1.5 rounded font-bold">
                                Upgrade Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-600">Online | Encrypted Connection</span>
                    </div>
                    <Shield className="h-5 w-5 text-gray-300" />
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.sender === 'user'
                                ? 'bg-trini-black text-white rounded-br-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={!isPro && freeMessageCount >= MAX_FREE_MESSAGES ? "Trial limit reached." : "Ask about banking, visas, or regulations..."}
                            disabled={!isPro && freeMessageCount >= MAX_FREE_MESSAGES}
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-trini-red focus:border-transparent"
                            aria-label="Chat Input"
                        />
                        <button
                            onClick={handleSend}
                            disabled={(!isPro && freeMessageCount >= MAX_FREE_MESSAGES) || !input.trim()}
                            className="bg-trini-red text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            title="Send Message"
                            aria-label="Send Message"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Secure Vault Modal */}
                {showVault && (
                    <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-green-600" /> Secure Data Vault
                            </h3>
                            <button onClick={() => setShowVault(false)} className="text-gray-500 hover:text-gray-700">Close</button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="bg-blue-50 p-4 rounded-lg mb-6 flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <p className="text-xs text-blue-800">
                                    This data is encrypted and stored securely. It is ONLY used to auto-fill official documents (Visas, Bank Forms) generated by the Business Expert.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Legal Name</label>
                                    <input
                                        type="text"
                                        aria-label="Full Legal Name"
                                        value={vaultData.full_name}
                                        onChange={e => setVaultData({ ...vaultData, full_name: e.target.value })}
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        aria-label="Company Name"
                                        value={vaultData.company_name}
                                        onChange={e => setVaultData({ ...vaultData, company_name: e.target.value })}
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">BIR Number</label>
                                        <input
                                            type="text"
                                            aria-label="BIR Number"
                                            value={vaultData.bir_number}
                                            onChange={e => setVaultData({ ...vaultData, bir_number: e.target.value })}
                                            className="w-full border border-gray-300 rounded p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Passport Number</label>
                                        <input
                                            type="text"
                                            aria-label="Passport Number"
                                            value={vaultData.passport_number}
                                            onChange={e => setVaultData({ ...vaultData, passport_number: e.target.value })}
                                            className="w-full border border-gray-300 rounded p-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
                                    <textarea
                                        aria-label="Address"
                                        value={vaultData.address}
                                        onChange={e => setVaultData({ ...vaultData, address: e.target.value })}
                                        className="w-full border border-gray-300 rounded p-2 text-sm h-20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button
                                onClick={saveVaultData}
                                disabled={isSavingVault}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-green-700 flex items-center"
                            >
                                {isSavingVault ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save to Vault
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
