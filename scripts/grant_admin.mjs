import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error('Could not read .env.local');
    process.exit(1);
}

const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase keys in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function grantAdmin() {
    const email = 'raykunjal@gmail.com';
    const password = 'Island4Life12$';

    console.log(`Attempting to grant admin access to ${email}...`);

    // 1. Try to Login First
    console.log('Trying to log in...');
    let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    let user = loginData.user;

    if (user) {
        console.log('Login successful.');
    } else {
        console.log('Login failed (' + loginError?.message + '). Trying to sign up...');

        // 2. Try to Sign Up
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: 'Ray Kunjal',
                    role: 'admin'
                }
            }
        });

        if (signupError) {
            console.error('Signup failed:', signupError.message);
            // If it's a database error, it might be the trigger.
            // We can't fix the trigger from here easily without SQL access.
            return;
        }

        user = signupData.user;
        if (user) console.log('Signup successful.');
    }

    if (!user) {
        console.error('Could not authenticate user.');
        return;
    }

    console.log(`User ID: ${user.id}`);
    console.log('Updating role to "admin"...');

    // 3. Update Role
    const update = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

    if (update.error) {
        console.error('Role update failed:', update.error.message);
    } else {
        console.log('SUCCESS! User is now an admin.');
    }
}

grantAdmin();
