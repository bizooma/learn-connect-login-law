## Goal
Keep the user's place in a document while editing individual pages by showing all pages of the parent article in a persistent left sidebar on the page editor.

## Change
Update `src/pages/WikiPageEditorPage.tsx`:

1. Once the current page loads and we know its `article_id`, use the existing `useWikiPages(article_id)` hook (already imported) to fetch all sibling pages ordered by `sort_order`.
2. Add a fixed-width left sidebar (~260px) alongside the editor:
   - Header showing the parent article title (fetch article title via `wiki_articles` in the same load, or show "Document Pages").
   - Scrollable list of pages. Each item is a button showing the page title with its `sort_order` number.
   - The current page is highlighted (brand yellow `#FFDA00` background / bold).
   - Clicking a page calls `navigate(\`/admin/wiki/pages/${p.id}\`)` — the existing `useEffect` on `pageId` reloads the editor state without leaving the layout.
   - If there are unsaved changes (`dirty`), confirm before navigating away.
3. Layout: wrap the existing header + editor in a right-hand column so the sidebar sits to the left. On small screens, collapse the sidebar (hidden on `<md`, visible `md:block`).
4. Leave the existing "Back to Content" button behavior unchanged.

## Technical notes
- No schema or hook changes; `useWikiPages` already returns the sibling list keyed by `article_id`.
- Only presentational changes to `WikiPageEditorPage.tsx`; no changes to save/AI/completion logic.