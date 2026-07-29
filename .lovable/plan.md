# Fix: Wiki sidebar flashes/reloads on every nav click

## Problem
Clicking any page or article in the wiki document sidebar makes the whole sidebar show the "Loading…" state for a moment before repainting. It looks like a full refresh.

## Root cause
In `src/components/admin/wiki/WikiDocumentSidebar.tsx`, the React Query key is:

```
queryKey: ["wiki-document-sidebar", categoryId, activeArticleId]
```

`activeArticleId` changes on every navigation, so React Query treats each click as a new query and refetches the entire tree — even though the underlying data (articles + pages for the category) is the same.

Also, when navigating from an article-level route to a page route, `categoryId` can be `null` on the first render, which briefly changes the key again.

## Fix
Scope the query to the category only, and resolve the category id up front so the key stays stable across article/page clicks within the same subject.

1. Compute a stable `resolvedCategoryId` before the query:
   - Prefer the `categoryId` prop.
   - Otherwise, use `location.state.activeCategoryId` (already passed on navigation).
   - Only fall back to looking it up from `activeArticleId` (in a tiny secondary query) when neither is available — cached by `activeArticleId` so it runs at most once per article.
2. Change the main query to `queryKey: ["wiki-document-sidebar", resolvedCategoryId]` and enable it only when `resolvedCategoryId` is set.
3. Add `placeholderData: (prev) => prev` (keep previous data) so even in edge cases where the key does change, the sidebar doesn't flash empty.

## Files touched
- `src/components/admin/wiki/WikiDocumentSidebar.tsx` — only file changed.

No schema changes. No behavior changes beyond removing the reload flash; active-item highlighting, preview-as-staff filtering, and Knowledge Check link continue to work the same.
