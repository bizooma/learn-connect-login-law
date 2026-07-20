## Problem

In the document sidebar (`WikiDocumentSidebar.tsx`), clicking an article name that has child pages currently jumps to the first page instead of opening the article itself. That's why clicking "Overview" in the sidebar takes you into "Purpose & Targets" (its first page) and there's no way to return to the Overview article editor with its Title/Tags/Notes content.

## Fix

Update `openArticle` in `src/components/admin/wiki/WikiDocumentSidebar.tsx` so clicking an article row always navigates to the article editor route (`/admin/wiki/content?article=<id>`), except for flowcharts which keep their dedicated route. The child page rows underneath still navigate to the individual pages, so nothing is lost — you can now click the article header to view/edit the article, or click a page below it to open that page.

No schema changes. No other components affected.