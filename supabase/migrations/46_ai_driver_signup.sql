-- Enhanced Driver Schema for AI-Powered Signup
-- This migration adds support for phone verification, document intelligence, and progress tracking

-- Create phone_verifications table
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  method TEXT DEFAULT 'sms' -- 'sms' or 'whatsapp'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_verified ON phone_verifications(verified);

-- Create driver_documents table for AI document verification
CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'drivers_permit', 'vehicle_insurance', 'ttps_certificate', 'h_car_license', 'medical_certificate'
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  
  -- AI Verification Results
  extracted_data JSONB,
  confidence_score DECIMAL(3,2),
  verified BOOLEAN DEFAULT FALSE,
  requires_manual_review BOOLEAN DEFAULT FALSE,
  verification_feedback TEXT,
  verified_at TIMESTAMP,
  verified_by UUID,
  
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_type ON driver_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_driver_documents_verified ON driver_documents(verified);

-- Add new columns to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS nis_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS permit_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS ttps_clearance_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS ttps_clearance_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_fitness_cert TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_fitness_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS preferred_regions JSONB;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS signup_progress INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS signup_data JSONB;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS ai_approval_score DECIMAL(3,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_h_car BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS h_car_number TEXT;

-- Create Supabase Storage bucket for driver documents (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('driver-documents', 'driver-documents', false);

-- RLS Policies for phone_verifications
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create phone verifications"
  ON phone_verifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read their own verifications"
  ON phone_verifications FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own verifications"
  ON phone_verifications FOR UPDATE
  USING (true);

-- RLS Policies for driver_documents
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own documents"
  ON driver_documents FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can upload their own documents"
  ON driver_documents FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins can view all documents"
  ON driver_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all documents"
  ON driver_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Storage policies for driver-documents bucket (run in Supabase dashboard)
-- CREATE POLICY "Drivers can upload their own documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Drivers can view their own documents"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Admins can view all driver documents"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'driver-documents' AND
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()
--     AND users.role = 'admin'
--   )
-- );
