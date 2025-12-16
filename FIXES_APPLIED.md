# Rate Limit Fixes Applied

## Issues Fixed

### Issue 1: Logout was clearing local storage → Free bypass

**Problem**: When user exceeded local limit (3/3), then logged in, then logged out, the local cache was cleared on logout, giving them fresh 3 uses.

**Fix**: Removed `clearLocalRateLimit()` from `logout()` function

- Local cache is now ONLY cleared on login (to prevent cross-account contamination)
- NOT cleared on logout (to maintain the local limit)

### Issue 2: Same account's DB limit was resetting on re-login

**Problem**: When user logged in, used their 3 DB uses, logged out, and logged back in to SAME account, the cache clear in `canGenerateData()` was affecting their DB limit.

**Fix**: Removed `clearLocalRateLimit()` call from `canGenerateData()`

- Cache is ONLY cleared in `login()` function (once per login)
- NOT cleared on every check (which was interfering with DB persistence)

## How It Works Now

### Scenario 1: Local User (Not Logged In)

1. User uses 3 times → local storage shows 3/3
2. User is blocked ✅
3. User closes browser and reopens → still blocked ✅
4. New day → counter resets automatically

### Scenario 2: User Logs In After Local Limit

1. User uses 3 times locally → blocked at 3/3
2. User logs in → `login()` clears local cache
3. User gets fresh 3 uses from database ✅
4. User uses 2 times (2/3 in DB)
5. User logs out → local cache NOT cleared ✅
6. User is back to device-local mode, but DB kept their 2/3 count

### Scenario 3: Same Account Re-login

1. User logs in → Account A uses 3/3 in database → blocked
2. User logs out → local cache NOT touched
3. User logs back in to Account A → `login()` clears local cache (harmless)
4. Database still shows Account A at 3/3 → still blocked ✅

### Scenario 4: Switch Accounts

1. User logs in as Account A → uses 3/3 → blocked
2. User logs out
3. User logs in as Account B → `login()` clears local cache
4. Account B gets fresh 3/3 from database (separate DB record) ✅

## Files Modified

1. **`src/lib/authService.ts`**:
   - `login()`: Keeps `clearLocalRateLimit()` call
   - `logout()`: Removed `clearLocalRateLimit()` call

2. **`src/lib/rateLimitHelper.ts`**:
   - Removed `clearLocalRateLimit` import (not used)
   - Removed `clearLocalRateLimit()` call from `canGenerateData()`

## Key Logic

```typescript
// authService.ts
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error

  // ✅ Clear local cache ONLY on login
  await clearLocalRateLimit()
  console.log("✅ [authService.login] Rate limit cache cleared after login")

  return data
}

export async function logout() {
  await clearLocalData()

  // ❌ NO clearLocalRateLimit() here
  // Prevents bypass by logging out

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
```

## Testing Steps

1. **Test Local Bypass Prevention**:
   - Use 3 times without login → blocked
   - Login → get 3 bonus uses
   - Use 2 times → 2/3 in DB
   - Logout → should remain at 2/3 when logged out (no free uses)

2. **Test Same Account Persistence**:
   - Login as Account A → use 3/3 → blocked
   - Logout → no changes
   - Login again as Account A → should still be blocked (DB keeps 3/3)

3. **Test Cross-Account Isolation**:
   - Login as Account A → use 3/3 → blocked
   - Logout
   - Login as Account B → should have fresh 3/3 available

All three scenarios should now work correctly! 🎯
