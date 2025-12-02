import { supabase } from './supabaseClient';

export interface VideoPlacement {
    id: string;
    page: string;
    section: string;
    video_url: string;
    title: string;
    description?: string;
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    controls: boolean;
    position: number;
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
            .order('position', { ascending: true });

        if (error) throw error;
        return data as VideoPlacement[];
    },

    async getVideosByPage(page: string) {
        const { data, error } = await supabase
            .from('video_placements')
            .select('*')
            .eq('page', page)
            .eq('active', true)
            .order('position', { ascending: true });

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

    async uploadVideo(file: File, path: string) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('site-assets')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('site-assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
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
