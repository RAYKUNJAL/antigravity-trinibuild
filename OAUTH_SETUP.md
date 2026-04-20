# 🔐 Supabase OAuth Configuration Guide

## Setup Social Login Providers

To enable Google, Facebook, and WhatsApp login, you need to configure OAuth providers in your Supabase project.

---

## 🔧 STEP 1: Access Supabase Settings

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `cdprbbyptjdntcrhmwxf`
3. Navigate to **Authentication** → **Providers**

---

## 🔴 GOOGLE LOGIN SETUP

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. For Application type, select **Web application**

### 2. Add Redirect URIs

Add these authorized redirect URIs:
```
https://cdprbbyptjdntcrhmwxf.supabase.co/auth/v1/callback
https://www.trinibuild.com/auth/callback
```

### 3. Copy Credentials

- Copy **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
- Copy **Client Secret**

### 4. Configure in Supabase

1. In Supabase dashboard → **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. Paste your **Client ID**
4. Paste your **Client Secret**
5. Click **Save**

---

## 🔵 FACEBOOK LOGIN SETUP

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** as app type
4. Fill in app details

### 2. Add Facebook Login Product

1. In your app dashboard, click **Add Product**
2. Find **Facebook Login** and click **Set Up**
3. Choose **Web** as platform

### 3. Configure OAuth Redirect URIs

1. Go to **Facebook Login** → **Settings**
2. Add to **Valid OAuth Redirect URIs**:
```
https://cdprbbyptjdntcrhmwxf.supabase.co/auth/v1/callback
```

### 4. Get App Credentials

1. Go to **Settings** → **Basic**
2. Copy **App ID**
3. Copy **App Secret** (click Show)

### 5. Make App Live

1. Toggle app mode from **Development** to **Live**
2. This requires completing App Review for Facebook Login

### 6. Configure in Supabase

1. In Supabase dashboard → **Authentication** → **Providers**
2. Find **Facebook** and toggle it **ON**
3. Paste your **App ID** (as Client ID)
4. Paste your **App Secret** (as Client Secret)
5. Click **Save**

---

## 🟢 WHATSAPP SIGNUP (Alternative Flow)

WhatsApp doesn't have traditional OAuth, so we use a different approach:

### Current Implementation
- User clicks "Sign up with WhatsApp"
- Opens WhatsApp chat with TriniBuild support
- Support sends them a magic link
- User clicks link to complete signup

### To Automate (Phase 2)
1. Set up WhatsApp Business API
2. Use Twilio or MessageBird
3. Auto-send magic links via WhatsApp
4. Track signups in database

For now, the manual flow works for beta testing.

---

## 🔗 REDIRECT URLs CONFIGURATION

Make sure these redirect URLs are whitelisted in Supabase:

1. In Supabase → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
```
https://www.trinibuild.com/*
https://www.trinibuild.com/auth/callback
https://trinibuild.vercel.app/*
http://localhost:3000/*
```

---

## ✅ TESTING THE SETUP

### Test Google Login
1. Go to https://www.trinibuild.com/auth?mode=signup
2. Click "Continue with Google"
3. Should redirect to Google login
4. After approval, should redirect back to /welcome

### Test Facebook Login
1. Go to https://www.trinibuild.com/auth?mode=signup
2. Click "Continue with Facebook"
3. Should redirect to Facebook login
4. After approval, should redirect back to /welcome

### Test Email Signup
1. Go to https://www.trinibuild.com/auth?mode=signup
2. Fill in email and password
3. Check email for confirmation link
4. Click link, should redirect to /welcome

---

## 🐛 TROUBLESHOOTING

### "OAuth configuration not found"
- Check that provider is enabled in Supabase
- Verify Client ID and Secret are correct
- Check redirect URLs match exactly

### "Redirect URI mismatch"
- Add ALL possible redirect URLs to Google/Facebook console
- Make sure to include https://
- No trailing slashes

### Facebook shows "App Not Setup"
- Make sure app is in Live mode (not Development)
- Complete Facebook App Review if needed
- Verify OAuth redirect URIs are correct

### Email confirmation not sending
- Check Supabase email templates
- Verify SMTP settings in Supabase
- Check spam folder

---

## 📊 MONITOR SIGNUPS

Track signups in Supabase:
1. Go to **Authentication** → **Users**
2. See all registered users
3. Check provider (Google, Facebook, Email)
4. Monitor confirmation status

---

## 🎯 NEXT STEPS AFTER AUTH WORKS

1. ✅ Test all 3 login methods
2. Create `/setup` page for store setup wizard
3. Create `/dashboard` page for logged-in users
4. Add middleware for protected routes
5. Set up email templates (welcome, confirmation)

---

## 📞 NEED HELP?

**Google OAuth**: [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
**Facebook Login**: [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
**Supabase Auth**: [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

---

**Once configured, your social login will work perfectly!** 🎉
