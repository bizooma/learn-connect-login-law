
## Goal
When a user asks "Summarize this SOP" (or similar), the AI should return **what you should have learned** — concrete rules, steps, decisions, thresholds, and do/don'ts — not a table of contents echoing page titles.

## Why it happens today
In `supabase/functions/ask-wiki-sop/index.ts`:
- The system prompt is generic ("concise and specific… short paragraphs or bullet points"). It doesn't tell the model to extract learning outcomes, so on a summary request it defaults to mirroring the page structure it sees in the `[Page: Title | id: …]` headers.
- Page titles are included inline in the context, which nudges the model to reuse them as an outline.
- `temperature: 0.1` + `gpt-4o-mini` is fine, but the instructions are the bottleneck.
- The frontend Quick Action is literally "Summarize this SOP", reinforcing outline-style output.

## Changes

### 1. Rewrite the system prompt (biggest lever)
Replace the current system prompt in `ask-wiki-sop/index.ts` with one that:
- Frames the assistant as a **trainer verifying comprehension**, not a summarizer.
- For summary/overview-style questions, requires output in a fixed learning-outcome shape:
  - **What this SOP is for** (1–2 sentences, plain language)
  - **What you should now be able to do** (action-oriented bullets, each starting with a verb)
  - **Key rules & thresholds** (specific numbers, names, deadlines, approvers, tools — pulled verbatim where they exist)
  - **Steps in order** (only if the SOP prescribes a process)
  - **Common mistakes / do NOT** (only if the SOP calls them out)
  - **When to escalate / who owns it** (only if present)
- Bans copying page titles as headings; requires synthesis across pages.
- Keeps the strict grounding rule ("only from this SOP", deflect line unchanged) and the `SOURCES:` trailer contract so citations keep working.
- For non-summary questions, answers directly in the same grounded style (no forced template).

### 2. Reshape the context we send
Still send every page, but:
- Drop the `[Page: <title> | id: <id>]` header format that encourages outline mimicry. Use `<<PAGE id="…">>` delimiters with the title on a separate de-emphasized line, and instruct the model to treat titles as metadata, not as section headings to reproduce.
- Keep the page-id mapping so the `SOURCES:` parser and citation chips keep working unchanged.

### 3. Update Quick Actions in the panel
In `src/components/admin/wiki/AskThisSopPanel.tsx`, change `QUICK_ACTIONS` to prompts that match the new behavior:
- "What should I have learned from this SOP?"
- "Key rules, numbers, and deadlines"
- "Step-by-step process"
- "Common mistakes to avoid"

("Give me the key steps" stays in spirit as "Step-by-step process".)

### 4. Small model/params tune
In the same edge function:
- Bump `max_tokens` (currently unset → provider default can truncate longer learning-outcome answers). Set an explicit cap (e.g. 1200).
- Keep `temperature: 0.1`. Keep `gpt-4o-mini` for cost; note in a code comment that upgrading the model is the next lever if quality is still weak.

## Out of scope
- No schema changes.
- No changes to `wiki_pages` content, chunking/embeddings, or a new retrieval layer — full-SOP context still fits and is simpler. If SOPs grow past the context window later, we'd add retrieval then.
- No changes to the citation UI or `SOURCES:` contract.

## Files touched
- `supabase/functions/ask-wiki-sop/index.ts` — new system prompt, new page delimiter format, `max_tokens`.
- `src/components/admin/wiki/AskThisSopPanel.tsx` — updated `QUICK_ACTIONS`.

## Verification
After deploy, on a known SOP:
1. Click "What should I have learned from this SOP?" → expect outcome bullets with specific rules/numbers, not the page outline.
2. Ask something clearly not in the SOP → still returns the exact deflection line.
3. Confirm source chips still render (SOURCES parser unchanged).
