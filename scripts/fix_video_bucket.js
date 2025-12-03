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

async function fix() {
    console.log('Attempting to create site-assets bucket...');

    const { data, error } = await supabase.storage.createBucket('site-assets', {
        public: true,
        fileSizeLimit: 524288000, // 500MB
        allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp']
    });

    if (error) {
        console.error('❌ Failed to create bucket:', error.message);
        console.log('\nYou likely need to run the SQL migration manually in the Supabase Dashboard.');
    } else {
        console.log('✅ Successfully created site-assets bucket!');
    }
}

fix();
