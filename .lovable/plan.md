The Content page is constrained by a `max-w-5xl mx-auto` wrapper in `src/pages/AdminWikiPage.tsx` (line 154), which caps the table to ~1024px regardless of screen size — that's why columns feel cramped.

## Change
- In `src/pages/AdminWikiPage.tsx`, replace the `max-w-5xl mx-auto` wrapper with a full-width wrapper (`w-full` with horizontal padding) so the All Content table, filter tabs, banner, and search bar all expand to fill the available space.
- Leave everything else (sidebar, header, row layout, resizable columns) untouched.

Result: the table spans the full preview width, giving the Shared With / Owner / Status columns more room without changing any data or behavior.