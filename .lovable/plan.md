## Plan

Fix the wiki page editor so both article headers and child pages behave consistently when navigating inside the document sidebar, with no schema changes.

1. **Stabilize page-to-page navigation**
   - Update `WikiPageEditorPage.tsx` so every `pageId` change fully resets the editor load state, title, content, dirty state, and active page/article context before rendering the new page.
   - Prevent stale content from one page from lingering while the next page is loading.

2. **Force the rich text editor to load the correct page content**
   - Remount or key the `RichTextEditor` by the active page ID so Tiptap does not reuse an old editor instance when moving between pages.
   - Keep the existing editor behavior, toolbar, save button, and AI button intact.

3. **Preserve the document sidebar workflow**
   - Keep article-row clicks opening the article editor.
   - Keep child-page clicks opening the individual page editor.
   - Ensure the active page highlight and active article context remain correct as the user clicks around.

4. **Validate the exact workflow**
   - Test opening an Overview/article, clicking into child pages, clicking back to a previous page, and repeating that cycle.
   - Confirm page content is visible after returning, not blank.
   - Confirm no schema, Supabase table, or edge function changes are made.