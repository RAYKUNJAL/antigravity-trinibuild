-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  salary_range TEXT,
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'temporary', 'internship')),
  category TEXT,
  requirements TEXT[], -- Array of strings for bullet points
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  employer_id UUID REFERENCES auth.users(id),
  application_email TEXT,
  application_link TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Jobs are viewable by everyone" 
ON jobs FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can post jobs" 
ON jobs FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own jobs" 
ON jobs FOR UPDATE 
USING (auth.uid() = employer_id);

CREATE POLICY "Users can delete own jobs" 
ON jobs FOR DELETE 
USING (auth.uid() = employer_id);

-- Create job_applications table (optional, for internal applying)
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can see their own applications
CREATE POLICY "Applicants can view own applications" 
ON job_applications FOR SELECT 
USING (auth.uid() = applicant_id);

-- Employers can see applications for their jobs
CREATE POLICY "Employers can view applications for their jobs" 
ON job_applications FOR SELECT 
USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_applications.job_id AND jobs.employer_id = auth.uid()));

-- Authenticated users can apply
CREATE POLICY "Authenticated users can apply" 
ON job_applications FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');
