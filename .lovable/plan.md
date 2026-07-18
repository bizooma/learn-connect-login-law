## Problem

When you click a non-page item in the editor's left sidebar (like the "Overview" video), it navigates to `/admin/wiki/content?article=<id>`, but that page ignores the `article` query param and just shows the All Content list. So the click "loses" you back to the top-level view instead of opening the video.

Different content types open in different places in this app:
- **Pages** → `/admin/wiki/pages/:pageId` (WikiPageEditorPage)
- **Flowcharts** → `/admin/wiki/flowchart/:id` (dedicated route)
- **Documents, Videos, Tests, Checklists, Files** → open inside `AdminWikiPage` by setting its internal `editingArticle` state, which renders `WikiArticleEditor`. There is no standalone URL for these today.

## Fix

### 1. Sidebar click routing (`src/pages/WikiPageEditorPage.tsx`)
Route each article by its `content_type`:
- `flowchart` → `/admin/wiki/flowchart/:id`
- If the article has pages → open its first page: `/admin/wiki/pages/:firstPageId`
- Everything else (document with no pages, video, test, checklist, file) → `/admin/wiki/content?article=:id` (AdminWikiPage will open it — see step 2)

### 2. Make AdminWikiPage honor `?article=` (`src/pages/AdminWikiPage.tsx`)
On mount and whenever the query string changes:
- Read the `article` search param.
- If present, fetch that article from `wiki_articles` by id.
- Set `activeCategoryId` to the article's `category_id` (so the surrounding context matches) and set `editingArticle` to the fetched article. This triggers the existing `WikiArticleEditor` render path — the same view you get when you click the item from the All Content tree.
- If the article is a `flowchart`, redirect to `/admin/wiki/flowchart/:id` instead (matches the existing `openArticle` behavior).

### 3. No other changes
Pages already work correctly. The sidebar tree, highlighting, and unsaved-changes prompt stay as they are.

## Result

Clicking "Overview (Video)" in the sidebar opens that video in the article editor view instead of dumping you back to the All Content list. Same for tests, files, checklists, and empty documents. Flowcharts go straight to the flowchart route.
