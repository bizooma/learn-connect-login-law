## Plan: Bulk-create 50 Subjects from Trainual export

### Data is usable
Yes. Each row has everything I need:
- **Title** (e.g. "Opening a New Case (2)")
- **Emoji** (✴️, 👉, 🎓, 🧑‍⚖️, etc.) → store in `icon_name`
- **Category** (Process / Company) → maps to our `subject_category`:
  - `Process` → `procedure`
  - `Company` → `company`
  - (No `Policy` rows in this batch)

I'll ignore Trainual-only metadata that doesn't map to our schema: Full access, Published status, Updated date, item counts, "Shared with groups" / "N groups". Group sharing will come later when we build the group-permissions feature.

### What gets created
50 rows inserted into `public.wiki_categories` via one bulk SQL insert, in the exact order shown in the screenshot, with `sort_order` 0–49 so they display in the same order. Titles preserved verbatim including the `(1)`, `(2)`… numbering. `is_published` defaults to false — you can publish each one as you add content.

### Category mapping summary
- 47 subjects → `procedure` (Process)
- 3 subjects → `company` ("How We Use Trainual Duplicate (copy)", "How We Use Trainual", "How to use Trainual University")

### Emoji handling
`icon_name` will store the raw emoji (e.g. `🧑‍⚖️`). Rows with no emoji in your paste (Tracking, Confirming Filing Fee Payment, Create and Manage Tasks in HubSpot, the CA one, etc.) will get a sensible default emoji based on content, or left blank — your call. **Default plan: leave blank and they'll fall back to the existing `FileText` icon.**

### Sidebar visibility
These will appear in the left sidebar under "Content" and in the main All Content list. The existing filter that hides any category literally named "Content" still applies (none of these are named that).

### Confirm before I run
1. OK to leave the parenthetical numbers like `(1)`, `(2)` in the titles?
2. OK to leave un-emoji'd rows with no icon (default FileText)?
3. Should the 3 "Trainual" company rows be renamed (e.g. "How We Use This Wiki") or kept verbatim?

Once you confirm (or say "just do it"), I'll switch to build mode and run a single migration/insert.
