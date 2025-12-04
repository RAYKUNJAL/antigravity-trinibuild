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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase URL or Service key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    console.log('Listing buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }
    console.log('Buckets:', buckets.map(b => b.name));
    const exists = buckets.some(b => b.name === 'site-assets');
    if (!exists) {
        console.log('Creating "site-assets" bucket...');
        const { data, error: createErr } = await supabase.storage.createBucket('site-assets', { public: true });
        if (createErr) console.error('Create bucket error:', createErr);
        else console.log('Bucket created:', data);
    } else {
        console.log('Bucket "site-assets" already exists');
    }
}

main();
