# OAuth Setup Guide for CortexOS

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   ```
   https://ztplqtxkvyhmgjwpmjeh.supabase.co/auth/v1/callback
   ```
7. Copy **Client ID** and **Client Secret**

### 2. Configure in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** and enable it
5. Paste your **Client ID** and **Client Secret**
6. Save changes

---

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in the details:
   - **Application name**: CortexOS
   - **Homepage URL**: `http://localhost:3001` (or your domain)
   - **Authorization callback URL**: 
     ```
     https://ztplqtxkvyhmgjwpmjeh.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy **Client ID**
6. Generate a new **Client Secret** and copy it

### 2. Configure in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **GitHub** and enable it
5. Paste your **Client ID** and **Client Secret**
6. Save changes

---

## Testing OAuth

### Local Development

1. Make sure your Supabase project is configured
2. Start your UI: `cd ui && npm run dev`
3. Go to `http://localhost:3001/login`
4. Click **Google** or **GitHub** button
5. Complete OAuth flow
6. You'll be redirected back to the dashboard

### Production

Update redirect URLs in both Google and GitHub OAuth apps to your production domain:
```
https://yourdomain.com
```

And update Supabase redirect URL in:
```
Authentication > URL Configuration > Site URL
```

---

## Troubleshooting

### "Redirect URI mismatch" error
- Verify the callback URL matches exactly in OAuth provider settings
- Check Supabase callback URL: `https://[your-project].supabase.co/auth/v1/callback`

### "Invalid client" error
- Double-check Client ID and Client Secret in Supabase
- Ensure OAuth provider is enabled in Supabase

### User not redirected after login
- Check Site URL in Supabase Authentication settings
- Verify redirect URL in AuthContext.tsx matches your domain

---

## Security Notes

1. **Never commit OAuth secrets** to version control
2. Use environment variables for sensitive data
3. Enable **Email verification** in Supabase for production
4. Set up **Rate limiting** to prevent abuse
5. Configure **Allowed redirect URLs** in Supabase

---

## Current Configuration

Your Supabase project:
- **URL**: https://ztplqtxkvyhmgjwpmjeh.supabase.co
- **Callback URL**: https://ztplqtxkvyhmgjwpmjeh.supabase.co/auth/v1/callback

Add this callback URL to both Google and GitHub OAuth apps.
