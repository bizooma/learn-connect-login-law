## Problem

Admin gets "Edge Function returned a non-2xx status code" when adding a user with the last name **Gómez Sánchez**. The `create-single-user` edge function validates names with `/^[a-zA-Z\s'-]+$/`, which rejects any accented or non-ASCII character (ó, á, ñ, é, etc.). This blocks legitimate names — a real problem for an immigration law firm dealing with Hispanic and international clients/staff.

Bonus issue: the toast just says "Edge Function returned a non-2xx status code" instead of the actual server message (e.g. "Names can only contain letters, spaces, hyphens, and apostrophes"), so the admin had no idea what went wrong.

## Fix

**`supabase/functions/create-single-user/validation.ts`**
- Change the name regex from `/^[a-zA-Z\s'-]+$/` to a Unicode-aware version: `/^[\p{L}\s'-]+$/u` — allows letters from any script (Latin with accents, Cyrillic, CJK, etc.) plus spaces, hyphens, apostrophes.

**`supabase/functions/import-users-csv/userCreator.ts`** (and any sibling validator there)
- Check for the same regex and apply the same fix so CSV imports don't fail on accented names either.

**`src/components/admin/user-management/AddUserDialog.tsx`**
- When `supabase.functions.invoke` returns an error, try to surface the real message from `data?.error` (the edge function already returns it in the JSON body) instead of just `error.message`. So the admin sees the actual validation reason in the toast.

No DB or schema changes. No UI changes beyond a better error toast.
