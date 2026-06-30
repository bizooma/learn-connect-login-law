## Add real drag-and-drop to Training Paths

Wire up the decorative drag handles on `AdminWikiTrainingPathsPage.tsx` using `@dnd-kit` (already installed) so admins can reorder subjects by dragging rows, in addition to the existing dropdown.

### Changes

1. **`src/pages/AdminWikiTrainingPathsPage.tsx`**
   - Wrap the rows in `<DndContext>` + `<SortableContext>` (vertical list strategy).
   - Use `PointerSensor` (with a small activation distance so clicks on the dropdown still work) + `KeyboardSensor` for accessibility.
   - On `onDragEnd`, compute the new array via `arrayMove` and call the existing `handleReorder` logic so it writes `sort_order` to every row in `wiki_categories` (same DB path the dropdown uses — single source of truth).

2. **New row component (or inline)** — `SortableTrainingPathRow`
   - Uses `useSortable({ id: category.id })`.
   - Applies `transform`/`transition` styles.
   - Attaches `listeners` + `attributes` only to the existing drag-handle icon (not the whole row), so the dropdown, title link, and other controls remain clickable.
   - Adds a "grabbing" cursor and subtle opacity/shadow while dragging.

### Behavior

- Drag handle on the left becomes the grab affordance.
- Dropping persists immediately (same toast: "Training path order updated").
- Dropdown reorder keeps working unchanged.
- Admin-only (RLS already enforces this).

### Out of scope

- No schema changes.
- No changes to All Content ordering logic (it already reads `sort_order`).