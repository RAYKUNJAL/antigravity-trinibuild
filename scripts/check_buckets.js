
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; // Try service key first for admin rights

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBuckets() {
    console.log('Checking Supabase Storage Buckets...');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    console.log(`Found ${buckets.length} buckets:`);
    buckets.forEach(b => {
        console.log(`- Name: ${b.name}`);
        console.log(`  Public: ${b.public}`);
        console.log(`  Created: ${b.created_at}`);
        console.log('---');
    });

    const siteAssets = buckets.find(b => b.name === 'site-assets');
    if (siteAssets) {
        console.log('✅ "site-assets" bucket exists.');
    } else {
        console.error('❌ "site-assets" bucket NOT found!');
    }
}

checkBuckets();
