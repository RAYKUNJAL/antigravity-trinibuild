# Authentication Setup Guide

This guide provides step-by-step instructions for configuring authentication providers in your TriniBuild application.

## Overview

- **Google OAuth**: Free, production-ready
- **Facebook OAuth**: Free, production-ready
- **Email Magic Links**: Free, built into Supabase
- **WhatsApp/SMS**: Requires paid Twilio account

---

## 1. Google OAuth Setup (FREE)

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Select **Web application** as application type
7. Add authorized redirect URIs:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

### Step 2: Get Your Credentials

- Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
- Copy the **Client Secret**

### Step 3: Add to Supabase

1. Open your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Enable **Google**
5. Paste your Client ID and Client Secret
6. Click **Save**

---

## 2. Facebook OAuth Setup (FREE)

### Step 1: Create Facebook App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** > **Create App**
3. Select **Consumer** as app type
4. Fill in app details and create

### Step 2: Add Facebook Login Product

1. In your app dashboard, click **Add Product**
2. Find **Facebook Login** and click **Set Up**
3. Select **Web** as platform
4. Add your site URL: `http://localhost:3000` (for dev)

### Step 3: Configure OAuth Settings

1. Go to **Facebook Login** > **Settings**
2. Add Valid OAuth Redirect URIs:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback`
3. Save changes

### Step 4: Get Your Credentials

1. Go to **Settings** > **Basic**
2. Copy **App ID**
3. Copy **App Secret** (click Show)

### Step 5: Add to Supabase

1. Open Supabase Dashboard
2. Go to **Authentication** > **Providers**
3. Enable **Facebook**
4. Paste App ID and App Secret
5. Click **Save**

---

## 3. Email Magic Links (FREE - Already Enabled)

Magic links are enabled by default in Supabase. No additional setup required!

### How It Works:
1. User enters email address
2. Receives secure link via email
3. Clicks link to authenticate
4. Automatically logged in

### Configuration (Optional):
- Go to **Authentication** > **Email Templates** to customize emails
- Adjust link expiration time in **Settings**

---

## 4. WhatsApp/SMS Authentication (PAID - Twilio Required)

### Step 1: Create Twilio Account

1. Go to [Twilio](https://www.twilio.com/)
2. Sign up for an account
3. Verify your phone number
4. Note: Free trial includes limited credits

### Step 2: Get Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Copy **Account SID**
3. Copy **Auth Token**
4. Get a phone number:
   - Navigate to **Phone Numbers** > **Manage** > **Buy a number**
   - Select a number with SMS capabilities
   - Copy the phone number

### Step 3: Configure Twilio Verify (Recommended)

1. Go to **Verify** > **Services** in Twilio Console
2. Create a new Verify Service
3. Copy the **Service SID**
4. Enable SMS and WhatsApp channels

### Step 4: Add to Supabase

1. Open Supabase Dashboard
2. Go to **Authentication** > **Providers**
3. Enable **Phone**
4. Select **Twilio** as SMS provider
5. Enter:
   - Account SID
   - Auth Token
   - Verify Service SID (if using Verify API)
   - Or: Phone Number and Messaging Service SID
6. Click **Save**

### Pricing Note:
- SMS: ~$0.0075 per message
- WhatsApp: ~$0.005 per message
- Verify API: ~$0.05 per verification

---

## 5. Environment Variables

Add these to your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Custom redirect URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Testing Your Setup

### Google/Facebook OAuth:
1. Click the respective login button
2. Should redirect to provider's login page
3. After authorization, redirects back to your app
4. User should be logged in

### Email Magic Link:
1. Enter email address
2. Check email inbox
3. Click the magic link
4. Should be logged in automatically

### WhatsApp/SMS:
1. Enter phone number
2. Receive verification code
3. Enter code
4. Should be logged in

---

## Troubleshooting

### Common Issues:

**"Invalid redirect URI"**
- Verify URIs exactly match in provider console and Supabase
- Include protocol (http:// or https://)
- No trailing slashes

**"App not verified" (Google)**
- Complete OAuth consent screen configuration
- Add test users in development mode

**"Configuration error"**
- Double-check Client ID/Secret are correct
- Ensure no extra spaces when pasting
- Verify provider is enabled in Supabase

**SMS not sending**
- Verify Twilio account is active
- Check phone number is verified
- Ensure sufficient balance
- Check Twilio logs for errors

---

## Production Checklist

- [ ] Update redirect URIs with production domain
- [ ] Verify OAuth apps in production mode (Google/Facebook)
- [ ] Set up custom email templates
- [ ] Configure rate limiting
- [ ] Enable MFA (multi-factor authentication)
- [ ] Set up monitoring/alerts for auth failures
- [ ] Review Twilio spending limits (if using SMS)

---

## Support Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Twilio Verify API](https://www.twilio.com/docs/verify/api)

---

**Ready to launch!** Once you've configured at least one provider, your authentication system is production-ready.