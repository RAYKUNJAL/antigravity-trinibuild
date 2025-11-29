
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars manually since we are running a script
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing connection to Supabase...');
    console.log(`URL: ${supabaseUrl}`);

    try {
        // 1. Test basic connection by fetching a public table (or just checking health)
        // We'll try to select from 'rides' to see if the table exists.
        // Even if empty, it should not error if the table exists.
        const { data, error } = await supabase.from('rides').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection failed or Table "rides" not found.');
            console.error('Error details:', error.message);
            console.log('\nTIP: Did you run the "full_schema.sql" in the Supabase SQL Editor?');
        } else {
            console.log('✅ Connection successful!');
            console.log('✅ Table "rides" found.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
