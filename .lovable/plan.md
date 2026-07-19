
# Wiki: Search, Ask this SOP, Browse Mode

Zero schema changes. Reuses existing tables (`wiki_categories`, `wiki_articles`, `wiki_pages`) and the existing `generate-wiki-page-content` edge function's pattern/`OPENAI_API_KEY` for AI. Admin-gated under `/admin/wiki`. Brand yellow `#FFDA00` for active states.

---

## 1. Global P&P Search

**New:** `src/hooks/useWikiGlobalSearch.ts` and `src/components/admin/wiki/WikiGlobalSearchBox.tsx`.

- Debounced (~250ms) input; queries only when term ≥ 2 chars.
- Three parallel Supabase queries using `ilike` on existing columns (no tsvector, no new columns):
  - `wiki_categories`: `title`, `description`
  - `wiki_articles`: `title` (select `id, title, content_type, category_id`)
  - `wiki_pages`: `title`, `content` (select `id, title, content, article_id`)
- Limit each query to 25 rows; merged results capped at ~40.
- For each page hit, enrich in one follow-up query fetching parent `wiki_articles` (+ `wiki_categories` join) so we can render `Subject › Document › Page` breadcrumbs.
- Snippet: strip HTML client-side (`div.innerHTML = ...; textContent`), find first case-insensitive match in body, slice ±80 chars, wrap the matched span in `<mark>` (yellow highlight).
- Ranking: title matches > body matches; within each, subject > article > page; then by `updated_at` desc.
- Click navigation:
  - page → `/admin/wiki/pages/:pageId`
  - flowchart article → `/admin/wiki/flowchart/:articleId`
  - other article → `/admin/wiki/content?article=:articleId`
  - subject → `/admin/wiki/content` with `activeCategoryId` via router state
- Access: relies on existing RLS/`useWikiAccess` (admin-only routes already guard the surface).
- Placement: replace the existing header search in `AdminWikiPage.tsx` (which currently only filters subject titles) with the new global search dropdown. Keep local title-filter behavior when the input is empty.

## 2. "Ask this SOP" — AI Q&A per Document

**New edge function:** `supabase/functions/ask-wiki-sop/index.ts`
- Same shape/CORS as `generate-wiki-page-content`. Reads `OPENAI_API_KEY`.
- Input: `{ articleId, question }`.
- Server fetches `wiki_articles` row + all `wiki_pages` for that `article_id` (server uses service role; still admin-only through the client route). Strips HTML server-side (regex) and concatenates as `[Page: <title> | id: <pageId>] <text>` blocks.
- System prompt (strict grounding):
  - "Answer ONLY from the SOP text below. If not present, reply exactly: 'This isn't covered in this SOP.' Do not use outside knowledge."
  - "After the answer, on a new line, output `SOURCES: <pageId>, <pageId>` listing the page IDs you drew from."
- Streams via SSE (`stream: true`) — response piped through with `text/event-stream` headers.

**New component:** `src/components/admin/wiki/AskThisSopPanel.tsx`
- Slide-in side sheet (shadcn `Sheet`) triggered by a persistent floating "Ask this SOP" button (yellow `#FFDA00`, black text, `Sparkles` icon).
- Quick-action chips: "Summarize this SOP", "Give me the key steps".
- Textarea + Send; streams tokens into a scrollable answer area.
- Parses trailing `SOURCES:` line → renders chips linking to `/admin/wiki/pages/:pageId` (resolved against the page list already fetched for context; unknown IDs dropped).
- Loading state, AI-key-missing handled gracefully (toast + inline message).
- No persistence; state lives in component.

**Wire-in:**
- `src/pages/WikiPageEditorPage.tsx`: persistent floating button (bottom-right) + one at the end of the editor.
- `src/pages/WikiFlowchartEditorPage.tsx` and `WikiArticleEditor` (modal in `AdminWikiPage`): same floating button, scoped to the current `article_id`.

## 3. Reference / Free-Browse Mode

- `WikiDocumentSidebar.tsx` already renders the doc tree. Add a "Browse mode" toggle (yellow pill) in the sidebar header that, when active, marks every page/article in the tree as directly clickable regardless of completion gating (current tree is already clickable in admin; add a small "Browse" label for clarity and a `browse=1` URL param so deep-links preserve it).
- Add a "Browse / Reference" entry button on the Subject card (`WikiCategoryRow.tsx`) shown when the current user has `mark_wiki_page_complete` records for every page in the subject (query aggregated per-subject in `useWikiCategories` if the count is already available; otherwise a lightweight `useSubjectCompletion(categoryId)` hook that counts pages vs. completions). Clicking opens the subject in the content view with `browse=1`.
- Sequential/training flow and `mark_wiki_page_complete` behavior are untouched.

---

## Technical Notes

- **No schema changes.** All queries use existing columns; `ilike` on `wiki_pages.content` is acceptable at current scale (~hundreds of pages). If pg_trgm indexes already exist, `ilike` uses them automatically — we won't add any.
- **Edge function** mirrors the existing OpenAI call pattern (`gpt-4o-mini`, `OPENAI_API_KEY`, same CORS). Adds streaming only.
- **HTML stripping** server-side uses `.replace(/<[^>]+>/g, ' ')` then whitespace collapse; client snippets use the same approach.
- **Files touched:**
  - New: `useWikiGlobalSearch.ts`, `WikiGlobalSearchBox.tsx`, `AskThisSopPanel.tsx`, `supabase/functions/ask-wiki-sop/index.ts`, `useSubjectCompletion.ts` (only if needed).
  - Modified: `AdminWikiPage.tsx` (header search swap), `WikiPageEditorPage.tsx`, `WikiFlowchartEditorPage.tsx`, `WikiArticleEditor.tsx`, `WikiDocumentSidebar.tsx`, `WikiCategoryRow.tsx`.

## Verification

- Search: create a term appearing only in a page's body → confirm snippet + `<mark>` highlight + correct Subject › Document › Page breadcrumb; click routes to `/admin/wiki/pages/:pageId`.
- Ask this SOP: ask a question answered in the doc → streams answer with clickable page-source chips. Ask an unrelated question → returns "This isn't covered in this SOP."
- Browse: on a fully-completed subject, the Browse button opens the sidebar and any page is directly reachable; existing training completion unchanged.
