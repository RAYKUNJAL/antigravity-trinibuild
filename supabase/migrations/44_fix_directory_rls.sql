-- Fix Directory Page - Add RLS Policy for Stores Table
-- This allows anonymous users to view active stores in the directory

-- Enable RLS on stores table (if not already enabled)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous read access to active stores" ON public.stores;

-- Create policy to allow anonymous users to SELECT active stores
CREATE POLICY "Allow anonymous read access to active stores"
ON public.stores
FOR SELECT
TO anon
USING (status = 'active');

-- Also allow authenticated users to read all stores
DROP POLICY IF EXISTS "Allow authenticated users to read stores" ON public.stores;

CREATE POLICY "Allow authenticated users to read stores"
ON public.stores
FOR SELECT
TO authenticated
USING (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'stores';
