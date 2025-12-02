import React, { useEffect, useState } from 'react';
import { videoService, VideoPlacement } from '../services/videoService';
import { VideoPlayer } from './VideoPlayer';

interface VideoSectionProps {
    page: string;
    section: string;
    className?: string;
    containerClassName?: string;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
    page,
    section,
    className = '',
    containerClassName = ''
}) => {
    const [videos, setVideos] = useState<VideoPlacement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadVideos = async () => {
            try {
                const allVideos = await videoService.getVideosByPage(page);
                const sectionVideos = allVideos.filter(v => v.section === section);
                setVideos(sectionVideos);
            } catch (error) {
                console.error('Failed to load videos:', error);
            } finally {
                setLoading(false);
            }
        };

        loadVideos();
    }, [page, section]);

    if (loading || videos.length === 0) {
        return null;
    }

    return (
        <div className={containerClassName}>
            {videos.map((video) => (
                <VideoPlayer
                    key={video.id}
                    video={video}
                    className={className}
                />
            ))}
        </div>
    );
};
