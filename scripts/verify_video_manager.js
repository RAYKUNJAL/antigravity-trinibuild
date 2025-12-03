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

async function verify() {
    console.log('Verifying Video Manager Setup...');
    let allGood = true;

    // 1. Check video_placements Table
    const { error: tableError } = await supabase.from('video_placements').select('id').limit(1);
    if (tableError) {
        if (tableError.code === '42P01') {
            console.error('❌ video_placements table does not exist.');
            allGood = false;
        } else {
            console.error('❌ Error accessing video_placements table:', tableError.message);
            // Might be RLS, but table likely exists
        }
    } else {
        console.log('✅ video_placements table exists.');
    }

    // 2. Check Storage Bucket
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
        console.error('❌ Error accessing storage:', storageError.message);
        allGood = false;
    } else {
        const bucket = buckets.find(b => b.name === 'site-assets');
        if (bucket) {
            console.log('✅ site-assets storage bucket exists.');
        } else {
            console.error('❌ site-assets storage bucket NOT found.');
            allGood = false;
        }
    }

    if (!allGood) {
        console.log('\n⚠️ Setup incomplete. Please run the migration script: supabase/migrations/16_fix_video_manager.sql');
    } else {
        console.log('\n✅ Video Manager setup is complete!');
    }
}

verify();
