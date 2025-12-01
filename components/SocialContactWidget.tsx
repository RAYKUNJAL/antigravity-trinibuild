import React from 'react';
import { MessageCircle, Send } from 'lucide-react';

interface SocialContactWidgetProps {
    whatsappNumber?: string;
    facebookPageId?: string;
    position?: 'bottom-right' | 'bottom-left';
}

export const SocialContactWidget: React.FC<SocialContactWidgetProps> = ({
    whatsappNumber,
    facebookPageId,
    position = 'bottom-right'
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const positionClasses = position === 'bottom-right'
        ? 'bottom-6 right-6'
        : 'bottom-6 left-6';

    const handleWhatsApp = () => {
        if (whatsappNumber) {
            const message = encodeURIComponent("Hello! I'm interested in your services.");
            window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
        }
    };

    const handleMessenger = () => {
        if (facebookPageId) {
            window.open(`https://m.me/${facebookPageId}`, '_blank');
        }
    };

    return (
        <div className={`fixed ${positionClasses} z-50`}>
            {/* Options Menu */}
            {isOpen && (
                <div className="mb-4 bg-white rounded-2xl shadow-2xl p-4 w-64 animate-in slide-in-from-bottom-5">
                    <div className="mb-3">
                        <h3 className="font-bold text-gray-900 mb-1">Contact Us</h3>
                        <p className="text-sm text-gray-600">Choose your preferred platform</p>
                    </div>

                    <div className="space-y-2">
                        {whatsappNumber && (
                            <button
                                onClick={handleWhatsApp}
                                className="w-full flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200 group"
                            >
                                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <MessageCircle className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-left flex-1">
                                    <div className=" font-bold text-gray-900">WhatsApp</div>
                                    <div className="text-xs text-gray-600">Chat instantly</div>
                                </div>
                                <Send className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}

                        {facebookPageId && (
                            <button
                                onClick={handleMessenger}
                                className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 group"
                            >
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.897 1.448 5.482 3.717 7.17V22l3.573-1.965c.952.261 1.963.404 3.01.404 5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2zm.993 12.41l-2.556-2.73-4.991 2.73 5.489-5.825 2.618 2.73 4.929-2.73-5.489 5.825z" />
                                    </svg>
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-bold text-gray-900">Messenger</div>
                                    <div className="text-xs text-gray-600">Message on Facebook</div>
                                </div>
                                <Send className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all flex items-center gap-2"
                aria-label="Contact us"
            >
                <MessageCircle className="h-6 w-6" />
            </button>
        </div>
    );
};
