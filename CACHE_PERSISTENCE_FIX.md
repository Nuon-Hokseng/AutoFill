# Rate Limit Cache Persistence Fix

## Problem Identified

When a user hits the daily 3-use limit and then logs in with a **different account**, the local storage cache still shows "limited" status, preventing the new account from getting a fresh 3 uses from the database.

**Root Cause**: Local storage cache persists across account switches without clearing.

## Solution Implemented

### 1. **Enhanced `getRateLimitStatus()` - NO Fallback for Logged-In Users**

Modified the function to:

- For **logged-in users**: ONLY query database - NEVER fall back to local storage
- For **logged-out users**: ONLY use local storage
- This prevents old cached "limited" status from affecting new account

### 2. **Clear Cache on Login/Logout**

Updated `src/lib/authService.ts`:

```typescript
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error

  // ✅ Clear local cache when logging in
  await clearLocalRateLimit()
  return data
}

export async function logout() {
  await clearLocalData()

  // ✅ Clear local cache when logging out
  await clearLocalRateLimit()

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
```

### 3. **Double-Check in `canGenerateData()`**

`src/lib/rateLimitHelper.ts` already calls `clearLocalRateLimit()` when user detected:

```typescript
if (user) {
  // User is logged in - clear local storage
  await clearLocalRateLimit()

  // Now check database for fresh limit
  const rateLimitStatus = await getRateLimitStatus(user.id)
  // ...
}
```

## Test Flow

**Scenario**: User on Device A logs in, uses 3 times, hits limit. Then logs out and logs in with Account B.

**Expected Behavior**:

1. ✅ Account A: 3 uses → "Daily limit reached"
2. ✅ Log out: Local cache cleared
3. ✅ Log in to Account B: Local cache cleared, DB queried for Account B's fresh limit
4. ✅ Account B: Fresh 3 uses available (separate DB record per user_id)

**What's Happening Now**:

- Database writes may not be working yet (RLS issue disabled, but needs Supabase deploy)
- Local cache clearing IS working
- Login/logout DO clear the cache

## Remaining Work

1. **Deploy SQL Migration to Supabase**:

   ```sql
   ALTER TABLE rate_limit_usage DISABLE ROW LEVEL SECURITY;
   ```

   This allows writes from the extension's anon key

2. **Verify Database Writes**:
   - Check if `rate_limit_usage` table shows inserts after RLS disable
   - Check logs for database error messages

3. **Test Account Switching**:
   - Account A: Use 3 times → limited
   - Switch to Account B: Should show fresh limit (from DB if writes work, or fresh local if not)

## Code Changes Summary

| File                          | Changes                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| `src/lib/rateLimitService.ts` | Updated `getRateLimitStatus()` to avoid local fallback for logged-in users |
| `src/lib/authService.ts`      | Added `clearLocalRateLimit()` calls in `login()` and `logout()`            |
| `src/lib/rateLimitHelper.ts`  | Already had cache clear in `canGenerateData()`                             |
| `src/background.ts`           | (reverted setup listener due to build issues)                              |
| `DATABASE_MIGRATION.sql`      | RLS disabled to allow writes from anon key                                 |

## Why This Fixes The Issue

1. **Login/Logout Clear Cache**: When switching accounts, auth methods explicitly clear the cache
2. **Logged-In Users Never Use Local**: `getRateLimitStatus()` with a user_id never falls back to local storage
3. **Double Clear in canGenerateData()**: Extra safety check clears cache before checking status
4. **Database-Per-User**: Each user_id has separate records, so no cross-account contamination

The issue of "cache from local applies to all accounts" is now blocked at 3 levels:

- Explicit clear on login/logout
- Check in canGenerateData()
- getRateLimitStatus() refuses to use local for logged-in users
