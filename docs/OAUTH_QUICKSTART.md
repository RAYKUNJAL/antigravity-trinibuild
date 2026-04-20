# 🚀 OAUTH QUICK SETUP - 30 MINUTE FIX

## ⚡ FASTEST PATH TO WORKING AUTH

### Google OAuth (15 min)
1. **Google Console** → https://console.cloud.google.com/apis/credentials/consent
   - App name: `TriniBuild`
   - Logo: Upload 512x512 PNG
   - Domain: `trinibuild.com`
   
2. **Create Client ID** → https://console.cloud.google.com/apis/credentials
   - Type: Web application
   - Redirect: `https://cdprbbyptjdntcrhmwxf.supabase.co/auth/v1/callback`
   - Copy: Client ID + Secret
   
3. **Supabase** → https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/auth/providers
   - Enable Google
   - Paste: Client ID + Secret
   - Save

### Facebook OAuth (15 min)
1. **Facebook** → https://developers.facebook.com/apps/
   - Create App → Consumer
   - Name: `TriniBuild`
   
2. **Add Product** → Facebook Login
   - Redirect: `https://cdprbbyptjdntcrhmwxf.supabase.co/auth/v1/callback`
   - Copy: App ID + Secret
   
3. **Supabase** → https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/auth/providers
   - Enable Facebook
   - Paste: App ID + Secret
   - Save

### Add to Frontend
```tsx
import { SocialLoginButtons } from './components/SocialLoginButtons';

// In your login page:
<SocialLoginButtons />
```

## ✅ DONE
- Google shows "TriniBuild" (not ugly URL) ✨
- Facebook login works 🎉
- Professional auth experience 🔥
