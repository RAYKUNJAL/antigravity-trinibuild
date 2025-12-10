import { supabase } from './services/supabaseClient';

/**
 * SUPABASE CONFIGURATION DIAGNOSTIC
 * 
 * This will help identify if your Supabase credentials are correct
 */

async function diagnoseSupabase() {
    console.log('='.repeat(60));
    console.log('SUPABASE CONFIGURATION DIAGNOSTIC');
    console.log('='.repeat(60));

    // 1. Check environment variables
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('\n1. Environment Variables:');
    console.log('   URL:', url || '❌ MISSING');
    console.log('   Anon Key:', key ? '✅ Present (length: ' + key.length + ')' : '❌ MISSING');

    if (!url || !key) {
        console.error('\n❌ ERROR: Missing Supabase credentials in .env.local');
        console.log('\nTO FIX:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Click on Project Settings → API');
        console.log('3. Copy the Project URL and anon/public key');
        console.log('4. Create/update .env.local with:');
        console.log('   VITE_SUPABASE_URL=your_project_url');
        console.log('   VITE_SUPABASE_ANON_KEY=your_anon_key');
        return;
    }

    // 2. Test connection
    console.log('\n2. Testing Connection:');
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('   ❌ Connection failed:', error.message);
        } else {
            console.log('   ✅ Connection successful');
            console.log('   Current session:', data.session ? 'Logged in' : 'Not logged in');
        }
    } catch (e: any) {
        console.error('   ❌ Connection error:', e.message);
    }

    // 3. Test auth
    console.log('\n3. Testing Auth System:');
    try {
        // Try to get user (will fail if not logged in, but that's ok)
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user) {
            console.log('   ✅ Currently logged in as:', user.email);
            console.log('   User ID:', user.id);
            console.log('   Metadata:', user.user_metadata);
        } else {
            console.log('   ℹ️  Not currently logged in (this is normal)');
        }
    } catch (e: any) {
        console.error('   ❌ Auth error:', e.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('NEXT STEPS:');
    console.log('='.repeat(60));
    console.log('\n1. If credentials are missing, update .env.local');
    console.log('2. If connection fails, verify URL and key match your Supabase project');
    console.log('3. Create a test user in Supabase Dashboard → Auth → Users');
    console.log('4. Try logging in with that user');
    console.log('\n');
}

// Run diagnostic
diagnoseSupabase();
