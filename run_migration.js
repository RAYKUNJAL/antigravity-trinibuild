const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Applying Store Builder V2 Migration...\n');

    const migration = `
        ALTER TABLE public.stores
        ADD COLUMN IF NOT EXISTS tagline TEXT,
        ADD COLUMN IF NOT EXISTS logo_style TEXT,
        ADD COLUMN IF NOT EXISTS vibe TEXT[],
        ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS delivery_options TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS font_pair JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS color_scheme JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
    `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: migration });

        if (error) {
            console.error('❌ Migration failed:', error.message);
            console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
            console.log(migration);
            process.exit(1);
        }

        console.log('✅ Migration applied successfully!');

        // Verify columns
        const { data: columns, error: verifyError } = await supabase
            .from('stores')
            .select('*')
            .limit(1);

        if (!verifyError) {
            console.log('✅ Verified: stores table updated');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.log('\n📋 Manual Migration Required:');
        console.log('1. Go to Supabase Dashboard > SQL Editor');
        console.log('2. Run the SQL from: apply_store_v2_migration.sql');
    }
}

runMigration();
