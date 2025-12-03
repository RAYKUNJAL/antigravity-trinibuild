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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing Video System...\n');

// Test 1: Check table schema
console.log('1️⃣  Checking video_placements table schema...');
const { data: schemaData, error: schemaError } = await supabase
    .from('video_placements')
    .select('*')
    .limit(0);

if (schemaError) {
    console.error('❌ Table access error:', schemaError.message);
} else {
    console.log('✅ Table exists and is accessible');
}

// Test 2: Try to insert a test video (requires auth)
console.log('\n2️⃣  Testing video placement insert...');
const testVideo = {
    page: 'home',
    section: 'hero',
    video_url: 'https://example.com/test.mp4',
    title: 'Test Video',
    sort_order: 9999,
    is_youtube: false,
    active: false
};

const { data: insertData, error: insertError } = await supabase
    .from('video_placements')
    .insert([testVideo])
    .select();

if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    if (insertError.message.includes('row-level security')) {
        console.log('   ⚠️  This is expected if you\'re not logged in as admin');
        console.log('   ℹ️  Please run the migration: supabase/migrations/19_fix_video_placements_final.sql');
    }
} else {
    console.log('✅ Insert successful');
    console.log('   Video ID:', insertData[0].id);

    // Cleanup
    const { error: deleteError } = await supabase
        .from('video_placements')
        .delete()
        .eq('id', insertData[0].id);

    if (deleteError) {
        console.log('   ⚠️  Cleanup failed (you may need to manually delete test record)');
    } else {
        console.log('✅ Cleanup successful');
    }
}

// Test 3: Storage upload
console.log('\n3️⃣  Testing storage upload to site-assets...');
const fileName = `test_${Date.now()}.png`;
const fileContent = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');

const { data: uploadData, error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(fileName, fileContent, {
        contentType: 'image/png',
        upsert: true
    });

if (uploadError) {
    console.error('❌ Upload failed:', uploadError.message);
    if (uploadError.message.includes('Bucket not found')) {
        console.log('   ℹ️  Please run the migration: supabase/migrations/19_fix_video_placements_final.sql');
    }
} else {
    console.log('✅ Upload successful');
    console.log('   Path:', uploadData.path);

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

    console.log('   URL:', urlData.publicUrl);

    // Cleanup
    const { error: rmError } = await supabase.storage
        .from('site-assets')
        .remove([fileName]);

    if (rmError) {
        console.log('   ⚠️  Cleanup failed');
    } else {
        console.log('✅ Cleanup successful');
    }
}

// Summary
console.log('\n📊 Summary:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (!schemaError && !uploadError) {
    console.log('✅ Storage: Working');
    console.log('✅ Table: Accessible');
    if (insertError) {
        console.log('⚠️  Insert: Requires authentication');
        console.log('\n🔧 Next steps:');
        console.log('1. Run migration: supabase/migrations/19_fix_video_placements_final.sql');
        console.log('2. Log in to admin dashboard');
        console.log('3. Try uploading a video');
    } else {
        console.log('✅ Insert: Working');
        console.log('\n🎉 Video system is fully operational!');
    }
} else {
    console.log('❌ System has issues - please run migration');
}
