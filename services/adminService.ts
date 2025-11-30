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
    },

    async logAction(action: string, details: any) {
        await supabase.from('admin_audit_logs').insert({
            action,
            details
        });
    }
};
