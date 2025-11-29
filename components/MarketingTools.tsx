import React, { useState } from 'react';
import { MessageCircle, Users, Send, Download, Copy, CheckCircle } from 'lucide-react';

export const MarketingTools: React.FC = () => {
    const [message, setMessage] = useState("Hello! Check out our latest deals on TriniBuild.");
    const [targetAudience, setTargetAudience] = useState<'all' | 'buyers' | 'leads'>('all');
    const [isSending, setIsSending] = useState(false);
    const [sentCount, setSentCount] = useState(0);

    // Mock audience data
    const audienceSize = {
        all: 124,
        buyers: 45,
        leads: 79
    };

    const handleBroadcast = () => {
        setIsSending(true);
        // Simulate sending process
        setTimeout(() => {
            setIsSending(false);
            setSentCount(audienceSize[targetAudience]);
            alert(`Broadcast queued for ${audienceSize[targetAudience]} users! (Simulation)`);
        }, 2000);
    };

    const generateWhatsAppLink = () => {
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/?text=${encodedMessage}`;
    };

    return (
        <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-green-800 flex items-center mb-4">
                    <MessageCircle className="h-6 w-6 mr-2" /> WhatsApp Marketing Hub
                </h2>
                <p className="text-green-700 mb-6">
                    Reach your customers directly on their phones. WhatsApp has a 98% open rate compared to 20% for email.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Contacts</p>
                        <p className="text-3xl font-bold text-gray-900">{audienceSize.all}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                        <p className="text-xs text-gray-500 uppercase font-bold">Opt-in Rate</p>
                        <p className="text-3xl font-bold text-gray-900">85%</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                        <p className="text-xs text-gray-500 uppercase font-bold">Msgs Sent Today</p>
                        <p className="text-3xl font-bold text-gray-900">{sentCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="font-bold text-gray-900">New Broadcast Campaign</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                            <select
                                aria-label="Target Audience"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value as any)}
                                className="w-full border border-gray-300 rounded-lg p-2"
                            >
                                <option value="all">All Contacts ({audienceSize.all})</option>
                                <option value="buyers">Past Customers ({audienceSize.buyers})</option>
                                <option value="leads">Interested Leads ({audienceSize.leads})</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Type your message here..."
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">{message.length} characters</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handleBroadcast}
                                disabled={isSending}
                                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center shadow-lg transition-all"
                            >
                                {isSending ? 'Sending...' : <><Send className="h-4 w-4 mr-2" /> Send Broadcast</>}
                            </button>

                            <a
                                href={generateWhatsAppLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-white text-green-700 border border-green-200 py-3 rounded-lg font-bold hover:bg-green-50 flex items-center justify-center"
                            >
                                <Copy className="h-4 w-4 mr-2" /> Test Link
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Download className="h-5 w-5 mr-2 text-gray-500" /> Export Data
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Download your customer list including phone numbers and purchase history for use in other tools.
                </p>
                <button className="text-blue-600 font-bold text-sm hover:underline">Download CSV</button>
            </div>
        </div>
    );
};
