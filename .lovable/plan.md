## Goal

Add a **Directory** view inside the Policies & Procedures area (`/admin/wiki/directory`) that mirrors the Trainual "Manage Users" screen and lists every active user with a `@newfrontier.us` email, pulled from the existing `profiles` table. No new data — read-only view of users already in the LMS database.

## What you'll see

A table matching the screenshot:

| Avatar + Name | Status | Job Title | Email | (kebab menu) |

Plus:
- Search bar (name / email / job title)
- Result count ("Showing X of Y")
- Pagination (20 per page) to match Trainual's pattern
- Empty/loading states

Phase 1 omits the **Groups** column and the bulk-select checkboxes — we don't have a "Groups" concept yet in the P&P system. We can layer that on later when we decide whether Groups = Teams, Roles, or something new for P&P.

## Navigation

Add a **"Directory"** entry to the existing `WikiSidebar` (under a new "People" section, matching Trainual's left nav). Selecting it routes to `/admin/wiki/directory`. The existing categories list stays untouched.

## Technical details

**Data**
- New hook `useDirectoryUsers.ts` — queries `profiles` where `email ILIKE '%@newfrontier.us'` and `is_deleted = false`, ordered by `first_name`. Returns `{ id, first_name, last_name, email, job_title, profile_image_url }`. Status is derived as "Active" for now (we don't track invite state on `profiles`); column is included so the UI matches Trainual and we can wire real status later.
- No schema changes, no migration — RLS on `profiles` already allows admins to read.

**Routing**
- Add route `/admin/wiki/directory` in `App.tsx` pointing to a new `AdminWikiDirectoryPage`.

**New files**
- `src/pages/AdminWikiDirectoryPage.tsx` — wraps `AdminDashboardHeader` + `WikiSidebar` (reused) + the directory table, so the P&P shell stays consistent.
- `src/components/admin/wiki/directory/DirectoryTable.tsx` — table, avatars (fallback to initials), status badge, kebab placeholder.
- `src/components/admin/wiki/directory/DirectorySearchBar.tsx` — search input.
- `src/hooks/useDirectoryUsers.ts` — react-query hook described above.

**Modified files**
- `src/components/admin/wiki/WikiSidebar.tsx` — add a "People → Directory" menu item with active-state styling, navigating via `useNavigate`.
- `src/App.tsx` — register the new route behind the existing admin guard used by `/admin/wiki`.

## Out of scope (call out for later)

- Groups column / group management
- Inviting or editing users from this screen (LMS user management already handles create/edit; we can add a "Manage in LMS" link from the kebab menu)
- Real invite-status tracking
- Bulk actions
