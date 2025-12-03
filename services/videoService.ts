import { supabase } from './supabaseClient';

export interface VideoPlacement {
    id: string;
    page: string;
    section: string;
    video_url: string;
    is_youtube?: boolean;
    title: string;
    description?: string;
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    controls: boolean;
    sort_order: number;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export const videoService = {
    async getVideoPlacements() {
        const { data, error } = await supabase
            .from('video_placements')
            .select('*')
            .order('page', { ascending: true })
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data as VideoPlacement[];
    },

    async getVideosByPage(page: string) {
        const { data, error } = await supabase
            .from('video_placements')
            .select('*')
            .eq('page', page)
            .eq('active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data as VideoPlacement[];
    },

    async saveVideoPlacement(video: Partial<VideoPlacement>) {
        if (video.id) {
            const { error } = await supabase
                .from('video_placements')
                .update({
                    ...video,
                    updated_at: new Date().toISOString()
                })
                .eq('id', video.id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('video_placements')
                .insert([video]);

            if (error) throw error;
        }
    },

    async deleteVideoPlacement(id: string) {
        const { error } = await supabase
            .from('video_placements')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async uploadVideo(file: File, path: string = 'videos', onProgress?: (progress: number) => void): Promise<string> {
        try {
            // Validate file
            if (!file) {
                throw new Error('No file provided');
            }

            // Check file type
            const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi'];
            if (!validTypes.includes(file.type)) {
                throw new Error(`Invalid file type: ${file.type}. Please upload MP4, WebM, MOV, or AVI files.`);
            }

            // Check file size (500MB max)
            const maxSize = 500 * 1024 * 1024; // 500MB
            if (file.size > maxSize) {
                throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 500MB.`);
            }

            console.log(`Uploading video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

            // Generate unique filename
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
            const fileName = `video_${timestamp}_${randomStr}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            console.log(`Uploading to: ${filePath}`);

            // Upload directly (skip bucket check to avoid CORS/RLS issues on listBuckets)
            const { data, error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type // Explicitly set content type
                });

            if (uploadError) {
                console.error('Upload error details:', uploadError);

                // Provide helpful error messages
                if (uploadError.message.includes('Bucket not found')) {
                    throw new Error('Storage bucket "site-assets" not found. Please run migration 18.');
                } else if (uploadError.message.includes('exceeded')) {
                    throw new Error('File size exceeds storage limits.');
                } else if (uploadError.message.includes('policy') || uploadError.message.includes('permission')) {
                    throw new Error('Storage permissions error. Please check Supabase RLS policies.');
                } else {
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            if (!urlData?.publicUrl) {
                throw new Error('Failed to get public URL for uploaded video');
            }

            console.log(`Video uploaded successfully: ${urlData.publicUrl}`);

            if (onProgress) {
                onProgress(100);
            }

            return urlData.publicUrl;

        } catch (error: any) {
            console.error('Video upload error:', error);
            throw new Error(error.message || 'Failed to upload video. Please try again.');
        }
    },

    // Helper function to compress video client-side (optional)
    async compressVideo(file: File, maxSizeMB: number = 50): Promise<File> {
        // For now, return original file
        // In production, you could use a library like browser-image-compression
        // or ffmpeg.wasm for client-side video compression
        console.log('Video compression not yet implemented, using original file');
        return file;
    }
};

// Available pages for video placement
export const AVAILABLE_PAGES = [
    { value: 'home', label: 'Home Page' },
    { value: 'stores', label: 'Stores/Marketplace' },
    { value: 'rides', label: 'Rides' },
    { value: 'drive', label: 'Drive With Us' },
    { value: 'jobs', label: 'Jobs Board' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'tickets', label: 'Events & Tickets' },
    { value: 'legal', label: 'Legal Services' },
    { value: 'about', label: 'About Us' },
];

// Available sections per page
export const PAGE_SECTIONS: Record<string, string[]> = {
    home: ['hero', 'features', 'testimonials', 'cta'],
    stores: ['hero', 'featured', 'categories'],
    rides: ['hero', 'how-it-works', 'safety'],
    drive: ['hero', 'benefits', 'requirements'],
    jobs: ['hero', 'featured-jobs'],
    'real-estate': ['hero', 'featured-properties'],
    tickets: ['hero', 'upcoming-events'],
    legal: ['hero', 'services'],
    about: ['hero', 'team', 'mission'],
};
