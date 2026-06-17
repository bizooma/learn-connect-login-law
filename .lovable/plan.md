## Goal

Replicate Trainual's "Create" dropdown with 7 content types on the Wiki Content page. Skip the "Test → Content" rename.

## 1. Create dropdown (7 types)

Replace the page's `New Category` button with a primary **Create** dropdown matching the Trainual screenshot. Options:

1. **Document** — Write with AI, utilizing visuals like images, tables and GIFs.
2. **Flowchart** — Visually diagram processes that connect people, groups and content.
3. **Video** — Upload or link a video.
4. **File** — Bring in existing files like PDF, DOC, PPT, XLS, SCORM and more.
5. **Checklist** — Create lightweight checklists for everyday processes.
6. **Test** — Build a quiz to check knowledge and comprehension.
7. **Subject** — Create a folder for your courses, videos, flowcharts, tests and more.

`Subject` = our existing Category — selecting it opens the existing `WikiCategoryDialog`. The other 6 open a new `CreateContentDialog` that creates a `wiki_articles` row with the matching `content_type`.

Per-type create form:
- **Document** → Subject + Title, then opens the existing editor
- **Video** → Subject + Title + Video URL (stored in `content`)
- **File** → Subject + Title + file upload (uses existing `file_url` / `file_name`)
- **Flowchart / Checklist / Test** → Subject + Title only; placeholder entry (full editor "Coming Soon" per project rule)

## 2. Data model

`wiki_articles.content_type` is plain `text` (no check constraint) — **no migration required**. Existing `policy` / `procedure` values keep working as legacy labels. TS union is extended to: `document | flowchart | video | file | checklist | test` (plus legacy `policy | procedure`).

## 3. Files

- **New:** `src/components/admin/wiki/CreateContentMenu.tsx` — Dropdown with the 7 options + icons + descriptions.
- **New:** `src/components/admin/wiki/CreateContentDialog.tsx` — Minimal create form keyed off the chosen type.
- **Edit:** `src/hooks/useWikiArticles.ts` — Extend `WikiContentType` union + labels; default `content_type` becomes `"document"`.
- **Edit:** `src/components/admin/wiki/WikiArticleRow.tsx` — Map icons for the new content types.
- **Edit:** `src/pages/AdminWikiPage.tsx` — Replace `New Category` button with `CreateContentMenu` + wire the new dialog.

## Out of scope

- Sidebar header / page header rename.
- Full Flowchart / Checklist / Test editors and quiz linkage.
- `Request` and `Import content` secondary buttons.
