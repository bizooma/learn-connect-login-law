

## Separate Wiki from LMS with Dedicated Page and Full Wiki UI

### Overview

Create a dedicated `/admin/wiki` route for Policies & Procedures that is visually distinct from the LMS admin dashboard, while sharing the same header for branding consistency. Add a toggle/switcher in the header to jump between LMS and Wiki. Build out the full wiki reader/management UI with a sidebar, category browsing, and article viewer — even without content yet.

### What Changes

**1. New Route: `/admin/wiki`**
- Add a new route in `App.tsx` pointing to a new `AdminWikiPage` component
- This page gets its own layout separate from the LMS dashboard

**2. Shared Header with LMS/Wiki Switcher**
- Modify `AdminDashboardHeader.tsx` to add a toggle or tab-style switcher (e.g., "LMS" | "Policies & Procedures") that navigates between `/admin-dashboard` and `/admin/wiki`
- Both pages share the same blue header with logo and branding

**3. Full Wiki Page Layout (`AdminWikiPage.tsx`)**
- Uses the shared header with the switcher
- Below the header: a sidebar + main content layout
- **Left Sidebar**: Company logo area, navigation links (Home, All Content), list of categories as a tree/nav
- **Main Content Area**: Search bar at top, then either:
  - Category list view (when no article selected) — shows all categories with expandable article lists, Trainual-style
  - Article viewer/editor (when an article is selected) — shows the article content rendered from markdown, with edit controls for admins
- Empty state with illustration/icon when no content exists yet: "No policies or procedures yet. Create your first category to get started."

**4. Wiki Sidebar Component**
- Collapsible sidebar using Shadcn Sidebar components
- Shows categories as nav items with article counts
- Clicking a category scrolls/filters to that category in the main content
- Active category highlighted
- Collapse button to minimize to icons only

**5. Enhanced Wiki Main Content**
- Reuse existing `WikiManagement.tsx` components (search bar, category list, category rows, article editor)
- Add a welcome/empty state card with an icon and helpful text
- Add breadcrumb navigation when viewing an article

### Files to Create
- `src/pages/AdminWikiPage.tsx` — new page component with sidebar layout
- `src/components/admin/wiki/WikiSidebar.tsx` — sidebar navigation for wiki

### Files to Modify
- `src/App.tsx` — add `/admin/wiki` route
- `src/components/admin/AdminDashboardHeader.tsx` — add LMS/Wiki switcher buttons
- `src/components/admin/wiki/WikiManagement.tsx` — minor tweaks for standalone page use
- `src/components/admin/AdminNavigationDropdown.tsx` — update wiki nav item to link to `/admin/wiki` instead of inline tab

### Navigation Flow
- From LMS dashboard: click "Policies & Procedures" in the header switcher → navigates to `/admin/wiki`
- From Wiki page: click "LMS" in the header switcher → navigates to `/admin-dashboard`
- The wiki nav item in the yellow dropdown will also navigate to `/admin/wiki` instead of rendering inline
- Keep the wiki tab entry in `AdminManagementTabs` as a redirect to the new route for backwards compatibility

