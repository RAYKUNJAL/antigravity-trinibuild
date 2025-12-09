# TriniBuild Twilio Credentials

## ✅ Setup Complete!

Your Twilio account has been configured for SMS and WhatsApp verification.

---

## 🔑 Twilio Credentials

### Account SID
```
AC33cfba1da748c74113f13ab256943e9
```

### Auth Token
```
27e3427bd9223f9341b511Becde3266c
```

### Verify Service SID
```
VAda7d7911da8ba4680eae979cdf02a43b
```

### Service Name
```
TriniBuild Verification
```

### Enabled Channels
- ✅ SMS
- ✅ WhatsApp
- ⬜ Email (can be enabled later)
- ⬜ Voice (can be enabled later)

---

## 📋 Next Steps: Add to Supabase

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Navigate to Authentication Settings**
   - Click **Settings** → **Auth** in the left sidebar

3. **Scroll to Phone Auth Section**
   - Find "Phone Auth" section
   - Enable "Phone provider"

4. **Add Twilio Credentials**
   - **Twilio Account SID**: `AC33cfba1da748c74113f13ab256943e9`
   - **Twilio Auth Token**: `27e3427bd9223f9341b511Becde3266c`
   - **Twilio Verify Service SID**: `VAda7d7911da8ba4680eae979cdf02a43b`

5. **Save Changes**

### Option 2: Via Environment Variables

If you're running Supabase locally or self-hosted, add these to your `.env` file:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC33cfba1da748c74113f13ab256943e9
TWILIO_AUTH_TOKEN=27e3427bd9223f9341b511Becde3266c
TWILIO_VERIFY_SERVICE_SID=VAda7d7911da8ba4680eae979cdf02a43b
```

---

## ⚠️ Important Notes

### Trinidad & Tobago Phone Numbers
- ❌ **NOT AVAILABLE**: Twilio currently doesn't offer Trinidad & Tobago phone numbers
- ✅ **Workaround**: Twilio Verify works with international numbers (US, UK, etc.)
- 📱 **Users will receive**: Messages from international numbers, but verification still works

### Cost Per Message
- **SMS**: ~$0.0075 per message
- **WhatsApp**: ~$0.005 per message
- **Note**: Twilio has a free trial credit to test

### Free Alternatives
If you want to avoid Twilio costs initially, use these (already working):
- 🆓 **Email Magic Links** (Already enabled in Supabase)
- 🆓 **Google OAuth** (Follow SECRETS_SETUP_GUIDE.md)
- 🆓 **Facebook OAuth** (Follow SECRETS_SETUP_GUIDE.md)

---

## 🧪 Testing the Setup

### Test SMS Verification
1. In your TriniBuild app, go to login/signup
2. Enter a phone number (include country code: +1868 for Trinidad)
3. Click "Send Code"
4. Check your phone for the verification code
5. Enter code to complete login

### Test WhatsApp Verification
1. Same as SMS, but select WhatsApp as the channel
2. Message will arrive via WhatsApp instead of SMS

---

## 🔒 Security Best Practices

1. **Never commit credentials to Git**
   - This file is for reference only
   - Use environment variables in production
   - Add to `.gitignore` if using .env files

2. **Rotate credentials regularly**
   - Generate new Auth Token every 90 days
   - Update in Supabase dashboard

3. **Monitor usage**
   - Check Twilio Console for unusual activity
   - Set up billing alerts

---

## 📞 Support

- **Twilio Console**: https://console.twilio.com
- **Twilio Docs**: https://www.twilio.com/docs/verify
- **Supabase Docs**: https://supabase.com/docs/guides/auth/phone-login

---

**Setup completed on**: December 9, 2025
**Status**: ✅ Ready for Production
