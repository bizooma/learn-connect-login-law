
# Manage Users — Bulk Actions, Filters, and Detail Drawer

Two improvements to the Active Users tab on `/admin/wiki/account/users`.

## 1. Filters bar (above the user list)

A horizontal filter bar between the search input and the user grid:

- **Role** dropdown (Admin, Owner, Team Leader, Student, Client, Free) — multi-select.
- **Tester** toggle (P&P access on/off/any).
- **Group** dropdown sourced from `public.groups` — multi-select.
- **Status** dropdown — Active / Inactive / Pending (no login yet).
- **Activity** dropdown — Logged in last 7d / 30d / 90d / Never.
- **Assignment** dropdown — No group / No training path / No course.
- A "Clear filters" link appears when any filter is active. Filter state is held in the page (not persisted yet).

Search keeps working and combines with filters (AND).

## 2. Bulk actions

- A checkbox is added to every `UserCard` in the grid plus a "select all on this page" checkbox in a new toolbar above the grid.
- When 1+ users are selected, a sticky action bar appears showing the count and these actions:
  - **Assign to group(s)** — opens a picker, writes to `group_members`.
  - **Remove from group(s)** — same picker, deletes matching rows.
  - **Change role** — single role dropdown, uses existing `updateUserRoleSafe`.
  - **Toggle Tester** — adds/removes the `tester` role.
  - **Send password reset** — calls existing reset flow per user.
  - **Deactivate / Reactivate** — bulk wrapper around existing safe deactivate.
  - **Export CSV** — downloads name, email, role, groups, last login, status for the selection (or all filtered if none selected).
- Each bulk op runs sequentially with a progress toast and refreshes the list at the end. Errors per row are surfaced in the toast summary.

## 3. User detail drawer

Clicking a user's name/avatar (not the action menu) opens a right-side `Sheet` drawer instead of jumping into separate dialogs. Tabs inside:

- **Overview** — name, email, role badges (incl. Tester), groups, last login, account created, deactivation status. Inline "Edit email", "Reset password", "Deactivate" buttons reuse existing dialogs.
- **LMS Activity** — assigned courses, completion %, last activity (from `user_course_progress` + `course_assignments`). Reuses `UserProgressModal` content embedded as a tab.
- **P&P Activity** — current streak, longest streak, last article viewed, total views (from `user_wiki_streaks` + `wiki_article_views`).
- **Groups** — list of group memberships with add/remove (reuses `UserGroupsDialog` logic inline).
- **Audit** — recent rows from `user_role_audit` and `user_management_audit` for that user.

The existing per-card dropdown stays for power users; the drawer is the new primary surface.

## Technical notes

- New files:
  - `src/components/admin/user-management/UserFiltersBar.tsx`
  - `src/components/admin/user-management/BulkActionsBar.tsx`
  - `src/components/admin/user-management/UserDetailDrawer.tsx` (with internal tab components, or split into `UserDetail{Overview,Lms,Wiki,Groups,Audit}.tsx` if it gets long)
  - `src/lib/exportUsersCsv.ts`
- Modify:
  - `UserManagement.tsx` — owns filter state, selection state (Set of user IDs), passes both to grid; renders filter bar + bulk bar + grid + drawer.
  - `UserGrid.tsx` / `UserCard.tsx` — accept `selected`, `onToggleSelect`, `onOpenDetail`; render checkbox; clicking the card body (outside the action menu) opens the drawer.
  - `filterUsers` in `userRoleUtils.ts` — extend to apply role/group/status/activity filters in addition to the search term.
- No schema changes. All data already exists: `profiles`, `user_roles`, `groups` + `group_members`, `course_assignments`, `user_course_progress`, `user_wiki_streaks`, `wiki_article_views`, `user_role_audit`, `user_management_audit`.
- Bulk ops use existing services (`updateUserRoleSafe`, password reset, deactivate) so RLS and audit trails stay intact.

## Out of scope (can be follow-ups)

- Saved filter views.
- Invite-by-email / Pending tab.
- CSV import.
- Tab-bar reorg (Diagnostics/Data Check under a Tools tab).
- "Impersonate / view as user".
