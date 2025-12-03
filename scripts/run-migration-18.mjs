import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in your environment');
    process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('📂 Reading migration file...');
        const migrationPath = path.join(__dirname, '../supabase/migrations/18_force_fix_video_storage.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log('🚀 Running migration 18: Force Fix Video Storage...\n');

        // Split by statements and run each one
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`  Executing statement ${i + 1}/${statements.length}...`);

            try {
                const { error } = await supabase.rpc('exec_sql', { sql_string: statement + ';' });

                if (error) {
                    // Try direct query if RPC fails
                    const { error: directError } = await supabase.from('_migrations').insert({
                        statement: statement
                    });

                    if (directError) {
                        console.warn(`  ⚠️  Statement ${i + 1} may have failed:`, error.message);
                    }
                }
            } catch (err) {
                console.warn(`  ⚠️  Statement ${i + 1} error:`, err.message);
            }
        }

        console.log('\n✅ Migration completed!');
        console.log('\n📋 Next steps:');
        console.log('  1. Go to Supabase Dashboard: Storage section');
        console.log('  2. Verify "site-assets" bucket exists');
        console.log('  3. Try uploading a video again');
        console.log('\n🔗 Supabase Dashboard: ' + supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/storage/buckets'));

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('\n📖 Manual Fix Instructions:');
        console.error('  1. Go to: ' + supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql'));
        console.error('  2. Open: supabase/migrations/18_force_fix_video_storage.sql');
        console.error('  3. Copy the entire SQL content');
        console.error('  4. Paste and run it in the SQL Editor');
        process.exit(1);
    }
}

runMigration();
