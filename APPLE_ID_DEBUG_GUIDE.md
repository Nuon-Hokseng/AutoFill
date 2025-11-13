# Apple ID Autofill Debug Guide

## What Was Changed

### 1. Enhanced Logging System

The extension now provides detailed console output to help debug detection issues.

**Key logs to watch for:**

- `🎯 Autofill content script loaded on: [URL]`
- `🔍 Collected X total input/select elements`
- `📋 Detected fields:` - Shows what fields were found
- `🔧 Attempting to fill field:` - Shows each fill attempt
- `✅ Field filled successfully` or `❌ Error filling field`
- `🎯 genericFill called for:` - For country/region dropdowns

### 2. Improved React/Vue Compatibility

The fill mechanism now:

- Uses native property descriptors (required for React)
- Dispatches `composed: true` events (crosses shadow DOM boundary)
- Sets `target` property on events (some frameworks check this)
- Triggers keyboard events (stricter validation)

### 3. Select Element Support

Country/Region dropdowns are now handled specially:

- Tries exact text/value match
- Falls back to partial match (e.g., "United States" matches "USA")
- Logs all options if no match found

### 4. Attribute Detection

Now scans for:

- `aria-labelledby` (Apple's pattern)
- `data-test`, `data-testid`, `data-field`, `data-name`
- CamelCase splitting: `firstName` → "first name"

## How to Debug on Apple ID

### Step 1: Reload Extension

1. Go to `chrome://extensions/`
2. Find "Auto fill extension"
3. Click the reload icon (⟳)

### Step 2: Open Apple ID Create Account

1. Navigate to: https://appleid.apple.com/account
2. Click "Create Your Apple ID"

### Step 3: Open Browser Console

1. Press **F12** or **Ctrl+Shift+I** (Windows/Linux) or **Cmd+Option+I** (Mac)
2. Go to the **Console** tab
3. Clear any existing logs

### Step 4: Trigger Autofill

1. Click your extension icon
2. Click the autofill button
3. Watch the console output

## What to Look For in Console

### ✅ Good Signs:

```
🎯 Autofill content script loaded on: https://appleid.apple.com/...
🔍 Collected 15 total input/select elements
📋 Detected fields:
  firstname: INPUT[text] name="firstName" id="form-textbox-..."
  lastname: INPUT[text] name="lastName" id="form-textbox-..."
  country: SELECT name="countryCode" id="form-select-..."
🔧 Attempting to fill field: {name: "firstName", value: "John"}
✅ Field filled successfully: {name: "firstName", finalValue: "John"}
```

### ❌ Problem Signs:

```
📋 Detected fields:
  firstname: ❌ NOT FOUND
  lastname: ❌ NOT FOUND
```

**Means:** Detection failed - fields not recognized

```
🔧 Attempting to fill field: ...
❌ Error filling field: ...
```

**Means:** Detection worked but filling failed (framework blocking)

```
🔍 Collected 0 total input/select elements
```

**Means:** Script loaded before form rendered, or cross-origin iframe issue

## Common Issues & Solutions

### Issue 1: "Collected 0 elements"

**Cause:** Form loads dynamically after page load
**Solution:** Wait 2-3 seconds after page loads, then trigger autofill

### Issue 2: "NOT FOUND" for all fields

**Cause:** Labels don't match keywords or cross-origin iframe
**Solutions:**

1. Check if form is inside an iframe: Right-click input → Inspect → Look for `<iframe>`
2. If iframe has different origin (e.g., `https://idmsa.apple.com`), content scripts can't access it

### Issue 3: Fields detected but values disappear

**Cause:** Framework validation clearing invalid input
**Solution:** Values in custom tab might not match Apple's format:

- **Country:** Check if it expects "US" vs "United States"
- **Phone:** Check if format matches (with/without country code)

### Issue 4: Country dropdown shows empty but doesn't select

**Cause:** Value format mismatch
**Check console for:**

```
🔽 Handling SELECT element with X options
⚠️ No matching option found for value: "United States"
```

Then inspect the select element to see what values it expects.

## Manual Inspection Steps

### Check if form is accessible:

```javascript
// Paste in console:
document.querySelectorAll('input[name="firstName"]')
// Should show: NodeList [input]
// If NodeList [], the input doesn't exist in accessible DOM
```

### Check label association:

```javascript
// Paste in console:
const input = document.querySelector('input[name="firstName"]')
const labelId = input.getAttribute("aria-labelledby")
const label = document.getElementById(labelId)
console.log("Label text:", label?.textContent)
// Should show: "First Name" or similar
```

### Check select options:

```javascript
// Paste in console:
const select = document.querySelector('select[name="countryCode"]')
Array.from(select.options).forEach((opt) => {
  console.log(`"${opt.text}" = "${opt.value}"`)
})
// Shows all available options
```

## Next Steps

### If Detection Works But Filling Fails:

The issue is Apple's React framework blocking our events. Possible solutions:

1. Add even more aggressive event dispatching
2. Simulate actual typing character-by-character
3. Use browser automation APIs (puppeteer-like approach)

### If Detection Fails:

1. Share the console output here
2. Run the manual inspection scripts above
3. Check if form is in cross-origin iframe

### If Cross-Origin Iframe:

Content scripts cannot access cross-origin iframes by security policy. Would need:

1. Different approach (inject script via `chrome.scripting`)
2. Or use `webRequest` API to intercept/modify form submissions
