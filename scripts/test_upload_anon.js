import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log('Testing upload to site-assets with ANON key...');

    const fileName = `test_upload_${Date.now()}.txt`;
    const fileContent = 'This is a test file to verify upload permissions.';

    // Create a Blob-like object for node (Supabase js client in node supports Buffer or string)
    const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, fileContent, {
            contentType: 'text/plain',
            upsert: true
        });

    if (error) {
        console.error('❌ Upload FAILED:', error.message);
        console.error('   Details:', error);
    } else {
        console.log('✅ Upload SUCCESSFUL!');
        console.log('   Path:', data.path);

        // Clean up
        await supabase.storage.from('site-assets').remove([fileName]);
        console.log('   (Test file cleaned up)');
    }
}

testUpload();
