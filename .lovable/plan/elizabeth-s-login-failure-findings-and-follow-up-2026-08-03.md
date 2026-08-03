# Elizabeth's login failure — findings and follow-up

## What the data shows

Checked her auth record, profile, and the admin audit trail directly:

- `elizabethc@newfrontier.us` was created 2025-05-31 and has **never been invited** (`invited_at` is null). The new invite flow never touched her account.
- She was **never banned** (`banned_until` is null) and her profile was **never soft-deleted** (`is_deleted = false`). So the delete/ban-sync change is not involved either.
- Her email is confirmed, her password hash was present the whole time.
- Audit history for her account contains only a role change (April) and two progress backups — no deactivation, no role removal.
- Timeline this morning: an admin password change at 15:55 UTC, then a successful password login at 15:56, a logout at 15:56, and a normal session afterwards.

Fleet-wide consistency check (all 467 accounts): every banned auth user has `is_deleted = true` on their profile and vice versa — **zero mismatches**. Only 2 accounts have ever gone through the invite flow, and 1 of those hasn't signed in yet. Nothing systemic is locking out New Frontier accounts.

## What we cannot prove

The auth log retention on this project is about one hour — this morning's failed attempt is already gone, so the exact error she hit is not recoverable. Given the account state, the overwhelmingly likely cause is a wrong/forgotten password (a plain `invalid_credentials`), which is exactly why the admin reset fixed it. A second, less likely possibility is a stale refresh token in her browser: we do see `refresh_token_not_found` warnings on the live site, and the app currently surfaces those as a console error rather than cleanly dropping the user to a fresh login screen.

## Proposed follow-up (small, low risk)

1. **Self-service password reset visibility** — confirm the "Forgot password?" link is prominent on the login screen so staff can recover without an admin, and that the reset email lands on `/reset-password` with the fixed grace-period handling already in place.
2. **Clean stale-session handling** — when Supabase reports `refresh_token_not_found` / invalid refresh token at startup, clear local auth storage silently and show the login form instead of leaving an error in the console. This removes the one remaining way a user can look "locked out" when their credentials are fine.
3. **Login failure breadcrumb** — record failed sign-in attempts (email, timestamp, error code) in the existing activity log so the next report like this can be diagnosed after the one-hour auth log window expires.

## Technical notes

- Item 2 touches `src/hooks/useAuth.tsx` initialization and the existing `isRefreshTokenError` / `clearAuthStorage` helpers in `src/utils/mobileAuthUtils.ts`.
- Item 3 writes to `user_activity_log` via the existing `log_user_activity` path — no schema change.
- No changes to the invite flow, `soft_delete_user`, or RLS are needed; those are behaving correctly.
