## Goal

Restructure the Wiki to match Trainual's model:
- **Subjects** = containers/folders (each row in the All Content list)
- **Categories** = a small fixed taxonomy tag on each Subject: **Policy**, **Procedure**, or **Company**
- **Content items** (Document, Flowchart, Video, File, Checklist, Test) live *inside* a Subject

Today's system confuses these: our `wiki_categories` table is actually being used as Subjects, and we have no real "Policy / Procedure / Company" categorization.

## Data Model Changes

Rename and add, without losing existing data:

1. **Keep `wiki_categories` table** but treat it semantically as **Subjects** (no table rename needed — internal only). Add a new column:
   - `category` enum: `'policy' | 'procedure' | 'company'` (default `'company'`)
2. **Keep `wiki_articles`** as-is — these are the content items inside a Subject. The existing `content_type` column already drives the 7 create-type icons.
3. Backfill: set `category = 'company'` on all existing rows.

No destructive changes; only an additive column + enum.

## UI Changes

### `AdminWikiPage.tsx` (All Content view)
Match the screenshot layout:
- Page title: **Content**
- Top filter tabs: **All content | Company | Policies | Processes** — filter Subjects by their `category` value
- Each row = one Subject, showing: title, item count, **Category badge** (Policy / Procedure / Company with the matching icon + color), owner, actions
- Expanding a Subject row reveals its content items (Documents, Videos, Tests, etc.) — already implemented via the accordion

### Create flow (`CreateContentMenu` + dialogs)
- **Create → Subject**: opens the existing category dialog, now with an added required **Category** picker (Policy / Procedure / Company)
- **Create → Document / Flowchart / Video / File / Checklist / Test**: unchanged; first asks which Subject to add it to, then opens the type-specific editor

### Sidebar (`WikiSidebar.tsx`)
- Rename the "Categories" section heading to **Subjects**
- The list under it remains the same Subjects, unchanged behavior

## Out of Scope (this plan)

- No changes to article editors, file uploads, or the Flowchart/Checklist/Test stub editors
- No new permissions / RLS changes — existing policies cover the new column
- No rename of the `wiki_categories` SQL table (internal-only; avoids a risky migration)

## Files Touched

- **Migration**: add `category` enum + column on `wiki_categories`, backfill `'company'`
- `src/hooks/useWikiCategories.ts` — include `category` in select / create / update types
- `src/components/admin/wiki/WikiCategoryDialog.tsx` — add Category picker field
- `src/pages/AdminWikiPage.tsx` — add the 4 filter tabs, filter Subjects by category
- `src/components/admin/wiki/WikiCategoryList.tsx` (and row component) — render the Category badge column
- `src/components/admin/wiki/WikiSidebar.tsx` — rename heading to "Subjects"
- `src/components/admin/wiki/CreateContentMenu.tsx` — relabel "Subject" helper text to clarify it's a container with a Category

After approval I'll implement in that order and verify the All Content page renders the 4 tabs and the Category badge on each Subject row.
