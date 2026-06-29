## Add Loom Video Embed Support

Extend the existing "Insert video" toolbar action in `src/components/admin/wiki/RichTextEditor.tsx` so pasting a Loom share URL embeds the video using Loom's official embed format.

### Behavior
- User clicks the Video (🎥) toolbar button (same one used today for YouTube/iframe).
- Prompt text updated to: "Enter video URL (YouTube, Loom, Vimeo, or any embeddable URL)".
- Detection logic in `addVideo`:
  1. If URL matches `youtu.be` / `youtube.com` → existing YouTube extension (unchanged).
  2. **New:** If URL matches `loom.com/share/{id}` or `loom.com/embed/{id}` → extract the video ID and insert:
     ```html
     <div class="my-4">
       <iframe src="https://www.loom.com/embed/{id}"
               class="w-full aspect-video rounded-md"
               frameborder="0"
               allowfullscreen
               webkitallowfullscreen
               mozallowfullscreen></iframe>
     </div>
     ```
  3. Otherwise → existing generic iframe fallback (unchanged).

### Notes
- No new dependencies; Loom embeds via plain iframe.
- Works for the example URL `https://www.loom.com/share/4d8d76a332344105b8d7c3b2ccca404d` → embeds `https://www.loom.com/embed/4d8d76a332344105b8d7c3b2ccca404d`.
- Strips any query string (e.g. `?sid=...`) from the share URL before building the embed src.
- No DB or schema changes; the embed HTML is stored in the page content like other media.
