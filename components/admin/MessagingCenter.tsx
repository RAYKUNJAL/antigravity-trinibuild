import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { MessageSquare, Mail, CheckCircle, Clock } from 'lucide-react';

export const MessagingCenter: React.FC = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('support_messages')
                .select('*')
                .order('created_at', { ascending: false });
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsResolved = async (id: string) => {
        try {
            await supabase.from('support_messages').update({ status: 'resolved' }).eq('id', id);
            fetchMessages();
        } catch (error) {
            console.error('Error updating message:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="h-7 w-7 text-indigo-500" />
                    Messaging Center
                </h1>
                <p className="text-gray-500">Support tickets and user inquiries</p>
            </div>

            {loading ? <div className="text-center py-10">Loading messages...</div> : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                    {messages.map((msg) => (
                        <div key={msg.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="font-bold text-gray-900 dark:text-white">{msg.subject || 'No Subject'}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${msg.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {msg.status}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{msg.message}</p>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">From: {msg.email || 'Anonymous'}</span>
                                {msg.status !== 'resolved' && (
                                    <button
                                        onClick={() => markAsResolved(msg.id)}
                                        className="flex items-center gap-1 text-green-600 hover:text-green-700"
                                    >
                                        <CheckCircle className="h-3 w-3" /> Mark Resolved
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No messages found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessagingCenter;
