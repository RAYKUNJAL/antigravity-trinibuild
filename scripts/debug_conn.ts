
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getEnvVars() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return {};
        const content = fs.readFileSync(envPath, 'utf-8');
        const env: Record<string, string> = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        });
        return env;
    } catch { return {}; }
}

const env = getEnvVars();
const supabase = createClient(
    env['VITE_SUPABASE_URL'] || '',
    env['VITE_SUPABASE_ANON_KEY'] || ''
);

const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];
console.log('Has Service Key:', !!serviceKey);

async function test() {
    console.log('Testing connection (Anon)...');
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) {
        console.log('ERROR_NAME:', error.code || error.name);
        console.log('ERROR_MSG:', error.message);
    } else {
        console.log('SUCCESS (Anon)');
    }

    if (serviceKey) {
        console.log('Testing connection (Service Role)...');
        const adminSupabase = createClient(env['VITE_SUPABASE_URL'] || '', serviceKey);
        // Service role bypasses RLS, so this should work even with recursion error in policy
        const { data: adminData, error: adminError } = await adminSupabase.from('profiles').select('count');
        if (adminError) {
            console.log('ADMIN_ERROR:', adminError.message);
        } else {
            console.log('SUCCESS (Service Role) - Count:', adminData[0]?.count);

            // IF we have service role, let's fix the recursion!
            // We can't run raw SQL easily without a postgres client or specific extensive Rpc
            // But if we can, we would. Supabase JS client doesn't support raw SQL unless via rpc call to a function that runs SQL.
        }
    }
}

test();
