
## Current state

- The Create dialog already shows "Flowchart" as a content type, but it's listed as a stub — selecting it just creates a `wiki_articles` row with `content_type='flowchart'` and no editor opens.
- The project already has `@xyflow/react` installed and an LMS-specific `FlowchartCanvas`, but that one is hard-wired to courses/modules/lessons and isn't reusable for a generic process diagram.
- `wiki_articles.content` is a text column we can reuse to store the flowchart JSON (nodes + edges), so no schema change is needed.

## What I'll build

**1. A new wiki flowchart editor page** at `/admin/wiki/flowchart/:articleId`
- Full-page React Flow canvas (same library already in use).
- Left toolbar: Add Box, Add Diamond (decision), Add Oval, Add Text, Delete, Undo/Redo.
- Click a node to rename inline.
- Drag to connect nodes; arrow style edges by default.
- "Back to Content" + autosave to `wiki_articles.content` as JSON (`{ nodes, edges }`).
- Read-only viewer mode when the user is not an admin (renders the same canvas with interaction disabled).

**2. Wire up the Create flow**
- Remove `flowchart` from `STUB_TYPES` in `CreateContentDialog.tsx`.
- After creating a flowchart article, navigate to the new editor route.
- In `WikiArticleRow` / `WikiCategoryRow`, clicking a flowchart article opens the flowchart editor instead of the page editor.

**3. Seed the Onboarding flowchart**
- Insert a new `wiki_categories` row titled "Onboarding" (under the appropriate subject area — I'll place it in the HR/People area; confirm below if you'd prefer a different parent).
- Insert one `wiki_articles` row with `content_type='flowchart'`, title "Onboarding", and pre-populated `content` JSON containing the 7 boxes from your screenshot connected left-to-right:
  Offer signed → Hire into Bamboo → email new hire → Add to new hire excel tracker → Add to systems → Host onboarding → 30 & 90 day check-ins

## Technical notes

- Storage: serialize `{ nodes: Node[], edges: Edge[] }` to `wiki_articles.content` (text). No migration needed.
- Autosave: debounce 800ms on canvas change, same pattern as the page editor.
- Node types: a single custom `BoxNode` (rounded white card with editable label) covers the screenshot; diamond/oval are visual variants of the same component driven by a `shape` field in node data.
- Reuse existing admin route guard.

## Open question

Where should the new "Onboarding" subject live? Options:
- Create a new top-level subject titled **Onboarding**.
- Place the flowchart inside an existing subject (e.g. one of the People/HR ones you've already created).

I'll default to creating a new **Onboarding** subject unless you say otherwise.
