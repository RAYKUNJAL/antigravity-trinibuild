// Juvay Assistant — chat drawer inside the builder. Groq-powered with
// guaranteed offline fallback. Helps owners write copy, pick templates,
// and answer "how do I…" questions about selling in the Caribbean.
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { askAssistant, aiAvailable } from '../services/groqAgent';

interface Msg { role: 'user' | 'ai'; text: string }

export default function BuilderAIAssistant({ siteContext }: { siteContext?: { name: string; category: string; island: string } }) {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([{
        role: 'ai',
        text: `I'm your Juvay Assistant 🏝️ Ask me anything — "write a better headline", "how do I get my first sale", "what should I charge for delivery" — and I'll help you build a store that sells.`,
    }]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);

    const send = async () => {
        const q = input.trim();
        if (!q || busy) return;
        setInput('');
        setMsgs((m) => [...m, { role: 'user', text: q }]);
        setBusy(true);
        const a = await askAssistant(q, siteContext);
        setMsgs((m) => [...m, { role: 'ai', text: a }]);
        setBusy(false);
        setTimeout(() => bodyRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 60);
    };

    return (
        <>
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setOpen(!open)}
                className="fixed bottom-5 right-5 z-50 bg-gradient-to-br from-[#E61E2B] to-[#FF7A00] rounded-full p-4 shadow-2xl">
                <Sparkles size={22} className="text-white" />
            </motion.button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
                        className="fixed bottom-24 right-5 z-50 w-[min(380px,92vw)] bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: 460 }}>
                        <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-[#FFD700]" />
                                <span className="font-extrabold text-sm text-white">Juvay Assistant</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${aiAvailable() ? 'bg-emerald-950 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                                    {aiAvailable() ? 'AI LIVE' : 'OFFLINE MODE'}
                                </span>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                        </div>
                        <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
                            {msgs.map((m, i) => (
                                <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto bg-[#E61E2B] text-white' : 'bg-gray-900 text-gray-200'}`}>
                                    {m.text}
                                </div>
                            ))}
                            {busy && <div className="bg-gray-900 rounded-2xl px-3.5 py-2.5 w-16"><Loader2 size={15} className="animate-spin text-gray-500" /></div>}
                        </div>
                        <div className="p-3 border-t border-gray-800 flex gap-2">
                            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                                placeholder="Ask anything about your store…"
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#E61E2B] focus:outline-none" />
                            <button onClick={send} disabled={busy} className="bg-[#E61E2B] hover:bg-[#c4172f] rounded-xl px-3.5 text-white"><Send size={16} /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
