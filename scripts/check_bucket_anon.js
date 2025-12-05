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

const supabaseUrl = process.env.VITE_SUPABA
SE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking site-assets bucket accessibility...');

    // Try to list files in the bucket
    // If bucket doesn't exist, this usually returns an error
    const { data, error } = await supabase.storage.from('site-assets').list();

    if (error) {
        console.error('❌ Error accessing bucket:', error.message);
        if (error.message.includes('not found')) {
            console.log('   -> The bucket "site-assets" likely does not exist.');
        } else if (error.message.includes('Policy')) {
            console.log('   -> RLS Policy is blocking access.');
        }
    } else {
        console.log('✅ Bucket "site-assets" is accessible!');
        console.log(`   Found ${data.length} files/folders.`);
    }
}

check();
