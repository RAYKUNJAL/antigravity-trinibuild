-- Create Signed Agreements Table (for "DocuSign" feature)
CREATE TABLE IF NOT EXISTS signed_agreements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  document_type TEXT NOT NULL,
  document_version TEXT NOT NULL,
  signature_data TEXT NOT NULL, -- The text signature
  ip_address TEXT,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Promoter Applications Table
CREATE TABLE IF NOT EXISTS promoter_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  organization_name TEXT NOT NULL,
  event_types TEXT[],
  experience_years TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE signed_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_applications ENABLE ROW LEVEL SECURITY;

-- Policies for Signed Agreements
CREATE POLICY "Users can insert their own agreements" 
ON signed_agreements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own agreements" 
ON signed_agreements FOR SELECT 
USING (auth.uid() = user_id);

-- Policies for Promoter Applications
CREATE POLICY "Users can insert their own application" 
ON promoter_applications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own application" 
ON promoter_applications FOR SELECT 
USING (auth.uid() = user_id);

-- Create 'documents' Storage Bucket for ID uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'documents'
CREATE POLICY "Public Access Documents"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'documents' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'documents' AND auth.uid() = owner );
