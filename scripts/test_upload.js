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
    console.log('🧪 Testing Video Upload...');

    // Create a dummy video file (text content but .mp4 extension)
    const dummyContent = 'fake video content';
    const fileName = `test_video_${Date.now()}.mp4`;
    const filePath = `videos/${fileName}`;

    // Convert string to buffer/blob for upload
    const fileBuffer = Buffer.from(dummyContent, 'utf-8');

    console.log(`Attempting to upload ${fileName} to site-assets bucket...`);

    const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(filePath, fileBuffer, {
            contentType: 'video/mp4',
            upsert: false
        });

    if (error) {
        console.error('❌ Upload Failed:', error);
        console.error('Error Message:', error.message);

        if (error.message.includes('new row violates row-level security policy')) {
            console.log('\n💡 DIAGNOSIS: RLS Policy Error');
            console.log('The "Authenticated users can upload site-assets" policy might be failing.');
            console.log('Are you logged in? (This script runs as anonymous/public unless we sign in)');
        }
    } else {
        console.log('✅ Upload Successful!');
        console.log('Path:', data.path);

        // Clean up
        console.log('Cleaning up...');
        await supabase.storage.from('site-assets').remove([filePath]);
    }
}

testUpload();
