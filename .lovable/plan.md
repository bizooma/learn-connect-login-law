
## Context

The Manage Users screen already performs **soft deletes only**. The orange "Deactivate" button (`SafeDeleteUserDialog`) calls the `soft_delete_user` RPC, which sets `is_deleted = true` on the profile and leaves all data intact (roles, course assignments, LMS progress, certificates, wiki views, audit trails). Deactivated users appear under the **Inactive Users** tab and can be restored at any time with full history.

The old hard-delete path (`DeleteUserDialog.tsx` + the `delete-user` edge function) still exists in the codebase but is **not referenced by any UI**. Since you've confirmed no hard-delete should be reachable through the interface, the safest move is to delete that dead code so it can't be re-wired by mistake.

## Changes

1. **Delete `src/components/admin/user-management/DeleteUserDialog.tsx`** (the red trash-can hard-delete dialog, currently unused).
2. **Delete the `supabase/functions/delete-user/` edge function** and remove it from Supabase via `supabase--delete_edge_functions` so the destructive `auth.admin.deleteUser` endpoint is no longer deployed.
3. **No database migrations, no schema changes, no UI changes.** The Deactivate button, Inactive Users tab, and Restore flow keep working exactly as they do today.

## What stays the same

- Deactivating a user in Manage Users (either from the LMS admin or the new P&P Manage Users page) → soft delete, fully reversible.
- All LMS progress, course assignments, certificates, wiki article views, and audit logs are preserved.
- Restore from the Inactive Users tab brings the user back unchanged.
