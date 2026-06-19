# Redesign User Card — Thematic Split Grid

Rebuild `src/components/admin/user-management/UserCard.tsx` to match the selected "Thematic split grid" prototype. Same data and same wired-up dialogs as today — only the layout, grouping, and styling change.

## New card structure

1. **Identity header**
   - Avatar (with online dot) + name + email
   - Role badge top-right (deep-blue tint, e.g. `student`, `admin`, `team_leader`, `owner`, `client`, `free`)
   - Chip row: yellow "Team Leader" chip when `team_leader_id` set OR the user's role is team_leader; law-firm name chip when present; "Joined {date}" in muted text

2. **Protected User Management strip** — amber band, kept as-is

3. **Two-column action split** (`grid-cols-2`, divider between):
   - **LMS Platform** (deep-blue accent bar)
     - Assign Course → existing `UserCourseAssignment` dialog
     - View Progress → existing `onViewProgress` callback
     - Assign Team → existing `TeamAssignmentDialog` (admin only; hidden for non-admins)
   - **Policies & Procedures** (slate accent bar)
     - Manage Groups → opens a new lightweight dialog that lists groups from `useGroups` with checkboxes bound to `group_members` via `useGroupMembers` for this user (add/remove on toggle)
     - Wiki Access → for v1, navigates to `/admin/wiki/account/users` filtered to this user (or, if simpler, opens a small popover listing the user's groups since wiki access is currently group-based). Default: navigate to the directory profile route used elsewhere (`useDirectoryUserDetail`-backed page) if one exists; otherwise it's a no-op stub button with a "Coming soon" toast so the slot is reserved.

4. **Account Controls footer** — slate-tinted band
   - "Delete User" as a small destructive text-link on the right (admin only), opens existing `SafeDeleteUserDialog`
   - Row of equal-width buttons: Change Role (existing `SafeRoleUpdateDialog`), Edit Email (admin only), Reset Password (admin only)

## Files

- **Edit** `src/components/admin/user-management/UserCard.tsx` — full rewrite of the JSX to the new structure. Reuse all existing imports/dialogs/state. No prop changes so `UserGrid` keeps working unchanged.
- **New** `src/components/admin/user-management/UserGroupsDialog.tsx` — controlled dialog that reads `useGroups()`, toggles membership for the given `userId` via `useGroupMembers`. Admin-only trigger.
- No DB / hook / type changes.

## Out of scope

- No edits to `UserGrid`, `UserManagementTabs`, or any page.
- "Wiki Access" deeper management (per-article overrides) — button is wired to a sensible destination only.
- Mobile-specific tweaks beyond what Tailwind responsive classes already give us.
