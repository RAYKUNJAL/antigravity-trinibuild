import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log('Testing Upload to site-assets...');

    const fileName = `test_${Date.now()}.png`;
    // Create a minimal valid PNG buffer (1x1 pixel) to avoid mime type validation issues if strict
    const fileContent = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');

    const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, fileContent, {
            contentType: 'image/png',
            upsert: true
        });

    if (error) {
        console.error('❌ Upload FAILED:', error.message);
        if (error.statusCode === '404') {
            console.error('   (Bucket likely does not exist)');
        }
    } else {
        console.log('✅ Upload SUCCESS:', data);
        console.log('   Path:', data.path);

        // Clean up
        const { error: rmError } = await supabase.storage.from('site-assets').remove([fileName]);
        if (rmError) console.error('Warning: Failed to cleanup test file:', rmError.message);
        else console.log('✅ Cleanup SUCCESS');
    }
}

testUpload();
