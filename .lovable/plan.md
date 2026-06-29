## Goal
Make the editor's paragraph text render at a normal weight and color (matching the "Back to Content" link), and remove the non-working "Un-bold all" button.

## Changes

1. **Remove the "Un-bold all" button** from `src/components/admin/wiki/RichTextEditor.tsx` toolbar.

2. **Sanitize legacy bold on load** in `src/pages/WikiPageEditorPage.tsx`:
   - After fetching `wiki_pages.content`, strip `<strong>` / `<b>` wrappers and `font-weight` inline styles before passing to the editor. This is why "Un-bold all" appeared to do nothing — selectAll+unsetBold only acts on TipTap mark nodes; the existing content has hard-coded `<strong>` tags inside paragraphs that TipTap may also be treating as text styling that doesn't unset cleanly in one call.
   - Run the same sanitize step on save so the cleaned version persists.

3. **Force normal paragraph weight in the editor surface** in `RichTextEditor.tsx`:
   - Update the `EditorContent` prose classes so `p`, `li`, `strong`, and `b` all render at `font-weight: 400` and `text-foreground` by default. Headings keep their bold.
   - This guarantees body copy looks like the "Back to Content" text regardless of any residual inline weight.

4. **Keep bold functional going forward**: the Bold toolbar button still applies a TipTap `bold` mark, which we'll style explicitly (e.g. `[data-bold] { font-weight: 700 }`) so newly bolded text shows weight, but un-styled paragraphs never inherit it.

## Files touched
- `src/components/admin/wiki/RichTextEditor.tsx`
- `src/pages/WikiPageEditorPage.tsx`

No database or schema changes.