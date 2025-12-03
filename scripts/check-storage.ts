import { supabase } from '../services/supabaseClient';

async function checkAndCreateBucket() {
    console.log('🔍 Checking Supabase Storage Configuration...\n');

    try {
        // Step 1: Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('❌ Not authenticated. Please log in first.');
            console.log('   Run this script while logged into the app.\n');
            return;
        }

        console.log(`✅ Authenticated as: ${user.email}`);
        console.log(`   User ID: ${user.id}\n`);

        // Step 2: List all buckets
        console.log('📦 Checking existing buckets...');
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.log('⚠️  Cannot list buckets (this might be normal due to RLS)');
            console.log(`   Error: ${listError.message}\n`);
        } else {
            console.log(`   Found ${buckets?.length || 0} bucket(s):`);
            buckets?.forEach(bucket => {
                console.log(`   - ${bucket.id} (public: ${bucket.public})`);
            });
            console.log('');
        }

        // Step 3: Try to access site-assets bucket specifically
        console.log('🎯 Testing site-assets bucket access...');

        const testFileName = `test_${Date.now()}.txt`;
        const testFile = new File(['test'], testFileName, { type: 'text/plain' });

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('site-assets')
            .upload(`test/${testFileName}`, testFile, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.log('❌ Upload test FAILED');
            console.log(`   Error: ${uploadError.message}`);
            console.log(`   Code: ${(uploadError as any).statusCode || 'N/A'}\n`);

            if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
                console.log('🔧 SOLUTION: The site-assets bucket does not exist or is not accessible.\n');
                console.log('   Please run this SQL in Supabase Dashboard → SQL Editor:\n');
                console.log('   ================================================');
                console.log(`
-- Create site-assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site-assets', 
    'site-assets', 
    true, 
    524288000,
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 524288000,
    allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp'];

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public Access site-assets" ON storage.objects;
CREATE POLICY "Public Access site-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

-- Authenticated upload
DROP POLICY IF EXISTS "Authenticated users can upload site-assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload site-assets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );
                `);
                console.log('   ================================================\n');
            } else if (uploadError.message.includes('policy') || uploadError.message.includes('permission')) {
                console.log('🔧 SOLUTION: RLS policy issue\n');
                console.log('   The bucket exists but you don\'t have permission to upload.\n');
                console.log('   Run this SQL in Supabase Dashboard → SQL Editor:\n');
                console.log('   ================================================');
                console.log(`
-- Fix upload policy
DROP POLICY IF EXISTS "Authenticated users can upload site-assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload site-assets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

-- Allow users to update their own files
DROP POLICY IF EXISTS "Users can update own site-assets" ON storage.objects;
CREATE POLICY "Users can update own site-assets"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'site-assets' AND auth.uid() = owner );

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Users can delete own site-assets" ON storage.objects;
CREATE POLICY "Users can delete own site-assets"
ON storage.objects FOR DELETE
USING ( bucket_id = 'site-assets' AND auth.uid() = owner );
                `);
                console.log('   ================================================\n');
            }
        } else {
            console.log('✅ Upload test SUCCESSFUL!');
            console.log(`   File path: ${uploadData.path}\n`);

            // Clean up test file
            await supabase.storage.from('site-assets').remove([`test/${testFileName}`]);
            console.log('✅ Test file cleaned up\n');

            console.log('🎉 SUCCESS! The site-assets bucket is working correctly!');
            console.log('   You can now upload videos.\n');
        }

    } catch (error: any) {
        console.error('❌ Unexpected error:', error.message);
    }
}

// Auto-run when loaded
checkAndCreateBucket();

// Export for manual use
export { checkAndCreateBucket };
