import { supabase } from './supabaseClient';

export interface Job {
    id: string;
    title: string;
    company: string;
    description: string;
    location: string;
    salary_range?: string;
    job_type: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';
    category?: string;
    requirements?: string[];
    posted_at: string;
    expires_at?: string;
    employer_id: string;
    application_email?: string;
    application_link?: string;
    is_active: boolean;
}

export const jobsService = {
    async getJobs(filters?: { category?: string; type?: string; search?: string }) {
        let query = supabase
            .from('jobs')
            .select('*')
            .eq('is_active', true)
            .order('posted_at', { ascending: false });

        if (filters?.category) {
            query = query.eq('category', filters.category);
        }
        if (filters?.type) {
            query = query.eq('job_type', filters.type);
        }
        if (filters?.search) {
            query = query.ilike('title', `%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Job[];
    },

    async getJobById(id: string) {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Job;
    },

    async postJob(job: Partial<Job>) {
        const { data, error } = await supabase
            .from('jobs')
            .insert([job])
            .select()
            .single();

        if (error) throw error;
        return data as Job;
    },

    async getMyPostedJobs(userId: string) {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('employer_id', userId)
            .order('posted_at', { ascending: false });

        if (error) throw error;
        return data as Job[];
    },

    async deleteJob(id: string) {
        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
