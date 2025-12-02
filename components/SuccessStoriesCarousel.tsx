import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, MapPin, TrendingUp } from 'lucide-react';
import { gamificationService, SuccessStory } from '../services/gamificationService';

export const SuccessStoriesCarousel: React.FC = () => {
    const [stories, setStories] = useState<SuccessStory[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [autoPlay, setAutoPlay] = useState(true);

    useEffect(() => {
        loadStories();
    }, []);

    useEffect(() => {
        if (!autoPlay || stories.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % stories.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [autoPlay, stories.length]);

    const loadStories = async () => {
        try {
            const data = await gamificationService.getSuccessStories(true);
            setStories(data);
        } catch (error) {
            console.error('Failed to load success stories:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextStory = () => {
        setCurrentIndex((prev) => (prev + 1) % stories.length);
        setAutoPlay(false);
    };

    const prevStory = () => {
        setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
        setAutoPlay(false);
    };

    if (loading || stories.length === 0) {
        return null;
    }

    const currentStory = stories[currentIndex];

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-trini-red/10 to-transparent rounded-full -mr-32 -mt-32"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-bold text-sm">Real Trini Success Stories</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                        See What Your Fellow Trinis Are Achieving
                    </h3>
                </div>

                {/* Story Card */}
                <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 md:p-8 border-2 border-gray-100 shadow-lg">
                        {/* Stars */}
                        <div className="flex justify-center gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>

                        {/* Story Text */}
                        <blockquote className="text-lg md:text-xl text-gray-700 text-center mb-6 leading-relaxed italic">
                            "{currentStory.story_text}"
                        </blockquote>

                        {/* Achievement Badge */}
                        {currentStory.achievement && (
                            <div className="flex justify-center mb-6">
                                <div className="bg-gradient-to-r from-trini-red to-red-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                                    🏆 {currentStory.achievement}
                                </div>
                            </div>
                        )}

                        {/* Author */}
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-trini-red to-trini-gold flex items-center justify-center text-white font-bold text-xl">
                                {currentStory.vendor_name.charAt(0)}
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">{currentStory.vendor_name}</p>
                                {currentStory.location && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {currentStory.location}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                        onClick={prevStory}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        aria-label="Previous story"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                    </button>

                    {/* Dots */}
                    <div className="flex gap-2">
                        {stories.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setAutoPlay(false);
                                }}
                                className={`h-2 rounded-full transition-all ${index === currentIndex
                                        ? 'w-8 bg-trini-red'
                                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                                    }`}
                                aria-label={`Go to story ${index + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={nextStory}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        aria-label="Next story"
                    >
                        <ChevronRight className="h-6 w-6 text-gray-700" />
                    </button>
                </div>

                {/* Counter */}
                <p className="text-center text-sm text-gray-500 mt-4">
                    {currentIndex + 1} of {stories.length} stories
                </p>
            </div>
        </div>
    );
};
