import React, { useEffect, useRef, useState } from 'react';
import { VideoPlacement } from '../services/videoService';
import { supabase } from '../services/supabaseClient';

interface VideoPlayerProps {
    video: VideoPlacement;
    className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, className = '' }) => {
    const [hasViewed, setHasViewed] = useState(false);
    const [viewStartTime, setViewStartTime] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const isYouTube = video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be');

    // Track video view
    const trackView = async () => {
        if (hasViewed) return;

        try {
            await supabase.from('video_analytics').insert({
                video_id: video.id,
                event_type: 'view',
                page: video.page,
                section: video.section
            });
            setHasViewed(true);
            setViewStartTime(Date.now());
        } catch (error) {
            console.error('Failed to track video view:', error);
        }
    };

    // Track video engagement (watch time)
    const trackEngagement = async (watchTime: number) => {
        try {
            await supabase.from('video_analytics').insert({
                video_id: video.id,
                event_type: 'engagement',
                page: video.page,
                section: video.section,
                metadata: { watch_time_seconds: watchTime }
            });
        } catch (error) {
            console.error('Failed to track engagement:', error);
        }
    };

    // Track video completion
    const trackCompletion = async () => {
        try {
            await supabase.from('video_analytics').insert({
                video_id: video.id,
                event_type: 'complete',
                page: video.page,
                section: video.section
            });
        } catch (error) {
            console.error('Failed to track completion:', error);
        }
    };

    // Track click (for YouTube embeds)
    const trackClick = async () => {
        try {
            await supabase.from('video_analytics').insert({
                video_id: video.id,
                event_type: 'click',
                page: video.page,
                section: video.section
            });
        } catch (error) {
            console.error('Failed to track click:', error);
        }
    };

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || isYouTube) return;

        const handlePlay = () => trackView();
        const handleEnded = () => {
            trackCompletion();
            if (viewStartTime) {
                const watchTime = Math.floor((Date.now() - viewStartTime) / 1000);
                trackEngagement(watchTime);
            }
        };

        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('ended', handleEnded);

        return () => {
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('ended', handleEnded);
        };
    }, [isYouTube, viewStartTime]);

    // For YouTube videos, track on iframe load
    useEffect(() => {
        if (isYouTube && iframeRef.current) {
            const handleLoad = () => trackView();
            iframeRef.current.addEventListener('load', handleLoad);
            return () => iframeRef.current?.removeEventListener('load', handleLoad);
        }
    }, [isYouTube]);

    // Helper to convert YouTube watch URLs to embed URLs
    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('/embed/')) return url;

        let videoId = '';

        // Handle standard watch URLs (youtube.com/watch?v=...)
        if (url.includes('watch?v=')) {
            videoId = url.split('watch?v=')[1].split('&')[0];
        }
        // Handle short URLs (youtu.be/...)
        else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }

        return url;
    };

    if (isYouTube) {
        return (
            <div className={`relative ${className}`} onClick={trackClick}>
                <iframe
                    ref={iframeRef}
                    src={getEmbedUrl(video.video_url)}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={video.title}
                />
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <video
                ref={videoRef}
                src={video.video_url}
                autoPlay={video.autoplay}
                loop={video.loop}
                muted={video.muted}
                controls={video.controls}
                className="w-full h-full object-cover"
                playsInline
            />
            {video.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white font-bold text-lg">{video.title}</h3>
                    {video.description && (
                        <p className="text-white/90 text-sm">{video.description}</p>
                    )}
                </div>
            )}
        </div>
    );
};
