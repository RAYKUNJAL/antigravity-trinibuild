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
        console.log('Video upload service initialized - v2025-12-03-1622');
        try {
            // Validate file
            if (!file) {
                throw new Error('No file provided');
            }

            // Check authentication first
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error('Authentication check failed:', authError);
                throw new Error('You must be logged in to upload videos. Please sign in and try again.');
            }

            console.log('User authenticated:', user.email);

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

            console.log(`Uploading to: site-assets/${filePath}`);
            console.log(`User ID: ${user.id}`);

            // Upload to storage
            const { data, error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                console.error('Upload error details:', uploadError);
                console.error('Upload error code:', (uploadError as any).statusCode);
                console.error('Upload error message:', uploadError.message);

                // RETURN THE RAW ERROR for debugging
                throw new Error(`RAW ERROR: ${uploadError.message} (Code: ${(uploadError as any).statusCode || 'N/A'})`);
            }

            if (!data || !data.path) {
                throw new Error('Upload succeeded but no path returned. Please try again.');
            }

            console.log('Upload successful, path:', data.path);

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
