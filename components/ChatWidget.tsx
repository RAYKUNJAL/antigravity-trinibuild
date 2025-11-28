import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Store, Home, HardHat, Car, FileText } from 'lucide-react';
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

  // Initialize messages based on mode
  useEffect(() => {
    const initialMessage = mode === 'platform'
      ? "Hi! I'm TriniBot. How can I help you grow your business today?"
      : mode === 'real_estate'
        ? "Hello! I'm your Real Estate Assistant. Looking for a home or need advice on the market?"
        : mode === 'service_expert'
          ? "Need a pro? I can help you find the best plumbers, electricians, and more in T&T."
          : mode === 'rides'
            ? "Going somewhere? I can help you find a ride or check traffic."
            : mode === 'paperwork_assistant'
              ? "Struggling with bank forms or visa letters? I can help you get the official paperwork you need."
              : `Welcome to ${vendorContext?.name || 'our store'}! I'm ${botSettings?.bot_name || 'the Store Assistant'}. Ask me anything about our products.`;

    setMessages([{ id: '1', text: initialMessage, sender: 'ai' }]);
  }, [mode, vendorContext]);

  // Listen for external open events
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      if (event.detail?.mode) {
        setMode(event.detail.mode);
      }
      setIsOpen(true);
    };

    window.addEventListener('open-chat' as any, handleOpenChat);
    return () => window.removeEventListener('open-chat' as any, handleOpenChat);
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

      // Determine system prompt based on mode
      let systemPrompt = "You are TriniBuild Support Bot, a helpful assistant with a slight Trinidadian accent.";
      if (mode === 'real_estate') systemPrompt = "You are a Real Estate Assistant for TriniBuild. Help users find properties and understand the market.";
      else if (mode === 'service_expert') systemPrompt = "You are a Service Expert. Recommend professionals (plumbers, electricians) available on TriniBuild.";
      else if (mode === 'rides') systemPrompt = "You are a Ride Assistant. Help users find rides and check traffic conditions.";
      else if (mode === 'paperwork_assistant') systemPrompt = "You are a Paperwork Assistant. Help users with official documents, visa letters, and bank forms.";
      else if (vendorContext) {
        systemPrompt = botSettings?.bot_system_prompt || `You are a sales assistant for ${vendorContext.name}. ${vendorContext.description}. Products: ${JSON.stringify(vendorContext.products)}`;
      }

      const response = await aiService.chatWithBot({
        message: userMsg.text,
        context: historyContext,
        persona: botSettings?.bot_persona || 'support_bot',
        system_prompt: systemPrompt
      });

      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: response.content, sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Sorry, I'm having trouble connecting. Please try again.", sender: 'ai' }]);
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
                  {mode === 'platform' ? 'TriniBuild Support' :
                    mode === 'real_estate' ? 'Property Assistant' :
                      mode === 'service_expert' ? 'Service Expert' :
                        mode === 'rides' ? 'Ride Assistant' :
                          mode === 'paperwork_assistant' ? 'Paperwork & Visa Help' :
                            'Store Assistant'}
                </h3>
                <span className="flex items-center text-[10px] opacity-80">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                  Online • TriniBuild AI
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
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
                  {msg.text}
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
                placeholder="Type a message..."
                className="flex-grow bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-trini-red/20 focus:bg-white transition-all outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-trini-red text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:scale-90 transition-all"
              >
                <Send className="h-5 w-5 ml-0.5" />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-400">Powered by TriniBuild AI</span>
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
