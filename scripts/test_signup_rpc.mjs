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

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignupAndRpc() {
    const email = 'raykunjal@gmail.com';
    const password = 'Island4Life12$';
    const secretKey = 'Island4Life12$';

    console.log(`Attempting to SignUp as ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Ray Kunjal',
                role: 'user' // Default role
            }
        }
    });

    if (error) {
        console.log('Signup Result:', error.message);
        if (error.message.includes('already registered')) {
            console.log('User exists. Trying login again...');
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (loginError) {
                console.error('Login failed:', loginError.message);
                return;
            }
            console.log('Login successful.');
            // Proceed to RPC
        } else {
            return;
        }
    } else {
        console.log('Signup successful. User ID:', data.user?.id);
    }

    console.log('Testing assign_admin_role RPC...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('assign_admin_role', {
        target_role: 'admin',
        secret_key: secretKey
    });

    if (rpcError) {
        console.error('RPC Failed:', rpcError.message);
    } else {
        console.log('RPC Result:', rpcData);
    }
}

testSignupAndRpc();
