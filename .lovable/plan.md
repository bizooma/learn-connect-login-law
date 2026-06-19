## Goal

Create a Home/Dashboard page for the Policies & Procedures section, modeled on the Trainual screenshots. "All Content" becomes a secondary view; the new "Home" becomes the top-level landing route when users click **Policies & Procedures** in the top header.

## Routing changes

- New route: `/admin/wiki` → renders the new `AdminWikiHomePage` (Dashboard).
- Move current All Content view to: `/admin/wiki/content` → renders existing `AdminWikiPage`.
- Top-header "Policies & Procedures" button → navigates to `/admin/wiki`.
- Sidebar gets a new top item **Home** (default route). "All Content" stays under a **Content** group and points to `/admin/wiki/content`.
- Reports / People / Groups routes unchanged.

## New Home page layout

Header: "Home" title with a Dashboard / Activity toggle (Activity reuses the existing Activity report content inline, or links to it — see Questions).

Sections, top to bottom:

1. **Team pulse** — system-generated insights cards (overdue reviews, stalled articles, unverified pages). For v1, derive from existing wiki data:
   - Articles with `updated_at` older than N days and status `published` → "Overdue for review"
   - Articles with status `draft` older than N days → "Unverified pages need review"
   - Empty categories → "Subjects with no content yet"
2. **Insights** (3 stat cards, last 4 weeks):
   - Active users — distinct `user_id` count from `wiki_article_views`
   - Searches made — placeholder 0 with note (we don't track search yet) OR omit
   - Articles viewed — total `wiki_article_views` rows
   Each card shows a small sparkline/bar chart by week.
3. **Completions** — list of users with their P&P completion %, reusing `usePeopleReport`. Paginated, 8 per page, with search.
4. **Content you own** — articles created by the current user (`articles.created_by = auth.uid()`), sorted by recent, with status filter.

## Files

- Create `src/pages/AdminWikiHomePage.tsx` (composes the sections above).
- Create `src/components/admin/wiki/home/TeamPulse.tsx`, `InsightsCards.tsx`, `CompletionsList.tsx`, `ContentYouOwn.tsx`.
- New hook `src/hooks/useWikiHomeStats.ts` for team-pulse + insights aggregation (reuses `wiki_article_views`, `wiki_articles`, `wiki_categories`).
- Edit `src/App.tsx` — add `/admin/wiki/content` route, keep `/admin/wiki` pointing to the new Home page.
- Edit `src/components/admin/wiki/WikiSidebar.tsx` — add **Home** item above the Subjects group; rename current "All Content" entry to live under a **Content** group and navigate to `/admin/wiki/content`.
- Edit the top-header navigation (wherever the "Policies & Procedures" button lives — likely `AdminDashboard` / nav header) so it routes to `/admin/wiki`.

No database changes required — all data comes from existing tables.

## Out of scope (v1)

- Real search analytics (we don't log searches).
- "Time spent vs. saved" chart (no timing data captured).
- Per-insight drill-down pages beyond what already exists.

## Questions before I build

1. **Searches & Time-spent cards** — keep as placeholders ("Coming soon") to match the Trainual layout, or omit entirely?
2. **Activity toggle** — should the Dashboard/Activity toggle at the top of Home actually swap content inline, or just route to the existing `/admin/wiki/reports/activity` page?
