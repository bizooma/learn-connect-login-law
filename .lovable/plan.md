## Add password fields back to Admin "Add User" dialog

The admin **Add New User** dialog (`src/components/admin/user-management/AddUserDialog.tsx`) currently only collects email, name, and role — no password input. The owner-side `AddEmployeeDialog` still has password + confirm-password fields, and the `create-single-user` edge function already accepts an optional `password` (falling back to a temp password when omitted). So this is a UI regression on the admin dialog only.

### Changes

**`src/components/admin/user-management/AddUserDialog.tsx`**
- Add `password` and `confirmPassword` to `formData` state, plus a `showPassword` toggle.
- Add two new fields below Last Name, matching the existing grid layout:
  - **Password** — input with eye/eye-off toggle button, min 8 chars
  - **Confirm Password** — input using the same show/hide state
- Validate on submit:
  - both passwords filled
  - `password === confirmPassword`
  - length ≥ 8
  - show toast + abort if any check fails
- Pass `password: formData.password` in the `create-single-user` invoke body (the edge function already handles this field).
- Reset the two new fields when closing/submitting.

No backend or edge-function changes needed.