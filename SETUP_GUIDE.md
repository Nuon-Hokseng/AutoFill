# Quick Setup Guide for Gemini AI Integration

## Step-by-Step Setup

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables

1. Create a `.env` file in the project root:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your API key:

   ```env
   PLASMO_PUBLIC_GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
   ```

   **Important:** Replace `YOUR_ACTUAL_API_KEY_HERE` with your actual API key from step 1.

### 3. Install Dependencies (if needed)

```bash
pnpm install
```

### 4. Run Development Server

```bash
pnpm dev
```

### 5. Load Extension in Browser

1. Open Chrome/Edge
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `build/chrome-mv3-dev` directory

## Testing the Integration

### Test 1: AI-Generated Data (No Custom Data)

1. Click the extension icon
2. Click "Custom" tab
3. Verify you see the blue info banner: "AI-Generated Data Active"
4. Click back arrow to return to main screen
5. Open any website with a form (e.g., sign-up page)
6. Click "AutoFill" button
7. Form should fill with AI-generated data
8. Status should show "Filled (AI Generated)"

### Test 2: Custom Data

1. Click extension icon
2. Click "Custom" tab
3. Fill in some fields (e.g., username, email)
4. Click "Save"
5. Notice the blue banner disappears
6. Go back to main screen
7. Click "AutoFill" on a form
8. Form should fill with your custom data
9. Status should show "Filled (Custom Data)"

### Test 3: Data Priority

1. Clear custom data by clicking "Remove" in Custom tab
2. Blue banner should reappear
3. AutoFill will now use AI-generated data again

## Troubleshooting

### Issue: No data fills

**Solution:**

- Check browser console (F12) for error messages
- Verify API key is correctly set in `.env`
- Ensure you're not hitting API rate limits

### Issue: "No Form Detected"

**Solution:**

- The current page may not have detectable form fields
- Try a different website with sign-up/login forms

### Issue: Extension won't load

**Solution:**

- Ensure you ran `pnpm dev` and it completed successfully
- Check that you selected the correct `build/chrome-mv3-dev` directory
- Try refreshing the extension in chrome://extensions

### Issue: TypeScript errors in editor

**Solution:**

- These are normal during development
- Run `pnpm dev` to rebuild
- Errors will resolve once the build completes

## Console Logs to Look For

When everything works correctly, you should see logs like:

**With AI-generated data:**

```
🤖 No custom data found, generating with Gemini API...
✅ Successfully generated dummy data via Gemini API
✅ Using Gemini-generated data
📤 Sending generated data to content script
```

**With custom data:**

```
📝 Using custom user data
📤 Sending custom data to content script
```

**With cached AI data:**

```
📦 Using cached dummy data
```

## API Usage Notes

- Generated data is cached for 5 minutes
- Each form fill uses cached data if available
- Cache clears after 5 minutes or page reload
- This minimizes API calls and costs

## Security Reminders

⚠️ **Important:**

- Never commit `.env` file to version control
- Keep your API key secure
- Don't share your API key publicly
- The `.env` file is already in `.gitignore`

## File Locations Reference

- Environment variables: `.env` (create this)
- Service files: `src/services/`
- Background script: `src/background.ts`
- Content script: `src/contents/autofill.ts`
- UI components: `src/features/`

## Next Steps

After successful setup:

1. Test on multiple websites
2. Verify both custom and AI-generated modes work
3. Check the UI indicators display correctly
4. Review console logs for any warnings

## Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Review `IMPLEMENTATION_SUMMARY.md` for architecture details
3. Verify all files were created/modified correctly
4. Ensure `.env` file exists and contains valid API key
