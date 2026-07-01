## Scope
Filter the P&P People Report (and related P&P user listings) to only show users whose email ends with `@newfrontier.us`. No database deletions or schema changes.

## Changes

1. **`src/hooks/useWikiRequirementReports.ts`**
   - Add `.ilike("email", "%@newfrontier.us")` to the `profiles` query so all downstream `people`, `cells`, and `peopleById` maps only include newfrontier users. Content report's required-user counts will also naturally exclude non-newfrontier users.

2. **`src/pages/AdminWikiManageUsersPage.tsx`** (P&P Manage Users)
   - Add the same email filter at the query/filter layer so the P&P user list matches.

3. **`src/components/admin/wiki/reports/UserRequiredSubjectsDialog.tsx`** and **`SubjectUserProgressDialog.tsx`**
   - No change needed if they read from the already-filtered hook data; verify during build.

## Out of scope
- LMS admin user management (unchanged).
- No deletions, no schema edits.
