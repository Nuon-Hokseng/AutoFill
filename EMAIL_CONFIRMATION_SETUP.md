# Email Confirmation Setup for Chrome Extension

## Your Extension ID

```
kpameiadiejndbejidkcpnkjajdjmbib
```

## Steps to Configure Supabase Email Confirmation

### 1. Your Extension URL

Your extension options page URL:

```
chrome-extension://kpameiadiejndbejidkcpnkjajdjmbib/options.html
```

### 2. Configure Supabase Site URL

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set the **Site URL** to:
   ```
   chrome-extension://kpameiadiejndbejidkcpnkjajdjmbib/options.html
   ```

### 3. Configure Redirect URLs

Add the following to **Redirect URLs**:

```
chrome-extension://kpameiadiejndbejidkcpnkjajdjmbib/options.html#/auth/confirm
chrome-extension://kpameiadiejndbejidkcpnkjajdjmbib/options.html
```

### 4. Update Email Templates

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Update the confirmation link in the template:

Replace:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
  >Confirm your mail</a
>
```

With:

```html
<a
  href="chrome-extension://kpameiadiejndbejidkcpnkjajdjmbib/options.html#/auth/confirm?token_hash={{ .TokenHash }}&type=email"
  >Confirm your mail</a
>
```

Notice the `#` before `/auth/confirm` - this is required because we're using HashRouter in React Router.

### 5. Full Email Template Example

```html
<h2>Confirm your signup</h2>
<p>Thank you for signing up for AutoFiller!</p>
<p>Follow this link to confirm your email address:</p>
<p>
  <a
    href="chrome-extension://kpameiadiejndbejidkcpnkjajdjmbib/options.html#/auth/confirm?token_hash={{ .TokenHash }}&type=email"
    >Confirm your email</a
  >
</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

### 6. Testing

1. Build and load your extension
2. Sign up with a new account
3. Check your email for the confirmation link
4. Click the confirmation link
5. You should be redirected to your extension's confirmation page
6. After successful confirmation, you'll be redirected to the login page

## How It Works

1. User signs up → Supabase sends confirmation email
2. User clicks confirmation link → Opens extension at `chrome-extension://YOUR_EXTENSION_ID/options.html#/auth/confirm?token_hash=...&type=email`
3. ConfirmEmail component extracts `token_hash` and `type` from URL
4. Calls `supabase.auth.verifyOtp()` to verify the email
5. On success → Redirects to login page after 2 seconds
6. On error → Shows error message with option to go to login

## Important Notes

- The `#` in the URL is crucial for HashRouter routing
- Make sure your extension ID doesn't change between development and production
- For production, you'll need to use the published extension ID
- Users must have the extension installed for the confirmation link to work

## Troubleshooting

**Link doesn't open extension:**

- Verify extension ID matches in Supabase configuration
- Check that extension is installed and enabled
- Confirm URL includes `#` before `/auth/confirm`

**Confirmation fails:**

- Check browser console for errors
- Verify Supabase project URL and anon key are correct
- Ensure token hasn't expired (tokens expire after 24 hours by default)
