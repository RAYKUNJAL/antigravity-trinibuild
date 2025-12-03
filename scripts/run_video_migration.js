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
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🔧 Running video_placements migration...\n');

    const migrationPath = path.resolve(__dirname, '../supabase/migrations/19_fix_video_placements_final.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    try {
        // Split SQL into individual statements and execute them
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 60)}...`);
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

            if (error) {
                console.error(`❌ Error:`, error.message);
                // Continue with other statements
            } else {
                console.log('✅ Success');
            }
        }

        console.log('\n✅ Migration completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Log in to the admin dashboard at https://www.trinibuild.com/#/admin');
        console.log('2. Navigate to Video Manager');
        console.log('3. Try uploading a video');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
