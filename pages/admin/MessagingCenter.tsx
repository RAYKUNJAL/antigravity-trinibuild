import React from 'react';
import { MessageCircle, Search, Star, MoreVertical, Send } from 'lucide-react';

export const MessagingCenter: React.FC = () => {
    return (
        <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-bold text-lg mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-trini-red"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Mock Conversations */}
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${i === 1 ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                            <div className="flex justify-between mb-1">
                                <h3 className="font-semibold text-sm">User {i}</h3>
                                <span className="text-xs text-gray-500">10:3{i} AM</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">I need help with my store listing...</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                            U1
                        </div>
                        <div>
                            <h3 className="font-bold">User 1</h3>
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Online
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-full"><Star className="h-5 w-5 text-gray-400" /></button>
                        <button className="p-2 hover:bg-gray-100 rounded-full"><MoreVertical className="h-5 w-5 text-gray-400" /></button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tl-none shadow-sm max-w-[70%]">
                            <p className="text-sm">Hello, I'm having trouble uploading product images.</p>
                            <span className="text-xs text-gray-400 mt-1 block">10:30 AM</span>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <div className="bg-trini-red text-white p-3 rounded-lg rounded-tr-none shadow-sm max-w-[70%]">
                            <p className="text-sm">Hi there! I can help with that. Are you getting any specific error message?</p>
                            <span className="text-xs text-white/70 mt-1 block">10:31 AM</span>
                        </div>
                    </div>
                </div>

                {/* Input */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-trini-red"
                        />
                        <button className="p-2 bg-trini-red text-white rounded-lg hover:bg-red-700 transition-colors">
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
