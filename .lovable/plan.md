# AI Content Generation for Wiki Pages

Add an "Ask AI" button in the wiki page editor header that opens a prompt dialog. Admins describe what they want, AI generates the page content, and it's inserted into the rich-text editor.

## User Flow

1. Admin opens any wiki page at `/admin/wiki/pages/:pageId`
2. Clicks a new **"Ask AI"** button (sparkle icon) in the editor header, next to Save
3. Dialog opens with:
   - The page title pre-shown as context
   - A textarea: "What should this page cover?"
   - Optional tone/length hints (short/medium/long)
   - Radio: **Replace content** vs **Append to content**
   - Generate button
4. On generate: streams/loads AI output, shows preview inside the dialog
5. Admin clicks **Insert** → HTML is written into the TipTap editor, marked dirty, ready to Save

## Access

- Admin-only (matches existing wiki editor gating).
- Button hidden for non-admins.

## Backend

New Supabase edge function `generate-wiki-page-content`:
- Auth: verify caller is admin via existing pattern
- Input: `{ pageTitle, subjectName?, prompt, tone?, length?, mode }`
- Calls OpenAI (uses existing `OPENAI_API_KEY` secret already stored) via chat completions
- System prompt instructs model to output clean semantic HTML compatible with TipTap (h2/h3, p, ul/ol, strong sparingly, no `<html>`/`<body>` wrappers, no inline styles, no scripts)
- Returns `{ html }`
- Sanitize on client using existing `DOMPurify` pattern (`SafeHtmlContent` uses it) before inserting

## Frontend Changes

- New component `src/components/admin/wiki/AiWritePageDialog.tsx`
  - Dialog with prompt form, loading state, preview pane, Insert/Cancel
  - Calls `supabase.functions.invoke("generate-wiki-page-content", ...)`
- Modify `src/pages/WikiPageEditorPage.tsx`
  - Add "Ask AI" button in header
  - On insert: use TipTap's `editor.commands.insertContent(html)` or replace via `setContent(html)`
  - To expose the editor instance, extend `RichTextEditor` with an `onReady(editor)` callback (small addition, no behavior change)

## Technical Notes

- Model: `gpt-4o-mini` for speed/cost (fast, sufficient for content drafting). Non-streaming for simplicity; show a spinner.
- Content pipeline: model returns HTML → sanitize with DOMPurify (allow headings, lists, blockquote, code, tables, links, br, em, strong) → insert into TipTap.
- No new tables. No schema changes.
- Reuses existing `OPENAI_API_KEY` (already set).

## Out of Scope

- Regenerating specific sections, image generation, streaming UI, per-org prompt templates. Can follow later.
