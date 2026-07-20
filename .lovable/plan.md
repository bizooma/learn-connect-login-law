# Fix "Preview as Staff" leakage and related bugs

Four targeted fixes so preview mode actually shows what a non-admin sees, stops polluting completion data, stops eating unsaved edits, and stops feeling "stuck on."

## 1. Filter lists to what a staff member could actually see

Reuse `canView` from `src/hooks/useWikiAccess.ts` (it already forces `isAdmin=false` in preview).

- `src/pages/AdminWikiPage.tsx`: when `previewAsStaff` is true, filter the category array passed to both the flat list and the By-Team grouping through `canView(category)` before any other sort/filter.
- `src/components/admin/wiki/WikiCategoryList.tsx` and `WikiCategoryListByTeam.tsx`: no logic change needed if filtering happens upstream, but confirm neither re-injects hidden categories.
- `src/components/admin/wiki/WikiArticleList.tsx`: when preview is on, hide articles where `is_published === false`.
- `src/components/admin/wiki/WikiPagesList.tsx` and the sidebar (`WikiDocumentSidebar.tsx`): when preview is on, hide unpublished pages and hide articles whose parent category is not viewable.
- Admin-only affordances ("Add new…", upload, Knowledge Check admin row) are already gated by `!previewAsStaff` — leave as-is.

No behavior change when preview is off.

## 2. Don't record completions for admins / preview

In `src/pages/WikiPageEditorPage.tsx`, wrap the `mark_wiki_page_complete` RPC call so it only fires when `!previewAsStaff && !isAdmin && !isOwner`. Everything else in that effect stays the same.

## 3. Preview must not discard unsaved edits

In `src/pages/WikiPageEditorPage.tsx`:

- Remove the effect that clears `dirty` when `previewAsStaff` flips true.
- Subscribe to the preview state via a wrapper: when preview is about to turn on locally and `dirty` is true, `window.confirm("You have unsaved changes — save before previewing? OK to continue and discard, Cancel to keep editing.")` and only enable preview if the user confirms. If they cancel, revert the toggle.
- For cross-tab flips (storage event): if `dirty` is true when the incoming event would enable preview, keep this tab editable (ignore the flip locally) and surface a toast: "Preview enabled in another tab — this tab kept editable to protect unsaved changes." Simplest, least destructive; does not try to un-toggle the other tab.
- Keep read-only rendering when preview is genuinely on with no unsaved edits. Do not wipe `content`.

## 4. sessionStorage becomes the single source of truth

In `src/hooks/usePreviewAsStaff.ts`:

- `read()` returns only `sessionStorage.getItem(KEY) === "1"`.
- On module init (or in a small `usePreviewAsStaffBootstrap` effect mounted once high in the tree — e.g., `App.tsx`), if the URL has `?staffPreview=1`, write the sessionStorage flag, strip the param from the URL with `history.replaceState`, then dispatch the change event. One-time consumption.
- `withPreviewAsStaffParam` stays so opening a link in a new tab inherits preview via the one-time URL signal; it just no longer drives `read()` after bootstrap.
- `disable()` already clears both storage and URL — unchanged.

## Acceptance

- Preview on: admin sees exactly the subjects, articles, and pages a staff member in the same groups would see; no drafts, no unshared, no non-discoverable content.
- Opening/previewing a page as an admin or owner inserts no `wiki_page_completions` row. Staff completions unchanged.
- Editing a page then toggling preview prompts before losing work; cross-tab preview flip never wipes local edits.
- "Exit preview" turns preview off and it stays off across navigation.

## Technical notes

- All filtering is client-side; RLS already enforces the real boundary for actual staff accounts.
- No schema changes.
- Files touched: `src/pages/AdminWikiPage.tsx`, `src/components/admin/wiki/WikiArticleList.tsx`, `src/components/admin/wiki/WikiPagesList.tsx`, `src/components/admin/wiki/WikiDocumentSidebar.tsx`, `src/pages/WikiPageEditorPage.tsx`, `src/hooks/usePreviewAsStaff.ts`, and a small bootstrap hook mount in `src/App.tsx`.
