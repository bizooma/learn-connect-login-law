

## Policies & Procedures Wiki — Implementation Plan

### Overview

Add a new **Policies & Procedures** section to the LMS, modeled after the Trainual-style wiki interface shown in the screenshot. During development, it will only be accessible from the admin dashboard. The wiki allows organizing company policies and process documentation in expandable categories with searchable content.

### What Gets Built

**1. Database Tables (3 new tables)**
- `wiki_categories` — top-level groupings (e.g., "Opening a New Case", "Client Final Review") with title, description, icon, sort_order, access_level, published status
- `wiki_articles` — individual articles within a category, with title, rich text/markdown content, sort_order, tags (Subject, Process, etc.), published status, author, created/updated timestamps
- `wiki_article_groups` — many-to-many linking articles to user groups/teams for access control (future use)

**2. Admin Wiki Management Page**
A new tab "Policies & Procedures" added to the admin dashboard navigation under Content Management. The page includes:

- **Left sidebar** (collapsible) — shows the company logo and navigation: Home, Content > All Content, and future sections
- **Main content area** — Trainual-style list view showing:
  - Search bar at top ("Search or ask a question")
  - Each category as an expandable row showing: title, item count, tags (Subject/Process), group assignments, author avatar, and a kebab menu for actions
  - Clicking a category expands to show its articles
  - Each article row is clickable to open the article editor/viewer

- **Category CRUD** — Create, edit, reorder, delete categories
- **Article CRUD** — Create, edit (markdown editor), reorder, delete articles within categories
- **Search** — Filter categories and articles by title/content
- **Tags** — Visual tag badges (Subject, Process, etc.) on each item

**3. Article Editor**
- Markdown-based editor using the existing `MarkdownRenderer` component for preview
- Title, content, tags, published toggle
- Save/publish workflow

**4. Admin Dashboard Integration**
- New "Policies & Procedures" tab added to `AdminNavigationDropdown.tsx` under Content Management
- New case in `AdminManagementTabs.tsx` to render the wiki management component
- No changes to student-facing pages yet

### UI Design (matching screenshot)

The list view will mirror Trainual's clean table layout:
- White background, subtle row borders
- Expand arrow on the left of each category
- Category icon + title + item count
- Right-aligned metadata: tag badges, group count, author avatar, kebab menu
- Search bar with magnifying glass icon at top

### Files to Create
- `supabase/migrations/xxx_create_wiki_tables.sql` — database migration
- `src/components/admin/wiki/WikiManagement.tsx` — main container
- `src/components/admin/wiki/WikiCategoryList.tsx` — category list view
- `src/components/admin/wiki/WikiCategoryRow.tsx` — individual category row
- `src/components/admin/wiki/WikiArticleList.tsx` — articles within expanded category
- `src/components/admin/wiki/WikiArticleRow.tsx` — individual article row
- `src/components/admin/wiki/WikiArticleEditor.tsx` — create/edit article
- `src/components/admin/wiki/WikiCategoryDialog.tsx` — create/edit category dialog
- `src/components/admin/wiki/WikiSearchBar.tsx` — search component
- `src/hooks/useWikiCategories.ts` — data hook for categories
- `src/hooks/useWikiArticles.ts` — data hook for articles

### Files to Modify
- `AdminNavigationDropdown.tsx` — add "Policies & Procedures" under Content Management
- `AdminManagementTabs.tsx` — add wiki case to render `WikiManagement`
- `supabase/types` — will auto-update after migration

### Future (not in this phase)
- Student-facing wiki reader view
- Role-based article access
- Article versioning/history
- PDF export of procedures

