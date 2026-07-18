No questions — the expected behavior is clear.

Plan:
1. Create one reusable document navigation sidebar for wiki editing screens.
   - It will render the selected subject/category exactly like the expanded All Content tree: subject title, article rows, content type labels, and nested pages under document articles.
   - It will replace the main Wiki sidebar whenever an admin is inside a specific subject item/page instead of browsing All Content.

2. Use that sidebar in every wiki edit/view flow.
   - Page editor route: `/admin/wiki/pages/:pageId`
   - Article editor modal/page state: videos, files, tests/checklists, and other non-page article types opened from `/admin/wiki/content?article=...`
   - Flowchart editor route: `/admin/wiki/flowchart/:articleId`

3. Fix item routing from the sidebar.
   - Page clicks open the page editor.
   - Document/article clicks with pages open the first page.
   - Video/file/test/checklist clicks open the article editor while keeping the document sidebar visible.
   - Flowchart clicks open the flowchart editor while keeping the document sidebar visible.

4. Add active highlighting so the sidebar shows exactly where the admin is.
   - Highlight the current article for video/file/test/checklist/flowchart items.
   - Highlight the current page inside its parent document for page editing.

5. Update back navigation to preserve context.
   - “Back to Content” should return to the selected subject/category expanded, not dump the admin into the generic All Content view unless they explicitly choose All Content.

6. Verify the flow manually in the preview.
   - Open a subject from All Content.
   - Click Overview/video and confirm it opens with the document sidebar, not the main sidebar.
   - Click a nested page and confirm the same sidebar remains.
   - Click flowchart/non-page items and confirm navigation stays inside the same document tree.