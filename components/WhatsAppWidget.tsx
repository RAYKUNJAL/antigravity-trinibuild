import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface WhatsAppWidgetProps {
    phoneNumber: string; // Format: 18687654321 (country code + number, no + or spaces)
    message?: string;
    position?: 'bottom-right' | 'bottom-left';
}

export const WhatsAppWidget: React.FC<WhatsAppWidgetProps> = ({
    phoneNumber,
    message = "Hello! I'm interested in your services.",
    position = 'bottom-right'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customMessage, setCustomMessage] = useState(message);

    const handleSendMessage = () => {
        const encodedMessage = encodeURIComponent(customMessage);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        setIsOpen(false);
    };

    const positionClasses = position === 'bottom-right'
        ? 'bottom-6 right-6'
        : 'bottom-6 left-6';

    return (
        <div className={`fixed ${positionClasses} z-50`}>
            {/* Chat Popup */}
            {isOpen && (
                <div className="mb-4 bg-white rounded-2xl shadow-2xl w-80 animate-in slide-in-from-bottom-5">
                    <div className="bg-green-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                <MessageCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <div className="font-bold">TriniBuild Support</div>
                                <div className="text-xs text-green-100">Typically replies instantly</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-green-700 p-1 rounded transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="mb-3">
                            <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
                                👋 Hi there! How can we help you today?
                            </div>
                        </div>

                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                            rows={3}
                        />

                        <button
                            onClick={handleSendMessage}
                            className="w-full mt-3 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send className="h-5 w-5" />
                            Send WhatsApp Message
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all flex items-center gap-2 group"
                aria-label="Open WhatsApp chat"
            >
                <MessageCircle className="h-6 w-6" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium">
                    Chat on WhatsApp
                </span>
            </button>
        </div>
    );
};

// Share on WhatsApp button component
interface WhatsAppShareProps {
    text: string;
    url?: string;
    className?: string;
}

export const WhatsAppShare: React.FC<WhatsAppShareProps> = ({ text, url, className = '' }) => {
    const handleShare = () => {
        const shareText = url ? `${text}\n\n${url}` : text;
        const encodedText = encodeURIComponent(shareText);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    return (
        <button
            onClick={handleShare}
            className={`inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors ${className}`}
        >
            <MessageCircle className="h-4 w-4" />
            Share on WhatsApp
        </button>
    );
};

// Click to chat button
interface WhatsAppButtonProps {
    phoneNumber: string;
    message?: string;
    label?: string;
    className?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
    phoneNumber,
    message = "Hello! I'm interested in this.",
    label = "Chat on WhatsApp",
    className = ''
}) => {
    const handleClick = () => {
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    };

    return (
        <button
            onClick={handleClick}
            className={`inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium ${className}`}
        >
            <MessageCircle className="h-5 w-5" />
            {label}
        </button>
    );
};
