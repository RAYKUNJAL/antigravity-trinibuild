import React, { useState, useRef, useEffect } from 'react';
import {
    MessageCircle,
    Send,
    X,
    Minimize2,
    Maximize2,
    Sparkles,
    User,
    Bot,
    Search,
    Briefcase,
    Home,
    Ticket,
    Store,
    MapPin,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import {
    conciergeService,
    ConversationMessage,
    ConciergeResponse,
    ConciergeResult,
    QuickAction,
    ConciergePersona
} from '../services/conciergeService';
import { Link } from 'react-router-dom';

// ============================================
// TYPES
// ============================================

interface AIConciergeProps {
    initialOpen?: boolean;
    persona?: ConciergePersona;
    userId?: string;
    location?: string;
    position?: 'bottom-right' | 'bottom-left' | 'inline';
    className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const AIConcierge: React.FC<AIConciergeProps> = ({
    initialOpen = false,
    persona = 'general',
    userId,
    location,
    position = 'bottom-right',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastResponse, setLastResponse] = useState<ConciergeResponse | null>(null);

    const sessionIdRef = useRef<string>(`concierge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    // Send welcome message on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMsg: ConversationMessage = {
                id: 'welcome',
                role: 'assistant',
                content: "Hey there! 👋 I'm your TriniBuild Concierge. How can I help you today? I can help you find jobs, rentals, events, services, and more across Trinidad & Tobago!",
                timestamp: new Date().toISOString(),
                metadata: {
                    suggestions: [
                        "Find jobs in Port of Spain",
                        "Apartments for rent in San Fernando",
                        "Events this weekend",
                        "I need a plumber"
                    ]
                }
            };
            setMessages([welcomeMsg]);
        }
    }, [isOpen]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        // Add user message
        const userMsg: ConversationMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await conciergeService.sendMessage(
                sessionIdRef.current,
                content,
                { persona, userId, location }
            );

            // Add assistant response
            const assistantMsg: ConversationMessage = {
                id: `assistant_${Date.now()}`,
                role: 'assistant',
                content: response.message,
                timestamp: new Date().toISOString(),
                metadata: {
                    suggestions: response.suggestions,
                    quickActions: response.quickActions,
                    results: response.results
                }
            };
            setMessages(prev => [...prev, assistantMsg]);
            setLastResponse(response);
        } catch (error) {
            console.error('Concierge error:', error);
            const errorMsg: ConversationMessage = {
                id: `error_${Date.now()}`,
                role: 'assistant',
                content: "I'm having some trouble right now. Please try again in a moment.",
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    const handleQuickAction = (action: QuickAction) => {
        if (action.action === 'navigate' && action.url) {
            window.location.href = action.url;
        } else if (action.action === 'prompt') {
            inputRef.current?.focus();
        }
    };

    const resetChat = () => {
        conciergeService.clearSession(sessionIdRef.current);
        sessionIdRef.current = `concierge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setMessages([]);
        setLastResponse(null);
    };

    // Position classes
    const positionClasses = {
        'bottom-right': 'fixed bottom-4 right-4 z-50',
        'bottom-left': 'fixed bottom-4 left-4 z-50',
        'inline': 'relative'
    };

    // Floating button (when closed)
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`${positionClasses[position]} bg-gradient-to-r from-trini-red to-orange-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 ${className}`}
                aria-label="Open AI Concierge"
            >
                <MessageCircle className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </button>
        );
    }

    // Chat window
    return (
        <div className={`${positionClasses[position]} ${className}`}>
            <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all ${isMinimized ? 'w-72 h-14' : 'w-96 h-[600px]'
                }`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-trini-red to-orange-500 text-white p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold">AI Concierge</h3>
                            {!isMinimized && (
                                <p className="text-xs text-white/80">Ask me anything about T&T</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={resetChat}
                            className="p-1.5 hover:bg-white/20 rounded-lg"
                            aria-label="Reset chat"
                            title="Reset chat"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1.5 hover:bg-white/20 rounded-lg"
                            aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
                        >
                            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/20 rounded-lg"
                            aria-label="Close chat"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Chat Content (when not minimized) */}
                {!isMinimized && (
                    <>
                        {/* Messages */}
                        <div className="h-[460px] overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                            {messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    onSuggestionClick={handleSuggestionClick}
                                    onQuickAction={handleQuickAction}
                                />
                            ))}

                            {isLoading && (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessage(inputValue);
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Ask me anything..."
                                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-trini-red"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="p-2 bg-trini-red text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Send message"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ============================================
// MESSAGE BUBBLE COMPONENT
// ============================================

interface MessageBubbleProps {
    message: ConversationMessage;
    onSuggestionClick: (suggestion: string) => void;
    onQuickAction: (action: QuickAction) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    onSuggestionClick,
    onQuickAction
}) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
                {/* Avatar */}
                <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-2 rounded-full flex-shrink-0 ${isUser
                            ? 'bg-trini-red text-white'
                            : 'bg-gradient-to-r from-trini-red to-orange-500 text-white'
                        }`}>
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    <div className={`rounded-2xl px-4 py-2 ${isUser
                            ? 'bg-trini-red text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                </div>

                {/* Results */}
                {message.metadata?.results && message.metadata.results.length > 0 && (
                    <div className="mt-3 space-y-2 ml-10">
                        {message.metadata.results.slice(0, 3).map((result) => (
                            <ResultCard key={result.id} result={result} />
                        ))}
                    </div>
                )}

                {/* Quick Actions */}
                {message.metadata?.quickActions && message.metadata.quickActions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 ml-10">
                        {message.metadata.quickActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => onQuickAction(action)}
                                className="px-3 py-1.5 bg-trini-red/10 text-trini-red rounded-full text-xs font-medium hover:bg-trini-red/20 flex items-center gap-1"
                            >
                                {action.label} <ChevronRight className="h-3 w-3" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Suggestions */}
                {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && !message.metadata.results && (
                    <div className="mt-3 flex flex-wrap gap-2 ml-10">
                        {message.metadata.suggestions.map((suggestion, i) => (
                            <button
                                key={i}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// RESULT CARD COMPONENT
// ============================================

const ResultCard: React.FC<{ result: ConciergeResult }> = ({ result }) => {
    const typeIcons: Record<string, React.ReactNode> = {
        jobs: <Briefcase className="h-4 w-4" />,
        real_estate: <Home className="h-4 w-4" />,
        events: <Ticket className="h-4 w-4" />,
        marketplace: <Store className="h-4 w-4" />,
        stores: <Store className="h-4 w-4" />
    };

    return (
        <Link
            to={result.url}
            className="block bg-white dark:bg-gray-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-600"
        >
            <div className="flex gap-3">
                {result.image && (
                    <img
                        src={result.image}
                        alt={result.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        {typeIcons[result.type]}
                        <span className="capitalize">{result.type.replace('_', ' ')}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                        {result.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-1">{result.subtitle}</p>
                    <div className="flex items-center justify-between mt-1">
                        {result.location && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {result.location}
                            </span>
                        )}
                        {result.price && (
                            <span className="text-xs font-bold text-trini-red">{result.price}</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default AIConcierge;
