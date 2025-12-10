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
} catch (e) { }

const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    const email = 'raykunjal@gmail.com';
    const password = 'Island4Life12$';
    const secretKey = 'Island4Life12$';

    console.log(`Logging in as ${email}...`);

    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('Login failed:', loginError.message);
        return;
    }

    if (!user) {
        console.error('Login succeeded but no user returned.');
        return;
    }

    console.log('Login successful. User ID:', user.id);
    console.log('Testing assign_admin_role RPC...');

    const { data, error } = await supabase.rpc('assign_admin_role', {
        target_role: 'admin',
        secret_key: secretKey
    });

    if (error) {
        console.error('RPC Failed:', error.message);
        console.error('Details:', error);
    } else {
        console.log('RPC Result:', data);
        if (data.success) {
            console.log('SUCCESS: Admin role assigned via RPC.');
        } else {
            console.log('FAILURE: RPC returned success=false. Message:', data.message);
        }
    }
}

testRpc();
