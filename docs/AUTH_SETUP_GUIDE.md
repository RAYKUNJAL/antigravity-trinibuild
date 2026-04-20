# 🔐 AUTHENTICATION FIX GUIDE - Google Branding + Facebook Login

**Project:** TriniBuild  
**Supabase Project ID:** cdprbbyptjdntcrhmwxf  
**Issue:** Google login showing ugly URL, need custom branding + Facebook login

---

## 🚨 CURRENT PROBLEM

- ❌ Google OAuth shows: `cdprbbyptjdntcrhmwxf.supabase.co`
- ❌ Users see technical Supabase URL instead of "TriniBuild"
- ❌ No Facebook login option
- ❌ Unprofessional authentication experience

---

## ✅ QUICK FIX STEPS

### **PART 1: Fix Google OAuth Branding (15 minutes)**

#### Step 1: Google Cloud Console Setup

**A. Go to OAuth Consent Screen:**
1. Visit: https://console.cloud.google.com/apis/credentials/consent
2. Click "EDIT APP" (or create new project first if needed)

**B. Configure App Branding:**
```
App name: TriniBuild
User support email: your-email@gmail.com
App logo: [Upload TriniBuild logo - 512x512px PNG]
Application home page: https://trinibuild.com
Privacy policy: https://trinibuild.com/privacy
Terms of service: https://trinibuild.com/terms

Authorized domains:
  - trinibuild.com
  - supabase.co

Developer contact: your-email@gmail.com
```

**C. Create OAuth Client ID:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create Credentials → OAuth client ID → Web application
3. Name: `TriniBuild Web Client`

**Authorized JavaScript origins:**
```
https://trinibuild.com
https://www.trinibuild.com
https://cdprbbyptjdntcrhmwxf.supabase.co
```

**Authorized redirect URIs:**
```
https://cdprbbyptjdntcrhmwxf.supabase.co/auth/v1/callback
https://trinibuild.com/auth/callback
https://www.trinibuild.com/auth/callback
```

4. **COPY THE CREDENTIALS:**
   - Client ID: `123456789-abc.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-abc123xyz...`

#### Step 2: Update Supabase

1. Go to: https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/auth/providers
2. Find "Google" → Enable it
3. Paste:
   - Client ID (OAuth 2.0)
   - Client Secret (OAuth 2.0)
4. Click **SAVE**

✅ **RESULT:** Google login will now show "TriniBuild" instead of ugly URL!

---

### **PART 2: Add Facebook Login (15 minutes)**

#### Step 1: Create Facebook App

**A. Go to Facebook Developers:**
1. Visit: https://developers.facebook.com/apps/
2. Create App → Consumer → Continue

**B. App Details:**
```
App name: TriniBuild
App contact email: your-email@gmail.com
```

**C. Add Facebook Login:**
1. Dashboard → Add Product → Facebook Login → Set Up
2. Platform: Web
3. Site URL: `https://trinibuild.com`

**D. Configure Settings:**
1. Left sidebar: Facebook Login → Settings

**Valid OAuth Redirect URIs:**
```
https://cdprbbyptjdntcrhmwxf.supabase.co/auth/v1/callback
https://trinibuild.com/auth/callback
https://www.trinibuild.com/auth/callback
```

2. Click "Save Changes"

**E. Get Credentials:**
1. Settings → Basic
2. **COPY:**
   - App ID: `1234567890123456`
   - App Secret: [Click "Show" to reveal]

**F. Make App Live:**
1. Top right toggle: Switch from "Development" to "Live"
2. Follow privacy policy requirements if prompted

#### Step 2: Update Supabase

1. Go to: https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/auth/providers
2. Find "Facebook" → Enable it
3. Paste:
   - Facebook Client ID (App ID)
   - Facebook Secret (App Secret)
4. Click **SAVE**

✅ **RESULT:** Facebook login button will now work!

---

### **PART 3: Update Frontend Code**

I'll create a beautiful social login component with both Google and Facebook:

**File: `/components/SocialLoginButtons.tsx`**

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabaseClient';

export const SocialLoginButtons: React.FC = () => {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) console.error('Google login error:', error);
  };

  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) console.error('Facebook login error:', error);
  };

  return (
    <div className="space-y-3">
      {/* Google Login */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors font-semibold text-gray-700"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
          <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
          <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
          <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </motion.button>

      {/* Facebook Login */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleFacebookLogin}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors font-semibold"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"/>
        </svg>
        Continue with Facebook
      </motion.button>

      {/* Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500 font-medium">
            or continue with email
          </span>
        </div>
      </div>
    </div>
  );
};
```

---

### **PART 4: Add to Login/Signup Pages**

Update your login page to include the social buttons:

```tsx
import { SocialLoginButtons } from '../components/SocialLoginButtons';

// In your login page component:
<div className="max-w-md mx-auto">
  <h1 className="text-3xl font-black mb-6">Sign In</h1>
  
  {/* Social Login Buttons */}
  <SocialLoginButtons />
  
  {/* Email/password form below... */}
</div>
```

---

## 🎯 EXPECTED RESULTS

### Before Fix:
```
Google Login Screen:
┌─────────────────────────────┐
│ Sign in with Google         │
│                             │
│ cdprbbyptjdntcrhmwxf...     │  ❌ UGLY
│ wants to access your        │
│ Google Account              │
└─────────────────────────────┘
```

### After Fix:
```
Google Login Screen:
┌─────────────────────────────┐
│ Sign in with Google         │
│                             │
│ [TriniBuild Logo]           │  ✅ BRANDED
│ TriniBuild                  │  ✅ CLEAN NAME
│ trinibuild.com              │  ✅ CUSTOM DOMAIN
│                             │
│ wants to access your        │
│ Google Account              │
└─────────────────────────────┘
```

---

## 🔍 TESTING CHECKLIST

After completing setup:

1. **Test Google Login:**
   - [ ] Click "Continue with Google" button
   - [ ] Should see "TriniBuild" (not ugly URL)
   - [ ] Should see your uploaded logo
   - [ ] After auth, redirects back to app
   - [ ] User is logged in

2. **Test Facebook Login:**
   - [ ] Click "Continue with Facebook" button
   - [ ] Facebook auth popup appears
   - [ ] After auth, redirects back to app
   - [ ] User is logged in

3. **Check User Profile:**
   - [ ] User email populated from Google/Facebook
   - [ ] User name populated correctly
   - [ ] Profile picture synced

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: "Redirect URI mismatch"
**Fix:** Make sure ALL these URLs are in BOTH Google Console AND Supabase:
- `https://cdprbbyptjdntcrhmwxf.supabase.co/auth/v1/callback`
- `https://trinibuild.com/auth/callback`
- `https://www.trinibuild.com/auth/callback`

### Issue 2: "App not verified" warning on Google
**Fix:** 
1. Add test users in Google Console
2. OR go through verification process (takes 1-2 weeks)
3. Users can click "Advanced" → "Go to TriniBuild (unsafe)" during testing

### Issue 3: Facebook "App Not Setup"
**Fix:** Make sure app is toggled to "Live" mode (not Development)

### Issue 4: Custom domain not working
**Fix:** Make sure custom domain is:
1. Added to Vercel project
2. DNS configured correctly
3. SSL certificate active

---

## 📝 QUICK REFERENCE

**Supabase Dashboard:**
```
Auth Providers: https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/auth/providers
```

**Google Cloud Console:**
```
OAuth Consent: https://console.cloud.google.com/apis/credentials/consent
Credentials: https://console.cloud.google.com/apis/credentials
```

**Facebook Developers:**
```
My Apps: https://developers.facebook.com/apps/
```

**Vercel Domain Settings:**
```
Domains: https://vercel.com/raykunjal/antigravity-trinibuild/settings/domains
```

---

## ✅ COMPLETION CHECKLIST

- [ ] Google OAuth consent screen configured with "TriniBuild" branding
- [ ] Google OAuth client ID created with correct redirect URIs
- [ ] Google credentials added to Supabase
- [ ] Facebook app created and configured
- [ ] Facebook credentials added to Supabase
- [ ] SocialLoginButtons.tsx component created
- [ ] Social buttons added to login/signup pages
- [ ] Tested Google login - sees "TriniBuild" branding ✅
- [ ] Tested Facebook login - works correctly ✅
- [ ] Custom domain (trinibuild.com) in all redirect URIs
- [ ] Users can successfully sign in with both providers

---

**Next Steps After This Guide:**
1. Complete Google/Facebook setup following steps above
2. I'll create the SocialLoginButtons component
3. Deploy to production
4. Test with real users

**Need help?** Let me know which step you're stuck on!
