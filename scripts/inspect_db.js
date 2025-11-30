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

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    console.log('Inspecting Database...');

    // List all tables (using a trick or just checking common ones if listing isn't allowed via API easily without admin key)
    // Actually, we can't easily list tables with anon key unless we have a function for it.
    // But we can try to select from the ones the user mentioned.

    const tablesToCheck = ['jobs', 'gig_jobs', 'rides', 'real_estate_listings', 'drivers'];

    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (!error) {
            console.log(`✅ Table '${table}' exists and is accessible.`);
        } else {
            console.log(`❌ Table '${table}' error: ${error.message}`);
        }
    }

    console.log('\nInspecting Storage Buckets...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
        console.error('Error listing buckets:', storageError.message);
    } else {
        if (buckets.length === 0) {
            console.log('No buckets found.');
        } else {
            buckets.forEach(b => console.log(`- Bucket: ${b.name} (public: ${b.public})`));
        }
    }
}

inspect();
