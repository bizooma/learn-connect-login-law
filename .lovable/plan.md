## Goal

Mirror the RLS state that's already live in Supabase (applied out-of-band) into a Lovable migration file. Purely defensive — running it against the current DB is a no-op because everything is created with `CREATE OR REPLACE` / `DROP POLICY IF EXISTS` first. This prevents a future deploy from regenerating older policies and re-opening the cross-tenant leak.

## What the migration will (re)declare

**Helper function**
- `public.is_nfu_staff(_user_id uuid) returns boolean` — `STABLE SECURITY DEFINER`, `search_path = public`. Returns true iff the user is a member of the NFU "Everyone" group (`008118df-8da5-4b7d-8fdb-998d3e86f531`).

**Three tables** — `wiki_categories`, `wiki_articles`, `wiki_pages`. For each:

1. Drop the legacy blanket `is_published = true` read policy if present, along with the current NFU-staff read policy and admin-only gate (so the migration is idempotent).
2. Recreate the NFU-staff-gated permissive SELECT policy: `is_published = true AND public.is_nfu_staff(auth.uid())`. This is the dormant staff-rollout policy — kept in place so removing the gate later restores staff access in one step.
3. Recreate the RESTRICTIVE admin-only SELECT gate: `public.has_role(auth.uid(), 'admin')`. Because it's RESTRICTIVE, it AND-s with every other SELECT policy and effectively makes the wiki admin-only today.

All existing edit/insert/update/delete policies (`can_edit_wiki_category`, `can_view_wiki_category`, etc.) and the "Admins can manage…" policies are left untouched — the migration will not reference them.

## Explicit non-goals (from the answered question)

- No owner/editor carve-out for non-admin content builders (Dulce, Lauren, etc.). Behavior stays as-is: admin-only reads.
- No changes to the 9 "always-true" policies, storage buckets, Postgres version, or leaked-password protection.
- No app/UI code changes.

## Files

- New file (auto-created by the migration tool): a single migration under `supabase/migrations/` containing the SQL above with a clear header comment noting it documents state applied out-of-band on 2026-07-20.

## Verification

After the migration runs against the current DB, re-check `pg_policies` for the three tables — the set of policies should be unchanged (same names, same quals, same permissive/restrictive flags). No app behavior change expected.

## Rollout-to-staff note (not part of this migration)

When you're ready to open the wiki to staff, drop the three `*_admin_only_gate` policies. The NFU-staff read policies recreated here will immediately take effect and external firms remain blocked.
