import { supabase } from './supabaseClient';

export interface SiteSetting {
    key: string;
    value: string;
    type: 'string' | 'json' | 'boolean' | 'number';
}

export const adminService = {
    async getSettings() {
        const { data, error } = await supabase
            .from('site_settings')
            .select('*');

        if (error) throw error;
        return data as SiteSetting[];
    },

    async updateSetting(key: string, value: string) {
        const { error } = await supabase
            .from('site_settings')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key);

        if (error) throw error;
    },

    async uploadAsset(file: File, path: string) {
        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            // Upload directly with robust options
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error: any) {
            console.error('Asset upload error:', error);
            throw new Error(error.message || 'Failed to upload asset');
        }
    },

    async logAction(action: string, details: any) {
        await supabase.from('admin_audit_logs').insert({
            action,
            details
        });
    }
};
