## Goal
Enable admins to drag staff cards between department sections on `/admin/wiki/people-chart` and persist the change to `profiles.department`.

## UX
- Each `PersonChip` becomes draggable (grab cursor, subtle lift on drag).
- Each department section (Legal, Sales, Marketing, People & Culture, Finance, Operations, Unassigned) is a drop target with a highlighted outline (brand yellow #FFDA00) while hovering.
- On drop:
  - Optimistically move the chip to the target section.
  - Write `profiles.department = <target>` (or `null` for Unassigned).
  - Toast on success ("Moved Jane Doe to Sales") / rollback + error toast on failure.
- Dropping on the same section is a no-op.
- Admin-only: non-admins keep the current read-only view (no drag handles).

## Implementation
- Use `@dnd-kit/core` (already commonly present; add if missing) for accessible drag-and-drop. Keyboard support via `KeyboardSensor` — move a card with Enter + arrow keys.
- Refactor `src/pages/AdminWikiPeopleChartPage.tsx`:
  - Wrap sections in `<DndContext>`.
  - Wrap each `PersonChip` in a `useDraggable` wrapper.
  - Wrap each department `<Card>` in a `useDroppable` wrapper.
  - On `onDragEnd`, call a new `useUpdateUserDepartment` mutation.
- New hook `src/hooks/useUpdateUserDepartment.ts`:
  - `useMutation` that runs `supabase.from('profiles').update({ department: <label|null> }).eq('id', userId)`.
  - Optimistic update against the `["people-by-department"]` query cache; rollback on error; invalidate on settle.
- Gate drag behavior behind `useUserRole().isAdmin`. Non-admins render the existing static chips.

## Backend / data
- No schema change. Writes the exact department label string ("Legal", "Sales", "Marketing", "People & Culture", "Finance", "Operations") or `null` for Unassigned.
- RLS: confirm current admin update policy on `profiles` allows admins to update `department`. If not, add a policy in a follow-up migration (surfaced before running). Assumption: admins already can update profile fields via existing admin policies — will verify once in build mode.

## Out of scope
- Bulk multi-select drag.
- Reordering within a department.
- Changing the department taxonomy or `normalizeDepartment` mapping.

## Files
- Edit: `src/pages/AdminWikiPeopleChartPage.tsx`
- New: `src/hooks/useUpdateUserDepartment.ts`
- Possibly: `package.json` (add `@dnd-kit/core` if not already installed)
