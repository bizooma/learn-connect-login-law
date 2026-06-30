# Plan: Policies & Procedures Test Plan (Markdown Artifact)

Create a downloadable `.md` file at `/mnt/documents/PP_Test_Plan.md` covering every feature we've built into the P&P system, then surface it via a `<presentation-artifact>` tag.

## Deliverable

A single Markdown document, ~800-1200 lines, organized by feature area with numbered test cases. Each case includes: ID, Title, Role(s), Preconditions, Steps, Expected Result, and Pass/Fail checkbox.

## Sections to cover

1. **Access & Roles**
   - Admin/Owner/Tester role gating
   - Sidebar visibility (Settings, Manage Users admin-only)
   - Tester role: LMS unchanged + P&P button visible
   - Non-admin/non-tester cannot reach P&P

2. **Navigation & Layout**
   - Sidebar Home, All Content, Training Paths links
   - Yellow secondary header on every P&P page
   - Footer present, year shows 2026
   - Sidebar collapse/expand
   - Welcome modal suppressed

3. **Content – Subjects (Categories)**
   - Create subject (with category: Policy/Procedure/Company, owner)
   - Filter tabs: All Content, Company (butterflies), Policies (snow), Procedures (bunnies) — correct banner per filter
   - Search subjects
   - Resizable columns persist
   - Row actions: Rename, Duplicate, Change category, Copy link, Print PDF, Archive, Edit, Delete
   - Title click → category detail page; chevron → inline expand
   - Owner picker shows avatar + name; assign/clear
   - Shared with column: badge/count rendering

4. **Documents & Pages**
   - Create document under subject (type + owner)
   - Add pages via always-on input
   - Edit page opens full-page editor (not modal)
   - RichTextEditor: fonts, font size, tables, video embed, emoji, icons, file upload, checklists
   - Back to Content returns to `/admin/wiki/content`
   - Delete page via trash icon
   - Flowchart editor: shape nodes, Onboarding sample renders

5. **Knowledge Check**
   - One knowledge check per subject (not per document)
   - Add/edit/delete questions and choices
   - Marking correct answer
   - Appears at bottom of subject

6. **Sharing & Access Levels**
   - Share to Groups (view/edit/full + completion required)
   - Share to Individuals
   - Discoverability: Discoverable (green), Request (yellow), Private (red)
   - Public share toggle
   - RLS enforcement: verify each access level actually restricts in UI
   - Avatars render in share dialog

7. **Training Paths**
   - Drag-and-drop reorder persists
   - Order dropdown count = total subjects

8. **Groups**
   - 33 seeded groups present
   - Filters: All, Role (matches type or job_title), Team (type or "team" in name), Department, Custom
   - Search groups
   - Assign multiple Group Managers
   - Everyone group contains all @newfrontier.us users

9. **Manage Users**
   - Add user with password (no validation error on names)
   - User cards: split LMS / P&P design
   - Inline edit: job title, department (7 options), manager, tester toggle
   - Filters bar + bulk actions
   - User detail drawer: audit log, wiki stats
   - Hamburger row menu works in DirectoryTable
   - Subject groups dialog from user card

10. **Settings**
    - Branding (org-branding bucket upload)
    - People tab: Directory/People Chart/Role Chart toggles enforce visibility
    - Gamification: streak frequency (weekly/monthly/quarterly) + live preview card updates
    - Share reports with direct reports toggle
    - Persistence across reload

11. **Reports**
    - Content, People, Activity reports load
    - People report: View Details → per-subject progress dialog
    - Non-admin manager sees only direct reports when enabled
    - Resizable columns on all report tables

12. **Streaks (P&P)**
    - Viewing a wiki article logs view
    - Streak increments per configured frequency
    - WikiStreakCard renders on Home

13. **Print / Export**
    - Print PDF action opens print dialog with formatted subject content

14. **Cross-cutting**
    - All admin pages full-width
    - Column resize works on every table
    - No console errors on key flows
    - Mobile/responsive sanity check

## Format per test case

```
### TC-XXX – <title>
- Role: Admin | Tester | User
- Preconditions: …
- Steps:
  1. …
- Expected: …
- [ ] Pass  [ ] Fail  Notes:
```

Plus a header with: purpose, scope, environment (preview + published URLs), test data prerequisites (admin login, sample group, sample subject), and a summary results table.

## Output

- Write file to `/mnt/documents/PP_Test_Plan.md`
- Emit `<presentation-artifact path="PP_Test_Plan.md" mime_type="text/markdown"></presentation-artifact>` so the user can download it.
