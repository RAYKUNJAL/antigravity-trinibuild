import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Store, Home, HardHat, Car, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService } from '../services/ai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

interface ChatWidgetProps {
  mode: 'platform' | 'vendor' | 'real_estate' | 'service_expert' | 'rides' | 'paperwork_assistant';
  vendorContext?: any;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ mode: initialMode, vendorContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [botSettings, setBotSettings] = useState<any>(null);

  useEffect(() => {
    if (vendorContext?.id) {
      aiService.getStoreBotSettings(vendorContext.id).then(settings => {
        if (settings) setBotSettings(settings);
      });
    }
  }, [vendorContext]);

  // Load messages from localStorage on mount or mode change
  useEffect(() => {
    const storageKey = vendorContext?.id
      ? `chat_history_vendor_${vendorContext.id}`
      : `chat_history_${mode}`;

    const savedMessages = localStorage.getItem(storageKey);

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to parse chat history', e);
        initializeDefaultMessage();
      }
    } else {
      initializeDefaultMessage();
    }
  }, [mode, vendorContext]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = vendorContext?.id
        ? `chat_history_vendor_${vendorContext.id}`
        : `chat_history_${mode}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, mode, vendorContext]);

  const initializeDefaultMessage = () => {
    // Get T&T time greeting (UTC-4, no DST)
    const ttHour = (new Date().getUTCHours() - 4 + 24) % 24;
    const greeting = ttHour < 12 ? 'Good morning' : ttHour < 17 ? 'Good afternoon' : ttHour < 22 ? 'Good evening' : 'Good night';
    
    const initialMessage = mode === 'platform'
      ? `🇹🇹 ${greeting}! I'm yuh TriniBuild AI Concierge. I know everything about Trinidad & Tobago — business, banking, visa, legal, you name it. I could help yuh:\n\n• **Open a free online store** with COD\n• **Generate documents** — job letters, visa letters, proof of income\n• **Answer T&T business questions** — banking, BIR, NIS, VAT\n• **Find services & professionals** across T&T\n• **Get a ride** anywhere in Trinidad\n\nWhat yuh need help with today?`
      : mode === 'real_estate'
        ? `🏠 ${greeting}! I'm yuh TriniBuild Real Estate Concierge. I know every area in T&T — from Westmoorings to Tobago, pricing, mortgage rates, the works. Looking to buy, rent, or sell?`
        : mode === 'service_expert'
          ? `🔧 ${greeting}! Need a professional? I know the rates for every trade in T&T — plumbers, electricians, AC techs, painters, mechanics. Who yuh looking for?`
          : mode === 'rides'
            ? `🚗 ${greeting}! Where yuh heading? I know every road, maxi route, and shortcut in Trinidad & Tobago. Leh meh help yuh get there.`
            : mode === 'paperwork_assistant'
              ? `📄 ${greeting}! I'm yuh TriniBuild Document Assistant. I could generate job letters, visa support letters, proof of income, contractor agreements — all formatted for T&T banks, embassies, and government offices. What document yuh need?`
              : `${greeting}! Welcome to ${vendorContext?.name || 'our store'}! I'm ${botSettings?.bot_name || 'the Store Assistant'}. Ask me anything about we products or services!`;

    setMessages([{ id: '1', text: initialMessage, sender: 'ai' }]);
  };

  // Listen for external open events
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      if (event.detail?.mode) {
        setMode(event.detail.mode);
      }
      setIsOpen(true);
    };

    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Construct context from history (last 5 messages)
      const historyContext = messages.slice(-5).map(m => `${m.sender === 'user' ? 'User' : 'Bot'}: ${m.text}`).join('\n');

      // Enhanced AI Concierge system prompts
      let systemPrompt = `You are TriniBuild AI Concierge - a smart, friendly assistant for Trinidad & Tobago's leading local business platform.

PERSONALITY:
- Warm, helpful, with slight Trini vibes (use "wah goin on", "lime", "fete" naturally)
- Proactive - always suggest next steps and related services
- Knowledgeable about Trinidad locations, culture, and business landscape

PLATFORM KNOWLEDGE:
- TriniBuild helps locals sell online with FREE stores (10 items free)
- Services: Marketplace, Jobs, Real Estate, Rides, Events/Tickets, Classifieds
- Routes: /classifieds (shop), /jobs (find work), /real-estate (housing), /rides (transport), /tickets (events)
- /create-store - start selling, /earn - affiliate program, /blog - tips & guides

ALWAYS:
1. Answer the question directly first
2. Then suggest 1-2 relevant TriniBuild features/pages
3. Be concise but helpful
4. Format with markdown (bold, lists) for readability

Current user is browsing TriniBuild.`;

      if (mode === 'real_estate') {
        systemPrompt = `You are TriniBuild Real Estate Concierge. Help users find properties, understand the T&T market, connect with agents. Know Port of Spain, San Fernando, Chaguanas, Arima, etc. Always suggest /real-estate for listings.`;
      } else if (mode === 'service_expert') {
        systemPrompt = `You are TriniBuild Service Expert. Recommend vetted professionals - plumbers, electricians, mechanics, painters, cleaners. Know T&T service landscape. Suggest /jobs for hiring.`;
      } else if (mode === 'rides') {
        systemPrompt = `You are TriniBuild Rides Concierge. Help with transportation - PH taxis, maxi routes, airport drops. Know T&T geography. Suggest /rides for booking.`;
      } else if (mode === 'paperwork_assistant') {
        systemPrompt = `You are TriniBuild Paperwork Assistant. Generate professional visa support letters, job offer letters, proof of income, contractor agreements. Be formal but helpful. These documents help Trinis with bank applications and visa requirements.`;
      } else if (vendorContext) {
        systemPrompt = botSettings?.bot_system_prompt || `You are a sales assistant for ${vendorContext.name}. ${vendorContext.description}. Products: ${JSON.stringify(vendorContext.products)}`;
      }

      const response = mode === 'platform'
        ? await aiService.islandChat(
            userMsg.text,
            messages.slice(-8).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            'support'
          )
        : await aiService.chatWithBot({
            message: userMsg.text,
            context: historyContext,
            persona: botSettings?.bot_persona || 'concierge',
            system_prompt: systemPrompt
          });

      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: response.content, sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);

      // Log if using fallback
      if (response.model_used?.includes('fallback')) {
        console.log('Using fallback AI responses - AI server unavailable');
      }
    } catch (error: any) {
      console.error("Unexpected chat error:", error);
      // This should rarely happen now since aiService has fallback
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `I apologize, but I'm having trouble right now. Please try:\n\n• Refreshing the page\n• Checking your internet connection\n• Contacting support@trinibuild.com\n\nI'm here to help once we're back online!`,
        sender: 'ai'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Adjusted positioning: bottom-24 on mobile to clear sticky footers, bottom-6 on desktop
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col mb-4 border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in">
          {/* Header */}
          <div className={`p-4 text-white flex justify-between items-center ${mode === 'platform' ? 'bg-trini-black' :
            mode === 'real_estate' ? 'bg-green-700' :
              mode === 'service_expert' ? 'bg-blue-600' :
                mode === 'rides' ? 'bg-yellow-500' :
                  mode === 'paperwork_assistant' ? 'bg-indigo-600' :
                    'bg-trini-teal'
            }`}>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                {mode === 'platform' ? <Sparkles className="h-5 w-5" /> :
                  mode === 'real_estate' ? <Home className="h-5 w-5" /> :
                    mode === 'service_expert' ? <HardHat className="h-5 w-5" /> :
                      mode === 'rides' ? <Car className="h-5 w-5" /> :
                        mode === 'paperwork_assistant' ? <FileText className="h-5 w-5" /> :
                          <Store className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  {mode === 'platform' ? 'TriniBot 🇹🇹' :
                    mode === 'real_estate' ? 'TriniBot • Property' :
                      mode === 'service_expert' ? 'TriniBot • Services' :
                        mode === 'rides' ? 'TriniBot • Rides' :
                          mode === 'paperwork_assistant' ? 'TriniBot • Documents' :
                            `${botSettings?.bot_name || 'Store Assistant'}`}
                </h3>
                <span className="flex items-center text-[10px] opacity-80">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  {mode === 'platform' ? 'Online • Ask me anything about T&T' :
                    mode === 'real_estate' ? 'Online • Property expert for T&T' :
                      mode === 'service_expert' ? 'Online • Find any pro in T&T' :
                        mode === 'rides' ? 'Online • I know every road' :
                          mode === 'paperwork_assistant' ? 'Online • Visa, banking & legal help' :
                            `Online • ${vendorContext?.name || 'Ready to help'}`}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded" aria-label="Close chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                  ? 'bg-trini-red text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}>
                  {msg.sender === 'ai' ? (
                    <ReactMarkdown
                      className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white prose-a:text-blue-600 prose-ul:list-disc prose-ol:list-decimal"
                      remarkPlugins={[remarkGfm]}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-xs text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask meh anything..."
                className="flex-grow bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-trini-red/20 focus:bg-white transition-all outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-trini-red text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:scale-90 transition-all"
                aria-label="Send message"
              >
                <Send className="h-5 w-5 ml-0.5" />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-400">TriniBot by R&R Digital Solutions 🇹🇹</span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`${mode === 'real_estate' ? 'bg-green-600' : mode === 'service_expert' ? 'bg-blue-600' : mode === 'rides' ? 'bg-yellow-500' : mode === 'paperwork_assistant' ? 'bg-indigo-600' : 'bg-trini-black'} text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center group border-2 border-white/20`}
        >
          {mode === 'real_estate' ? (
            <Home className="h-8 w-8 group-hover:scale-110 transition-transform" />
          ) : mode === 'service_expert' ? (
            <HardHat className="h-8 w-8 group-hover:rotate-12 transition-transform" />
          ) : mode === 'rides' ? (
            <Car className="h-8 w-8 group-hover:translate-x-1 transition-transform" />
          ) : mode === 'paperwork_assistant' ? (
            <FileText className="h-8 w-8 group-hover:scale-110 transition-transform" />
          ) : (
            <MessageCircle className="h-8 w-8 group-hover:rotate-12 transition-transform" />
          )}
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">1</span>
        </button>
      )}
    </div>
  );
};
