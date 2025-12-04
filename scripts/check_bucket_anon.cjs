const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load .env if exists
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const env = require('dotenv').config({ path: envPath }).parsed;
    for (const k in env) process.env[k] = env[k];
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !anonKey) {
    console.error('Missing Supabase URL or anon key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function main() {
    console.log('Listing buckets (public access)...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }
    console.log('Buckets:', buckets.map(b => b.name));
    const exists = buckets.some(b => b.name === 'site-assets');
    if (!exists) {
        console.error('Bucket "site-assets" does NOT exist. Please create it in Supabase dashboard.');
    } else {
        console.log('Bucket "site-assets" exists.');
    }
}

main();
