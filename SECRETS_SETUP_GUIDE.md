# 🔐 Commercial Auth Setup Guide (Google, Facebook, WhatsApp)

To make your "Commercial Grade" login buttons work, you need to configure the backend (Supabase) with keys from the providers.

## 1. Google Login (Free)
1. Go to **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Create a Project named "TriniBuild".
3. Go to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth Client ID**.
5. Select **Web Application**.
6. Add these URLs:
   - **Authorized JavaScript Origins:** `https://your-project-id.supabase.co`
   - **Authorized Redirect URIs:** `https://your-project-id.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**.
8. Go to your **Supabase Dashboard > Authentication > Providers > Google**.
9. Paste the keys and toggle "Enable".

## 2. Facebook Login (Free)
1. Go to **[Meta for Developers](https://developers.facebook.com/)**.
2. Create an App (Select "Consumer").
3. Add **Facebook Login** product.
4. Go to **Settings > Basic**.
5. Copy **App ID** and **App Secret**.
6. Go to your **Supabase Dashboard > Authentication > Providers > Facebook**.
7. Paste keys and Enable.

## 3. WhatsApp Login (Paid - Requires Twilio)
**Yes, you need Twilio for this.**
1. Sign up for **[Twilio](https://www.twilio.com/)**.
2. Get a phone number and enable **WhatsApp Sender**.
3. Copy your **Account SID** and **Auth Token**.
4. Go to **Supabase Dashboard > Authentication > Providers > Phone**.
5. Select "Twilio" as the provider.
6. Paste your SID/Token and Message Service SID.

### 💡 Free Alternative for Now?
If you don't want to pay for Twilio yet, rely on **Google Login** and **Email/Password**. They are free and cover 99% of users.
