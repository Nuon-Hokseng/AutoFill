# Testing Payment Bypass

## Step 1: Check Your Payments Table

Open your Supabase dashboard and run this SQL query:

```sql
SELECT
  user_id,
  payway_status,
  expires_at,
  created_at,
  CASE
    WHEN expires_at IS NULL THEN 'No expiry set'
    WHEN expires_at > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as status_check
FROM payments
ORDER BY created_at DESC;
```

**What to look for:**

- `payway_status` should be exactly `"PAID"` (case-sensitive)
- `expires_at` should be NULL or a future date
- `user_id` should match your logged-in user ID

## Step 2: Rebuild and Test

```bash
# Rebuild the extension with the new logging
pnpm dev
```

## Step 3: Check Console Logs

1. Open Chrome DevTools
2. Go to Console tab
3. Filter for these messages when you trigger autofill:
   - `🔍 [checkAndIncrementIfAllowed] Checking payment status for user:`
   - `💳 [checkPaymentStatus] Query result`
   - `✅ [checkAndIncrementIfAllowed] PRO USER DETECTED - BYPASSING RATE LIMIT`

## Common Issues & Fixes

### Issue 1: `payway_status` is not "PAID"

**Fix:** Update your payment record:

```sql
UPDATE payments
SET payway_status = 'PAID'
WHERE user_id = 'YOUR_USER_ID';
```

### Issue 2: Payment has expired

**Fix:** Extend the expiry date:

```sql
UPDATE payments
SET expires_at = NOW() + INTERVAL '1 year'
WHERE user_id = 'YOUR_USER_ID';
```

### Issue 3: User ID mismatch

**Check:** Run this in your browser console while logged in:

```javascript
chrome.storage.local.get("user_id", (res) =>
  console.log("Stored user_id:", res.user_id)
)
```

Then compare with your payments table `user_id`.

### Issue 4: No payment record at all

**Fix:** Insert a test payment:

```sql
INSERT INTO payments (user_id, payway_status, expires_at, created_at)
VALUES ('YOUR_USER_ID', 'PAID', NOW() + INTERVAL '1 year', NOW());
```

## What the Logs Should Show

**For a PRO user (PAID):**

```
🔍 [checkAndIncrementIfAllowed] Checking payment status for user: abc-123-xyz
💳 [checkPaymentStatus] Querying payments for user: abc-123-xyz
💳 [checkPaymentStatus] Query result - Error: none, Data: {payway_status: 'PAID', expires_at: '2026-12-16', ...}
✅ Payment status: PAID
💳 [checkAndIncrementIfAllowed] Payment status returned: PAID
✅ [checkAndIncrementIfAllowed] PRO USER DETECTED - BYPASSING RATE LIMIT
```

**For a FREE user:**

```
🔍 [checkAndIncrementIfAllowed] Checking payment status for user: abc-123-xyz
💳 [checkPaymentStatus] Querying payments for user: abc-123-xyz
💳 [checkPaymentStatus] Query result - Error: none, Data: null
💳 No payment record found for user
💳 [checkAndIncrementIfAllowed] Payment status returned: NOT_FOUND
📊 [checkAndIncrementIfAllowed] Current remaining: 3
```

## Need More Help?

Share the console logs from the payment check and I'll help debug further!
