-- Migration: Enhanced Legal Signatures Tracking
-- Version: 11
-- Purpose: Add service-type tracking and metadata for comprehensive legal compliance

-- Enhance the signed_agreements table
ALTER TABLE signed_agreements 
ADD COLUMN IF NOT EXISTS service_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create index for fast service-based lookups
CREATE INDEX IF NOT EXISTS idx_signatures_service 
ON signed_agreements(user_id, service_type, document_type);

-- Create index for document type lookups
CREATE INDEX IF NOT EXISTS idx_signatures_document 
ON signed_agreements(document_type, document_version);

-- Add comments for documentation
COMMENT ON COLUMN signed_agreements.service_type IS 'Service area: marketplace, rideshare, real-estate, ticketing, jobs';
COMMENT ON COLUMN signed_agreements.ip_address IS 'IP address at time of signature';
COMMENT ON COLUMN signed_agreements.user_agent IS 'Browser user agent at time of signature';

-- Create materialized view for compliance dashboard (admin use)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_compliance_status AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT sa.document_type) as documents_signed,
  ARRAY_AGG(DISTINCT sa.service_type) as services_registered,
  MAX(sa.signed_at) as last_signature_date
FROM auth.users u
LEFT JOIN signed_agreements sa ON u.id = sa.user_id
GROUP BY u.id, u.email;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_compliance_user 
ON user_compliance_status(user_id);

-- Function to refresh compliance view (call from admin dashboard)
CREATE OR REPLACE FUNCTION refresh_compliance_status()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_compliance_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
