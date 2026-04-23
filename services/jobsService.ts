import { supabase } from './supabaseClient';

export interface Job {
    id: string;
    title: string;
    company: string;
    description: string;
    location: string;
    salary_min?: number;
    salary_max?: number;
    salary_period?: 'hourly' | 'monthly' | 'yearly';
    job_type: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';
    category?: string;
    requirements?: string[];
    posted_at: string;
    expires_at?: string;
    employer_id: string;
    application_email?: string;
    application_link?: string;
    is_active: boolean;
    view_count?: number;
}

export interface JobApplication {
    id: string;
    job_id: string;
    candidate_id: string;
    resume_url: string;
    cover_letter?: string;
    status: 'applied' | 'reviewing' | 'interviewed' | 'rejected' | 'accepted';
    applied_at: string;
}

export interface CandidateProfile {
    id: string;
    user_id: string;
    title?: string;
    bio?: string;
    skills: string[];
    experience_years?: number;
    education?: string[];
    resume_url?: string;
    salary_expectation_min?: number;
    salary_expectation_max?: number;
    location?: string;
    open_to_relocation?: boolean;
}

export const jobsService = {
    /**
     * Search jobs with advanced filters
     */
    async searchJobs(filters?: {
        category?: string;
        type?: string;
        search?: string;
        minSalary?: number;
        maxSalary?: number;
        location?: string;
        experienceLevel?: string;
        limit?: number;
    }) {
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
        if (filters?.minSalary) {
            query = query.gte('salary_max', filters.minSalary);
        }
        if (filters?.maxSalary) {
            query = query.lte('salary_min', filters.maxSalary);
        }
        if (filters?.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }

        const limit = filters?.limit || 20;
        const { data, error } = await query.limit(limit);

        if (error) {
            console.error('Job search error:', error);
            return [];
        }
        return data as Job[];
    },

    /**
     * Get job recommendations for a candidate
     */
    async getRecommendedJobs(candidateId: string, limit: number = 10) {
        try {
            // Get candidate profile
            const { data: profileData } = await supabase
                .from('candidate_profiles')
                .select('*')
                .eq('user_id', candidateId)
                .single();

            if (!profileData) {
                return [];
            }

            // Find jobs matching candidate's skills and experience
            let query = supabase
                .from('jobs')
                .select('*')
                .eq('is_active', true)
                .order('posted_at', { ascending: false })
                .limit(limit);

            const { data, error } = await query;

            if (error) {
                console.error('Recommendation error:', error);
                return [];
            }

            // Score jobs based on match
            const scoredJobs = (data || []).map((job: any) => {
                let score = 0;

                // Salary match
                if (profileData.salary_expectation_min && profileData.salary_expectation_max) {
                    const jobMid = ((job.salary_min || 0) + (job.salary_max || 0)) / 2;
                    const profileMid = (profileData.salary_expectation_min + profileData.salary_expectation_max) / 2;
                    if (jobMid >= profileMid * 0.8 && jobMid <= profileMid * 1.2) {
                        score += 30;
                    }
                }

                // Location match
                if (profileData.location && job.location?.includes(profileData.location)) {
                    score += 25;
                }

                // Skills match
                const jobReqs = job.requirements || [];
                const matchedSkills = (profileData.skills || []).filter((skill: string) =>
                    jobReqs.some((req: string) => req.toLowerCase().includes(skill.toLowerCase()))
                );
                score += matchedSkills.length * 10;

                return { job, score };
            });

            // Sort by score and return
            return scoredJobs
                .sort((a, b) => b.score - a.score)
                .filter(j => j.score > 0)
                .map(j => j.job);
        } catch (err) {
            console.error('Error getting recommendations:', err);
            return [];
        }
    },

    /**
     * Get salary insights for a job category
     */
    async getSalaryInsights(category: string) {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('salary_min, salary_max')
                .eq('category', category)
                .eq('is_active', true);

            if (error || !data || data.length === 0) {
                return null;
            }

            const salaries = data
                .filter((j: any) => j.salary_min && j.salary_max)
                .map((j: any) => ({ min: j.salary_min, max: j.salary_max }));

            if (salaries.length === 0) {
                return null;
            }

            const allSalaries = salaries.flatMap(s => [s.min, s.max]);
            const avgMin = allSalaries.reduce((a, b) => a + b, 0) / allSalaries.length;

            return {
                category,
                averageMinimum: Math.round(avgMin),
                averageMaximum: Math.round(allSalaries.reduce((a, b) => a + b, 0) / allSalaries.length),
                jobCount: data.length
            };
        } catch (err) {
            console.error('Error getting salary insights:', err);
            return null;
        }
    },

    /**
     * Apply for a job
     */
    async applyForJob(jobId: string, candidateId: string, resumeUrl: string, coverLetter?: string) {
        try {
            const { data, error } = await supabase
                .from('job_applications')
                .insert([{
                    job_id: jobId,
                    candidate_id: candidateId,
                    resume_url: resumeUrl,
                    cover_letter: coverLetter,
                    status: 'applied',
                    applied_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                console.error('Application error:', error);
                return null;
            }

            return data as JobApplication;
        } catch (err) {
            console.error('Error applying for job:', err);
            return null;
        }
    },

    /**
     * Get candidate's applications
     */
    async getCandidateApplications(candidateId: string) {
        try {
            const { data, error } = await supabase
                .from('job_applications')
                .select('*')
                .eq('candidate_id', candidateId)
                .order('applied_at', { ascending: false });

            if (error) {
                console.error('Applications fetch error:', error);
                return [];
            }

            return data as JobApplication[];
        } catch (err) {
            console.error('Error getting applications:', err);
            return [];
        }
    },

    /**
     * Save job
     */
    async saveJob(userId: string, jobId: string) {
        try {
            const { error } = await supabase
                .from('saved_jobs')
                .insert([{ user_id: userId, job_id: jobId }]);

            if (error && error.code !== '23505') { // 23505 = unique constraint violation
                console.error('Save error:', error);
                return false;
            }

            return true;
        } catch (err) {
            console.error('Error saving job:', err);
            return false;
        }
    },

    /**
     * Get saved jobs
     */
    async getSavedJobs(userId: string) {
        try {
            const { data, error } = await supabase
                .from('saved_jobs')
                .select('job_id')
                .eq('user_id', userId);

            if (error) {
                console.error('Saved jobs fetch error:', error);
                return [];
            }

            const jobIds = (data || []).map((d: any) => d.job_id);
            const jobs: Job[] = [];

            for (const id of jobIds) {
                const job = await jobsService.getJobById(id);
                if (job) {
                    jobs.push(job);
                }
            }

            return jobs;
        } catch (err) {
            console.error('Error getting saved jobs:', err);
            return [];
        }
    },

    /**
     * Create job alert
     */
    async createJobAlert(userId: string, criteria: {
        keywords?: string;
        category?: string;
        location?: string;
        jobType?: string;
        minSalary?: number;
    }) {
        try {
            const { data, error } = await supabase
                .from('job_alerts')
                .insert([{
                    user_id: userId,
                    keywords: criteria.keywords,
                    category: criteria.category,
                    location: criteria.location,
                    job_type: criteria.jobType,
                    min_salary: criteria.minSalary,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                console.error('Alert creation error:', error);
                return null;
            }

            return data;
        } catch (err) {
            console.error('Error creating job alert:', err);
            return null;
        }
    },

    // Original methods
    async getJobs(filters?: { category?: string; type?: string; search?: string }) {
        return jobsService.searchJobs(filters);
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
