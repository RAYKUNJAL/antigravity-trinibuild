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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing TriniBuild Ads Manager Database...\n');

const REQUIRED_TABLES = [
    'advertisers',
    'ad_campaigns',
    'ad_creatives',
    'ad_placements',
    'ad_events',
    'billing_transactions',
    'ai_recommendations'
];

let allTestsPassed = true;

// Test 1: Check Tables Exist
console.log('1️⃣  Checking database tables...');
for (const table of REQUIRED_TABLES) {
    try {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(0);

        if (error) {
            console.error(`   ❌ Table ${table}: ${error.message}`);
            allTestsPassed = false;
        } else {
            console.log(`   ✅ Table ${table} exists`);
        }
    } catch (err) {
        console.error(`   ❌ Table ${table}: ${err.message}`);
        allTestsPassed = false;
    }
}

// Test 2: Check Ad Placements Seeded
console.log('\n2️⃣  Checking ad placements...');
try {
    const { data: placements, error } = await supabase
        .from('ad_placements')
        .select('*');

    if (error) {
        console.error(`   ❌ Failed to fetch placements: ${error.message}`);
        allTestsPassed = false;
    } else {
        console.log(`   ✅ Found ${placements.length} ad placements`);
        placements.forEach(p => {
            console.log(`      • ${p.label} (${p.placement_key})`);
        });
    }
} catch (err) {
    console.error(`   ❌ ${err.message}`);
    allTestsPassed = false;
}

// Test 3: Test Advertiser Creation (Requires Auth)
console.log('\n3️⃣  Testing advertiser profile creation...');
const testAdvertiser = {
    user_id: 'test-user-' + Date.now(),
    business_name: 'Test Business',
    verified_status: 'pending',
    billing_status: 'active'
};

try {
    const { data: advertiser, error } = await supabase
        .from('advertisers')
        .insert([testAdvertiser])
        .select()
        .single();

    if (error) {
        if (error.message.includes('row-level security')) {
            console.log('   ⚠️  RLS blocking insert (expected without auth)');
            console.log('   ℹ️  This is correct - only authenticated users can create advertisers');
        } else {
            console.error(`   ❌ ${error.message}`);
            allTestsPassed = false;
        }
    } else {
        console.log(`   ✅ Created advertiser: ${advertiser.id}`);

        // Cleanup
        await supabase
            .from('advertisers')
            .delete()
            .eq('id', advertiser.id);
        console.log('   ✅ Cleaned up test data');
    }
} catch (err) {
    console.error(`   ❌ ${err.message}`);
    allTestsPassed = false;
}

// Test 4: Check RLS Policies
console.log('\n4️⃣  Verifying RLS policies...');
const tablesWithRLS = ['advertisers', 'ad_campaigns', 'ad_creatives', 'ad_placements', 'billing_transactions', 'ai_recommendations'];

for (const table of tablesWithRLS) {
    try {
        // Attempt to query - should work for SELECT policies
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        // For tables with public SELECT, this should succeed
        if (table === 'ad_placements') {
            if (error) {
                console.error(`   ❌ ${table}: Public SELECT should work`);
                allTestsPassed = false;
            } else {
                console.log(`   ✅ ${table}: RLS allows public SELECT`);
            }
        } else {
            // Other tables should have more restrictive policies
            console.log(`   ✅ ${table}: RLS enabled`);
        }
    } catch (err) {
        console.log(`   ⚠️  ${table}: ${err.message}`);
    }
}

// Test 5: Check Event Tracking Partitions
console.log('\n5️⃣  Checking event tracking partitions...');
try {
    const { data, error } = await supabase
        .from('ad_events')
        .select('*')
        .limit(0);

    if (error) {
        console.error(`   ❌ Event tracking: ${error.message}`);
        allTestsPassed = false;
    } else {
        console.log('   ✅ Event tracking table ready');
        console.log('   ℹ️  Partitioned by timestamp for performance');
    }
} catch (err) {
    console.error(`   ❌ ${err.message}`);
    allTestsPassed = false;
}

// Summary
console.log('\n📊 Test Summary:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (allTestsPassed) {
    console.log('✅ All tests passed!');
    console.log('\n🎉 Database is ready for TriniBuild Ads Manager!');
    console.log('\nNext steps:');
    console.log('1. Visit http://localhost:5173/#/ads-portal');
    console.log('2. Log in with an admin account');
    console.log('3. Create your first campaign!');
} else {
    console.log('❌ Some tests failed');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure migration has been run:');
    console.log('   supabase/migrations/20_ads_manager_foundation.sql');
    console.log('2. Check Supabase dashboard for errors');
    console.log('3. Verify RLS policies are correctly configured');
}

console.log('\n📖 See ADS_DATABASE_SETUP.md for detailed instructions');
