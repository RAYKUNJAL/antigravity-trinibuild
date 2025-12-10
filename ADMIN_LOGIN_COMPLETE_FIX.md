# ADMIN LOGIN FIX - Complete Guide

## The Problem
You're getting "Invalid login credentials" because either:
1. The Supabase URL/keys in your `.env.local` don't match your actual Supabase project
2. No admin user exists in your Supabase Auth system
3. The user exists but the password is wrong

## SOLUTION - Follow These Steps Exactly

### STEP 1: Verify Supabase Credentials

1. **Open your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your TriniBuild project**
3. **Go to**: Project Settings (⚙️) → API
4. **Copy these values**:
   - Project URL (e.g., `https://cdprbbyptjdntcrhmwxf.supabase.co`)
   - anon/public key (starts with `eyJ...`)

### STEP 2: Update Your .env.local File

1. **Open**: `c:\Users\RAY\OneDrive\Documents\Trinibuild\.env.local`
2. **Replace with** (use YOUR actual values from Step 1):

```env
VITE_SUPABASE_URL=https://cdprbbyptjdntcrhmwxf.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_from_dashboard
```

3. **Save the file**
4. **Restart your dev server**: Stop `npm run dev` and run it again

### STEP 3: Create Admin User in Supabase

Since the trigger is now removed, we need to manually create an admin user:

1. **Go to**: Supabase Dashboard → Authentication → Users
2. **Click**: "Add User" → "Create new user"
3. **Fill in**:
   - Email: `raykunjal@gmail.com`
   - Password: `Island4Life12$`
   - Auto Confirm User: ✅ **CHECK THIS BOX**
4. **Click**: "Create user"

### STEP 4: Add Admin Role to User Metadata

After creating the user:

1. **In the Users list**, click on the user you just created
2. **Scroll to**: "User Metadata" section
3. **Click**: "Edit" or the pencil icon
4. **Add this JSON**:
```json
{
  "role": "admin",
  "full_name": "Ray Kunjal"
}
```
5. **Save**

### STEP 5: Test Login

1. **Go to**: http://localhost:3000/#/admin
2. **Click**: "Login" tab (NOT "New Admin")
3. **Enter**:
   - Email: `raykunjal@gmail.com`
   - Password: `Island4Life12$`
4. **Click**: "Login to Dashboard"

You should now be redirected to the admin command center!

---

## Alternative: Use SQL to Create Admin User

If the dashboard method doesn't work, run this in Supabase SQL Editor:

```sql
-- This creates a user with admin role in metadata
-- Replace the email and password with your desired values

-- Note: You'll need to use Supabase Dashboard to create the auth user first,
-- then run this to add the metadata:

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'raykunjal@gmail.com';
```

---

## Troubleshooting

### "Invalid login credentials" persists
- Double-check the email and password match exactly
- Verify "Auto Confirm User" was checked when creating the user
- Try resetting the password in Supabase Dashboard

### "Unauthorized: You do not have admin access"
- The user exists but doesn't have admin role in metadata
- Go back to Step 4 and add the role to user metadata

### Still not working?
Run the diagnostic:
```bash
# In your project directory
npm run dev
# Then open browser console and check for Supabase connection errors
```

---

## What We Changed

The app now stores admin role in 3 places (in priority order):
1. **Supabase Auth user metadata** (most reliable)
2. **localStorage** (for quick access)
3. **profiles table** (if it exists)

This means even if the `profiles` table is broken, admin login will work as long as the user has `role: "admin"` in their Supabase Auth metadata.
