# Wiki Organization Features

All work is UI-only inside `src/pages/AdminWikiPage.tsx`, `src/components/admin/wiki/*`, and `src/components/admin/wiki/WikiArticleEditor.tsx`. No schema changes — uses existing `wiki_categories`, `wiki_articles.tags`, and `wiki_category_groups`/`groups` data already loaded by `useWikiCategories` and `useWikiArticles`.

## 1. "Browse by Team/Function" view toggle

In `AdminWikiPage.tsx`, add a segmented toggle above the search bar (visible only in the All Content view, not when a single subject is opened):
- **Training order** (default) — current flat `WikiCategoryList`.
- **By Team** — grouped presentation.

New component `WikiCategoryListByTeam.tsx`:
- Input: same `filteredCategories` array.
- Build a `Map<groupId, { name, subjects: WikiCategory[] }>` by iterating each subject's `shared_groups` (already present on `WikiCategory`). Subjects in multiple groups appear in each bucket. Subjects with `shared_groups.length === 0` go into an "Unassigned" bucket rendered last.
- Render each bucket as a collapsible section (reuse existing chevron pattern) with header `Group name · N subjects`, containing a `WikiCategoryList` of that bucket's subjects. All existing row behavior (expand, edit, share, etc.) is preserved because we're re-rendering the same rows.
- Sort buckets alphabetically by group name; Unassigned pinned to the end.
- Active-state highlight uses brand yellow `#FFDA00` on the toggle button.

View mode stored in local `useState<'training'|'team'>('training')`.

## 2. Sort options (Training order view only)

Add a `Select` dropdown next to the view toggle with options:
- Training order (default) — existing `sort_order` asc
- A–Z — `title` asc (case-insensitive)
- Recently updated — `updated_at` desc
- Owner — by `owner.last_name || owner.first_name || owner.email`, unassigned last

Completion option is omitted (not present on `WikiCategory`).

Client-side sort applied to `filteredCategories` before passing to `WikiCategoryList`. Hidden in "By Team" view (buckets have their own alpha order internally).

## 3. Tags on documents

**Editor (`WikiArticleEditor.tsx`)** — the existing comma-separated `Input` is replaced with a proper chip input:
- Show current `article.tags` as removable chips (yellow `#FFDA00` background, black text, small × button).
- Text input below; Enter or comma commits a new tag (trimmed, deduped, lowercased for compare but stored as typed).
- Backspace on empty input removes last chip.
- `handleSave` continues to pass `tags` array through the existing `onSave` → `updateArticle` mutation (already supports `tags`).

**Row display (`WikiArticleRow.tsx`)** — already renders `article.tags` as chips; restyle to match the yellow chip design used in the editor for consistency. No logic change.

**Tag filter bar** — new `WikiTagFilterBar.tsx` shown in All Content view above the list:
- Collect the union of tags from all articles across the currently visible subjects (fetch via a lightweight `useQuery` on `wiki_articles` selecting `id, category_id, tags` — no schema change, standard read).
- Render each unique tag as a toggleable chip; selecting one or more filters the visible subjects to those whose articles include ANY selected tag (OR semantics). Selected chips use `#FFDA00`.
- Hidden when there are zero tags anywhere (initial state, since column is currently empty — surfaces automatically once tags are added).
- A subject with at least one matching tagged article stays visible; in expanded state, `WikiArticleList` receives the selected tags and dims/hides non-matching rows (pass through as a new optional prop, defaulting to no-op).

## Verification checklist

- Toggle switches between flat and grouped views; grouped view shows real group names from `wiki_category_groups`, duplicates across groups, and an Unassigned bucket.
- Sort dropdown reorders the flat list for all four options; persists while typing in search.
- Adding a tag in the editor saves it (round-trips through `updateArticle`), appears as a chip on the article row, and appears in the filter bar; toggling the chip narrows the subject list.
- No migrations created; no changes to `src/integrations/supabase/types.ts`.
