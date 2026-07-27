
# P&P Permission Levels

Scope: Policies & Procedures (wiki) only. Does not affect LMS access, LMS roles, admin dashboard, or any existing `app_role` values (admin/owner/student/etc.).

## The 4 levels (P&P-only)

| Level | What they can do in P&P |
|---|---|
| **Admin** | Manage entire P&P: create/edit/delete any subject, manage settings, manage other users' P&P permissions. Does NOT grant LMS admin. |
| **Author** | Create new subjects; publish, share, and edit any subject shared with them. |
| **Contributor** | Edit subjects they're assigned to. Edits to unpublished content require review/publish by Author or Admin. |
| **General** (default) | View subjects they're assigned to. |

A real LMS admin (existing `user_roles.role = 'admin'` or `'owner'`) is automatically treated as P&P Admin — we don't need to double-assign them.

## Where admins set it

**1. Directory column (primary)**
- New "P&P Access" column on `/admin/wiki/directory` between Role and Department.
- Renders as a colored pill showing the user's current level ("General" by default).
- Clicking the pill opens the exact dropdown from your screenshot (label + description per option, checkmark on current).
- Selection saves inline with a toast. No modal.
- LMS admins/owners show a locked "Admin (LMS)" pill with tooltip "Inherited from LMS role" — not editable here.

**2. Row hamburger menu (secondary)**
- Add "Set P&P permission →" item to the existing row `...` menu, opens the same dropdown.
- Covers admins already deep in a row's actions.

**3. Bulk (small addition)**
- The Directory already has row checkboxes; add a "Set P&P permission" action to the existing bulk action bar. Same dropdown, applied to all selected non-LMS-admin users.

## Where the levels take effect

Only the P&P UI reads this — no LMS surface changes.

- **`useWikiAccess.ts`** — new `getPnpLevel()` helper. If level is Admin → treat like current admin (full on everything). Author/Contributor/General → keep existing per-category share logic on top; the level only raises the floor:
  - General: unchanged from today (view discoverable + explicitly shared).
  - Contributor: can edit shared items; edits to unpublished content don't publish (surface a "Submit for review" state — deferred, tracked as follow-up).
  - Author: can create new subjects (new-subject button gated on `level >= author`), plus current share behavior.
  - Admin: same as current wiki admin gate (`is_nfu_staff`-style bypass).
- **Wiki header/sidebar tab visibility** — anyone with level ≥ General sees the "Policies & Procedures" tab (replaces the current `isTester` hack we've been using to grant access). Existing testers get migrated to General.
- **"New Subject" / category create buttons** — gated on level ≥ Author.
- **Manage Users / Settings pages under `/admin/wiki/account/*`** — gated on level = Admin (P&P Admin or LMS admin).

## Data model

New table `public.wiki_permissions` (no changes to `user_roles`, no changes to `app_role` enum):

```
id uuid pk
user_id uuid unique references profiles(id)
level text check (level in ('admin','author','contributor','general'))
granted_by uuid
created_at, updated_at
```

- Absence of a row = "general" (implicit default), so we don't need to backfill every user.
- New security-definer helper `public.pnp_permission_level(_user_id uuid)` returns:
  - `'admin'` if user has LMS role `admin` or `owner`, OR row in `wiki_permissions` with level `'admin'`
  - Otherwise the row's level, or `'general'` as fallback.
- Wiki RLS policies (`wiki_categories/_articles/_pages`) get updated to use `pnp_permission_level(auth.uid()) >= 'general'` for the tab-visibility gate (replacing today's tester gate).
- Full/Edit/View on individual subjects still flows through the existing `wiki_category_users` / `wiki_category_groups` share rows — the level is orthogonal to per-subject sharing.

## Migration of existing state

- All current `tester`-role users → seed a `wiki_permissions` row at `'general'`. Tester role itself remains for other uses.
- The 7 @newfrontier.us users I just added yesterday are covered by this.
- No changes to who can see what today; this only adds the ability to grant Author/Contributor going forward.

## Out of scope (call out for later)

- Contributor "Submit for review" workflow (draft edits queued for Author approval) — needs its own design pass.
- Per-subject overrides UI already exists in the subject share dialog; not changing it.
- No LMS role changes, no changes to `AdminDashboardHeader`, `StudentMainHeader`, or `useUserRole`.

## Files touched

- New migration: `wiki_permissions` table + `pnp_permission_level()` fn + RLS updates on wiki tables + seed tester → general
- New: `src/hooks/useWikiPermission.ts`
- Edit: `src/hooks/useUserRole.tsx` — `canAccessWiki` reads `wiki_permissions` (falls back to today's admin/owner/tester)
- Edit: `src/pages/AdminWikiDirectoryPage.tsx` — new column, pill dropdown, bulk action, row-menu item
- Edit: `src/hooks/useWikiAccess.ts` — merge P&P level into `getAccess`
- Edit: wiki category/subject "New" buttons — gate on `level >= author`

Rough size: 1 migration, ~5 file edits, no visual changes outside the Directory + wiki create buttons.
