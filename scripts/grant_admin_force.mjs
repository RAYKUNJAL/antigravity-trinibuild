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
    // process.exit(1); 
    // Don't exit, maybe we can find keys elsewhere?
}

const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SERVICE_ROLE_KEY');

console.log('Keys found:');
console.log('URL:', supabaseUrl ? 'Yes' : 'No');
console.log('Anon Key:', supabaseAnonKey ? 'Yes' : 'No');
console.log('Service Role Key:', serviceRoleKey ? 'Yes' : 'No');

if (!supabaseUrl || !serviceRoleKey) {
    console.log('Service Role Key not found. Cannot force admin access without it.');
    process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function forceGrantAdmin() {
    const email = 'raykunjal@gmail.com';
    const password = 'Island4Life12$';

    console.log(`Force granting admin access to ${email} using Service Role...`);

    // 1. Check if user exists
    // admin.listUsers() is paginated, better to create and catch error, or update.
    // admin.createUser() will fail if exists.

    let userId = '';

    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Ray Kunjal' }
    });

    if (createError) {
        console.log('Create User Result:', createError.message);
        if (createError.message.includes('already registered') || createError.message.includes('Database error')) {
            // User might exist. Let's try to find their ID.
            // We can't easily "find" by email with admin API without listing.
            // But we can try listUsers with filter.
            // Actually, listUsers doesn't support email filter in older versions.
            // But we can just try to UPDATE the user by email? No, update requires ID.

            // Let's list users and find the email.
            const { data: users, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
                console.error('List users failed:', listError);
                return;
            }

            const existingUser = users.users.find(u => u.email === email);
            if (existingUser) {
                console.log('Found existing user:', existingUser.id);
                userId = existingUser.id;

                // Update password
                const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
                    password: password,
                    user_metadata: { full_name: 'Ray Kunjal' }
                });

                if (updateAuthError) {
                    console.error('Failed to update password:', updateAuthError);
                } else {
                    console.log('Password updated successfully.');
                }
            } else {
                console.error('Could not find user even though create failed. Maybe soft deleted?');
                return;
            }
        } else {
            console.error('Failed to create user:', createError);
            return;
        }
    } else {
        console.log('User created successfully.');
        userId = createdUser.user.id;
    }

    if (!userId) return;

    // 2. Update Profile Role
    // With service role key, we bypass RLS.
    const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

    if (updateProfileError) {
        // If profile doesn't exist (trigger failed?), insert it.
        console.log('Update profile failed or no rows affected. Trying upsert...');
        const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                full_name: 'Ray Kunjal',
                role: 'admin'
            });

        if (upsertError) {
            console.error('Profile upsert failed:', upsertError);
        } else {
            console.log('SUCCESS! User profile upserted as admin.');
        }
    } else {
        console.log('SUCCESS! User role updated to admin.');
    }
}

forceGrantAdmin();
