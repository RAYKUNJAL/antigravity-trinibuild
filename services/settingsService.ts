import { supabase } from './supabaseClient';

export const settingsService = {
    getSetting: async (key: string) => {
        const { data } = await supabase
            .from('site_settings')
            .select('value, type')
            .eq('key', key)
            .single();

        if (data) {
            if (data.type === 'boolean') return data.value === 'true';
            if (data.type === 'number') return Number(data.value);
            if (data.type === 'json') return JSON.parse(data.value);
            return data.value;
        }
        return null;
    },

    setSetting: async (key: string, value: any, type: 'string' | 'boolean' | 'number' | 'json' = 'string') => {
        // Prepare string value
        let stringValue = String(value);
        if (type === 'json') stringValue = JSON.stringify(value);

        const { error } = await supabase
            .from('site_settings')
            .upsert({ key, value: stringValue, type }); // upsert acts as create or update

        if (error) throw error;
    }
};
