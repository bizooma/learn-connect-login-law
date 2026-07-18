## Goal
Add an obvious secondary navigation control on `/admin/wiki/content` so users can return to the "All Content" list from a selected category view.

## Current state
`src/pages/AdminWikiPage.tsx` renders:
- A yellow breadcrumb bar at the top with an "All Content" link.
- A `WikiSearchBar`.
- A `WikiCategoryList` (the document table) when a category is selected.

The breadcrumb link already clears the selected category, but the client wants a more prominent button below the search bar.

## Changes
1. In `src/pages/AdminWikiPage.tsx`, insert a "Back to All Content" button between `WikiSearchBar` and the loading/empty/list content.
2. Show the button only when `activeCategoryId` is set (i.e., a specific category is being viewed).
3. On click, call `setActiveCategoryId(null)` to return to the full subject list.
4. Style the button to be noticeable: use an `ArrowLeft` icon + text, with the project deep-blue brand color (`#213C82`) and a subtle hover state.
5. Ensure the button is hidden when already on "All Content" so it doesn't clutter the default view.

## Files to modify
- `src/pages/AdminWikiPage.tsx`

## Verification
- Open `/admin/wiki/content`.
- Select a category from the sidebar.
- Confirm the "Back to All Content" button appears under the search bar.
- Click it and confirm the view returns to the full "All Content" list.
- Confirm the button is absent on the default "All Content" view.