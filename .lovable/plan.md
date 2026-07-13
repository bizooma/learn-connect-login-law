# Bulk Assign Managers via Spreadsheet

Add a new admin tool that accepts a spreadsheet of staff names + manager names, matches each to existing profiles, and writes `manager_id` on the staff profile — the same field the "Manager" picker on each user card already updates.

## Where it lives

New tab **"Assign Managers"** in Admin → User Management (alongside the existing CSV user import). Nothing on the user cards changes.

## Input file

- Accepts `.csv`, `.xlsx`, `.xls`
- Two required columns (header row, case-insensitive): `staff_name`, `manager_name`
- A downloadable template with those headers + an example row

## Matching logic (names → profiles)

For each row we look up profiles in `profiles` (excluding `is_deleted`):

1. Split the name into first + last (last token = last name, everything before = first name).
2. Case-insensitive exact match on `first_name` + `last_name`.
3. If exactly one match → use it.
4. If zero or multiple matches → skip the row and record it in the report.

Rows where staff and manager resolve to the same profile are also skipped (a user cannot manage themselves).

## Preview + confirm flow

1. Upload file → parsed in the browser.
2. Show a preview table: staff name, manager name, resolved staff, resolved manager, status (`Ready`, `Staff not found`, `Manager not found`, `Ambiguous staff`, `Ambiguous manager`, `Self-assignment`).
3. Admin clicks **Apply** → only `Ready` rows are written.
4. After apply, show a summary: X updated, Y skipped, with a downloadable CSV of skipped rows and reasons.

Writes go through the existing Supabase client using the admin's session; the current RLS policy that lets admins update `profiles.manager_id` (already used by the user card) is reused — no schema or policy changes.

## Technical notes

- New component: `src/components/admin/user-management/ManagerAssignmentImport.tsx`
- New hook: `src/hooks/useManagerAssignmentImport.ts` — handles parsing, matching, and batched updates.
- Parsing: `papaparse` for CSV (already common) and `xlsx` (SheetJS) for Excel; add `xlsx` if not present.
- Register the new tab in `src/components/admin/user-management/UserManagementTabs.tsx`.
- Fetch all non-deleted profiles once (id, first_name, last_name, email) and match in memory to avoid N queries.
- Updates run in chunks of ~50 with `supabase.from('profiles').update({ manager_id }).eq('id', staffId)`; failures per row are captured in the report.
- No edge function needed — this is a client-side admin action mirroring the existing per-card update.

## Out of scope

- Creating missing users (skip-and-report only, per your choice).
- Changing `team_leader_id` (only `manager_id`).
- Any change to the user card UI.
