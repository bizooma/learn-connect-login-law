# Admin name editing on the user card

Let admins change a user's first and last name directly from the user card, using the same inline pattern already used for job title.

## Behavior

- Hovering the user's name shows a small pencil icon (admins only).
- Clicking the name (or pencil) swaps the name line for two small inputs: First name, Last name, with check (save) and X (cancel) buttons.
- Enter saves, Escape cancels.
- Saving updates the profile and the card immediately; a toast confirms ("Name updated") or reports failure and restores the previous name.
- Non-admins see the name exactly as today (still clickable to open the detail drawer).
- Clicking the name to open the detail drawer stays available via the avatar / a separate click target so edit and open-detail don't conflict: the pencil enters edit mode, the name text keeps opening the drawer.

## Technical notes

- File: `src/components/admin/user-management/UserCard.tsx`.
- Mirror the existing job-title implementation: local state for `firstName`/`lastName` plus drafts, `editingName`, `nameSaving`; save via `supabase.from("profiles").update({ first_name, last_name }).eq("id", user.id)`.
- Gate on the existing `isAdmin` from `useUserRole()`.
- Empty names are stored as `null`; display falls back to the email as it does now.
- No schema change; `profiles` already has `first_name` / `last_name` and admin update policies are the same ones the job-title edit relies on.
