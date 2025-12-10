import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(70));
console.log('AUTOMATED ADMIN SETUP');
console.log('='.repeat(70));

// Read environment variables
const envPath = path.resolve(__dirname, '../.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found .env.local file');
} catch (e) {
    console.error('❌ ERROR: .env.local file not found!');
    console.log('\nPlease create .env.local with your Supabase credentials:');
    console.log('VITE_SUPABASE_URL=your_project_url');
    console.log('VITE_SUPABASE_ANON_KEY=your_anon_key');
    process.exit(1);
}

const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

console.log('\n1. Checking Supabase Configuration:');
console.log('   URL:', supabaseUrl || '❌ MISSING');
console.log('   Anon Key:', supabaseAnonKey ? '✅ Present' : '❌ MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\n❌ ERROR: Missing Supabase credentials in .env.local');
    console.log('\nTO FIX:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings → API');
    console.log('4. Copy Project URL and anon key');
    console.log('5. Update .env.local with those values');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAdmin() {
    const adminEmail = 'raykunjal@gmail.com';
    const adminPassword = 'Island4Life12$';

    console.log('\n2. Creating Admin User:');
    console.log('   Email:', adminEmail);

    // Try to sign up
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
            data: {
                full_name: 'Ray Kunjal',
                role: 'admin'
            }
        }
    });

    if (signupError) {
        if (signupError.message.includes('already registered')) {
            console.log('   ℹ️  User already exists, attempting to update...');

            // Try to login to update metadata
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: adminEmail,
                password: adminPassword
            });

            if (loginError) {
                console.error('   ❌ Login failed:', loginError.message);
                console.log('\n   MANUAL FIX REQUIRED:');
                console.log('   1. Go to Supabase Dashboard → Auth → Users');
                console.log('   2. Find user:', adminEmail);
                console.log('   3. Reset password to:', adminPassword);
                console.log('   4. Edit user metadata and add: {"role": "admin"}');
                return false;
            }

            // Update metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { role: 'admin', full_name: 'Ray Kunjal' }
            });

            if (updateError) {
                console.error('   ❌ Metadata update failed:', updateError.message);
                return false;
            }

            console.log('   ✅ User updated with admin role');
            return true;
        } else {
            console.error('   ❌ Signup failed:', signupError.message);
            return false;
        }
    }

    if (signupData.user) {
        console.log('   ✅ Admin user created successfully!');
        console.log('   User ID:', signupData.user.id);
        return true;
    }

    return false;
}

async function verifySetup() {
    console.log('\n3. Verifying Setup:');

    const { data: { user }, error } = await supabase.auth.getUser();

    if (user) {
        console.log('   ✅ Currently logged in as:', user.email);
        console.log('   Role:', user.user_metadata?.role || 'user');

        if (user.user_metadata?.role === 'admin') {
            console.log('\n' + '='.repeat(70));
            console.log('✅ SUCCESS! Admin setup complete!');
            console.log('='.repeat(70));
            console.log('\nYou can now login at: http://localhost:3000/#/admin');
            console.log('Email:', user.email);
            console.log('Password: Island4Life12$');
            console.log('\n');
            return true;
        }
    }

    return false;
}

async function main() {
    try {
        const success = await setupAdmin();

        if (success) {
            await verifySetup();
        } else {
            console.log('\n' + '='.repeat(70));
            console.log('⚠️  SETUP INCOMPLETE');
            console.log('='.repeat(70));
            console.log('\nPlease follow the manual steps in ADMIN_LOGIN_COMPLETE_FIX.md');
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.log('\nPlease check your Supabase credentials and try again.');
    }
}

main();
