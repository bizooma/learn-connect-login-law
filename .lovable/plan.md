## Add simple "Are you sure?" confirmation dialogs

Currently the deactivate flow opens a dialog with an optional reason textarea, and the password change flow opens a dialog that just does the change on submit. The user wants a lightweight confirm step — no typing required — before the action fires.

### Changes

1. **Deactivate user** (`src/components/admin/user-management/SafeDeleteUserDialog.tsx`)
   - Remove the reason textarea and the info panel.
   - Keep the AlertDialog, but reduce it to: title "Deactivate User Account", short description ("Are you sure you want to deactivate {name}? They can be restored from Inactive Users."), Cancel + Deactivate buttons.
   - On confirm, call the same `soft_delete_user` RPC (pass a default reason like "Deactivated by admin" since the parameter is required).

2. **Change password** (`src/components/admin/user-management/UserPasswordResetDialog.tsx`)
   - After the admin fills in the new password and clicks "Change Password", show a small AlertDialog: "Are you sure you want to change the password for {name}?" with Cancel + Confirm.
   - Only on Confirm does it invoke `admin-change-password`. Cancel returns to the password dialog with values intact.

### Out of scope

- No changes to role-change or delete-quiz confirmations (already simplified previously).
- No backend / RPC changes.
