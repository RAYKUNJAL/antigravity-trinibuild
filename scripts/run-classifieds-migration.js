import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Also try .env.local if not found
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing credentials in .env');
    process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    try {
        const migrationPath = path.join(__dirname, '../supabase/migrations/30_classifieds_system.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log('Running Migration 30...');

        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
            const { error } = await supabase.rpc('exec_sql', { sql_string: statement });
            if (error) {
                console.warn('  -> Failed:', error.message);
            } else {
                console.log('  -> Success');
            }
        }
        console.log('Migration Complete.');
    } catch (e) {
        console.error('Script Error:', e);
    }
}

run();
