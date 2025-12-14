import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, Search, Filter, Plus, Tag } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Event {
    id: string;
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    location: string;
    category: string;
    image_url?: string;
    price?: number;
    organizer_name: string;
    attendees_count?: number;
    max_attendees?: number;
}

export const Events: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = [
        'all',
        'music',
        'sports',
        'business',
        'food',
        'arts',
        'technology',
        'community',
        'education'
    ];

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Hero Section */}
            <section className="relative py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
                <div className="max-w-6xl mx-auto text-center">
                    <Calendar className="h-16 w-16 text-white mx-auto mb-6" />
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
                        Events in Trinidad & Tobago
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
                        Discover amazing events happening near you
                    </p>
                </div>
            </section>

            {/* Search and Filter Section */}
            <section className="py-8 px-4 bg-white dark:bg-gray-800 shadow-md">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-12 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Create Event Button */}
                        <a
                            href="/#/create-event"
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center gap-2 justify-center"
                        >
                            <Plus className="h-5 w-5" />
                            Create Event
                        </a>
                    </div>
                </div>
            </section>

            {/* Events Grid */}
            <section className="py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading events...</p>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-20">
                            <Calendar className="h-24 w-24 text-gray-400 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                No Events Found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                {searchTerm || selectedCategory !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'Be the first to create an event!'}
                            </p>
                            <a
                                href="/#/create-event"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                            >
                                <Plus className="h-5 w-5" />
                                Create First Event
                            </a>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredEvents.map(event => (
                                <div
                                    key={event.id}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
                                >
                                    {/* Event Image */}
                                    {event.image_url ? (
                                        <img
                                            src={event.image_url}
                                            alt={event.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                            <Calendar className="h-16 w-16 text-white" />
                                        </div>
                                    )}

                                    {/* Event Details */}
                                    <div className="p-6">
                                        {/* Category Badge */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <Tag className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-semibold text-purple-600 uppercase">
                                                {event.category}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            {event.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                            {event.description}
                                        </p>

                                        {/* Event Info */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(event.event_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Clock className="h-4 w-4" />
                                                <span>{event.event_time}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <MapPin className="h-4 w-4" />
                                                <span>{event.location}</span>
                                            </div>
                                            {event.max_attendees && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Users className="h-4 w-4" />
                                                    <span>
                                                        {event.attendees_count || 0} / {event.max_attendees} attendees
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Price and CTA */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div>
                                                {event.price ? (
                                                    <span className="text-2xl font-bold text-purple-600">
                                                        ${event.price}
                                                    </span>
                                                ) : (
                                                    <span className="text-lg font-semibold text-green-600">
                                                        FREE
                                                    </span>
                                                )}
                                            </div>
                                            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6 text-white">
                        Host Your Own Event
                    </h2>
                    <p className="text-xl text-white/90 mb-8">
                        Reach thousands of people in Trinidad & Tobago with your event
                    </p>
                    <a
                        href="/#/create-event"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:shadow-xl transition-shadow"
                    >
                        <Plus className="h-5 w-5" />
                        Create Your Event
                    </a>
                </div>
            </section>
        </div>
    );
};
