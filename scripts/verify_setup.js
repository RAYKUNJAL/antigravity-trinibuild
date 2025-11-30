import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually since dotenv.config() defaults to .env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn('No .env.local file found, trying .env');
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying Supabase Setup...');

    // 1. Check Jobs Table
    const { error: jobsError } = await supabase.from('jobs').select('id').limit(1);
    if (jobsError) {
        if (jobsError.code === '42P01') { // undefined_table
            console.error('❌ Jobs table does not exist.');
        } else {
            console.error('❌ Error accessing Jobs table:', jobsError.message);
        }
    } else {
        console.log('✅ Jobs table exists.');
    }

    // 2. Check Real Estate Listings Table
    const { error: reError } = await supabase.from('real_estate_listings').select('id').limit(1);
    if (reError) {
        if (reError.code === '42P01') {
            console.error('❌ real_estate_listings table does not exist.');
        } else {
            console.error('❌ Error accessing real_estate_listings table:', reError.message);
        }
    } else {
        console.log('✅ real_estate_listings table exists.');
    }

    // 3. Check Storage Bucket
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
        console.error('❌ Error accessing storage:', storageError.message);
    } else {
        const bucket = buckets.find(b => b.name === 'real-estate');
        if (bucket) {
            console.log('✅ real-estate storage bucket exists.');
        } else {
            console.error('❌ real-estate storage bucket NOT found.');
        }
    }
}

verify();
