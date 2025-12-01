import { supabase } from './supabaseClient';
import { Theme, Logo } from '../types';

export const themeService = {
    // --- THEME MANAGEMENT ---

    // Get theme for a store
    getTheme: async (storeId: string): Promise<Theme | null> => {
        const { data, error } = await supabase
            .from('themes')
            .select('*')
            .eq('store_id', storeId)
            .single();

        if (error) return null;
        return data as Theme;
    },

    // Save or Update Theme
    saveTheme: async (storeId: string, themeData: Partial<Theme>): Promise<Theme | null> => {
        // Check if theme exists
        const existing = await themeService.getTheme(storeId);

        if (existing) {
            const { data, error } = await supabase
                .from('themes')
                .update({
                    tokens: themeData.tokens,
                    name: themeData.name
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return data as Theme;
        } else {
            const { data, error } = await supabase
                .from('themes')
                .insert({
                    store_id: storeId,
                    name: themeData.name || 'Custom Theme',
                    tokens: themeData.tokens,
                    is_default: true
                })
                .select()
                .single();

            if (error) throw error;
            return data as Theme;
        }
    },

    // --- LOGO MANAGEMENT ---

    getLogo: async (storeId: string): Promise<Logo | null> => {
        const { data, error } = await supabase
            .from('logos')
            .select('*')
            .eq('store_id', storeId)
            .single();

        if (error) return null;
        return data as Logo;
    },

    saveLogo: async (storeId: string, logoData: Partial<Logo>): Promise<Logo | null> => {
        const existing = await themeService.getLogo(storeId);

        if (existing) {
            const { data, error } = await supabase
                .from('logos')
                .update(logoData)
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return data as Logo;
        } else {
            const { data, error } = await supabase
                .from('logos')
                .insert({
                    store_id: storeId,
                    ...logoData
                })
                .select()
                .single();

            if (error) throw error;
            return data as Logo;
        }
    }
};
