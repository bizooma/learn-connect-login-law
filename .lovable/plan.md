
## Goal

Replace the current lightweight `ShareGroupsPicker` popover with a full **Share** dialog modeled on the Trainual screenshot — adding per-group **Completion**, **Access level**, plus subject-wide **Discoverability** and **Public share** controls.

## UI changes

Open a modal (not popover) from the "Shared with" cell with:

- **Header**: "Share [Subject Title]" + published/draft badge + short helper text.
- **Search people and groups** input (groups for now; people-share can come later).
- **Shared with list**: row per added group
  - Avatar + group name + member count
  - **Completion** column: "Required" checkbox
  - **Access** column: dropdown — `View`, `Edit`, `Full`
  - Remove (×) button
- Owner row pinned at top (read-only, always Full).
- **Discoverability** section: dropdown — `Discoverable` (all users can find/view) / `Not discoverable` (only shared users).
- **Public share** toggle in footer (generates/copies a public link — link generation is out of scope for v1; toggle persists state).
- Footer: Cancel / Save.

The "Shared with" column on the Content page still shows the same compact summary (group names or "N groups" badge); clicking opens the new dialog.

## Data model

Extend `wiki_category_groups` with:
- `access_level` text — `view` | `edit` | `full`, default `view`
- `completion_required` boolean, default `false`

Extend `wiki_categories` with:
- `discoverability` text — `discoverable` | `restricted`, default `discoverable`
- `public_share_enabled` boolean, default `false`

(No new tables. GRANTs already in place on existing tables.)

## Files

- New: `src/components/admin/wiki/ShareSubjectDialog.tsx` — the full modal.
- Modify: `src/components/admin/wiki/ShareGroupsPicker.tsx` → becomes a thin trigger that opens `ShareSubjectDialog` while keeping the same compact display in the table cell.
- Modify: `src/hooks/useWikiCategories.ts` → include `access_level` + `completion_required` in `shared_groups` payload; expose `discoverability` and `public_share_enabled` on category.
- Modify: `WikiCategoryRow.tsx` only if needed to pass the new fields (display unchanged).

## Out of scope (for this pass)

- Adding individual people (non-group) to share list — keep groups-only like today.
- Actually generating/copying a public share URL — toggle stores state only; we can wire URL generation in a follow-up.
- Enforcing access_level/completion_required on the student wiki reader — schema + UI now; enforcement in a follow-up.
