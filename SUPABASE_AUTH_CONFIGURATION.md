# Supabase Auth Configuration - Register & Email Issues

## 📋 Problems Identified

### 1. ❌ "Too many attempts" Rate Limiting
- **Error**: `Too many attempts. Please wait a few minutes and try again.`
- **Cause**: Supabase has built-in rate limiting for signup requests
- **Triggered by**:
  - Multiple signup attempts from same IP within 5 minutes
  - Multiple signup attempts with same email address within 5 minutes
  - Default limit: ~5 attempts per 5 minutes per IP/email

### 2. ❌ Email Confirmation Not Arriving
- **Possible causes**:
  - Email rate limiting preventing delivery
  - SMTP configuration issue in Supabase
  - Email going to spam folder
  - Email template not configured

### 3. ✅ FIXED: i18n Button Text (auth.registering)
- Added translation key to both `en.json` and `pt-BR.json`
- Button now displays "Registering..." / "Criando conta..." instead of "auth.registering"

---

## 🔧 How to Fix Rate Limiting

### Option 1: Increase Rate Limit (Recommended)
In **Supabase Dashboard** → **Authentication** → **Providers** → **Email**:

1. Go to: https://app.supabase.com/project/[YOUR_PROJECT_ID]/auth/providers
2. Find **Rate limiting** section
3. Look for these settings:
   - **Signup rate limit**: Default is usually 5 per 5 minutes
   - **Verification email rate limit**: Default is usually 5 per 5 minutes

4. If available, increase limits or disable for development

### Option 2: Check Rate Limit Policies
Supabase **Security** → **DDoS Protection** / **Rate Limiting**:

1. Verify no custom rate limiting rules are blocking auth endpoints
2. Whitelist your staging/dev IP if needed

### Option 3: Email Verification Settings
In **Supabase Dashboard** → **Authentication** → **Email Templates**:

1. Verify "Confirm signup" template exists
2. Check template preview has correct link format
3. Ensure `emailRedirectTo` in auth.ts matches your setup:
   ```typescript
   emailRedirectTo: `${APP_URL}/auth/callback`
   ```

---

## 📧 Email Configuration Checklist

### Verify SMTP Settings
**Auth** → **Email Templates**:
- [ ] Sender email configured (usually noreply@...)
- [ ] SMTP host configured (if using custom)
- [ ] Email templates exist:
  - [ ] "Confirm signup"
  - [ ] "Invite user"
  - [ ] "Magic Link"
  - [ ] "Change email"
  - [ ] "Reset password"

### Test Email Delivery
```bash
# In Supabase SQL editor, check auth logs:
SELECT * FROM auth.audit_log_entries
WHERE action = 'user_signedup'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🛠️ Frontend Error Handling

Current implementation in `src/app/actions/auth.ts`:

```typescript
function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email rate limit exceeded") || lower.includes("rate_limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  // ... other error handlers
}
```

**This is correct** - error is properly caught and displayed to user.

---

## 🚀 Quick Checklist for Production

- [ ] Rate limiting adjusted in Supabase Auth settings
- [ ] Email templates verified and tested
- [ ] SMTP configuration confirmed
- [ ] `auth/callback` route exists and working
- [ ] Email confirmation link format correct
- [ ] Spam filter rules checked (Gmail, Outlook, etc.)
- [ ] i18n keys present in all language files ✅
- [ ] Error messages friendly and actionable ✅

---

## 📞 Debugging Steps

1. **Check if signup reaches backend**:
   - Watch browser network tab during signup
   - Look for request to `/auth/register` (route handler) or form action

2. **Check Supabase logs**:
   ```bash
   # In Supabase dashboard → Logs → Auth logs
   # Filter for your test email address
   ```

3. **Check email delivery**:
   - Go to **Auth** → **Users**
   - Click on user to see if `email_confirmed_at` is NULL
   - If NULL, email confirmation wasn't completed

4. **Test rate limit manually**:
   - Clear browser storage/cookies
   - Try signup with new IP (VPN) or email
   - If it works on new IP, it's IP-based rate limiting
   - If it works with new email, it's email-based rate limiting

---

## 🔐 Security Note

Rate limiting is **security by design** to prevent:
- Email enumeration attacks (figuring out registered emails)
- Brute force signup attempts
- Account takeover attempts

**Don't disable it completely in production** - just adjust limits appropriately.

---

**Last Updated**: February 26, 2026
**Status**: CRITICAL - Review and implement before public launch
