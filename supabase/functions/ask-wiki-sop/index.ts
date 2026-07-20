import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const stripHtml = (s: string) =>
  (s || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI is not configured. Please contact an administrator." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { articleId, question } = await req.json();
    if (!articleId || !question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "articleId and question are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: article, error: articleErr } = await supabase
      .from("wiki_articles")
      .select("id, title")
      .eq("id", articleId)
      .single();
    if (articleErr || !article) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pages, error: pagesErr } = await supabase
      .from("wiki_pages")
      .select("id, title, content, sort_order")
      .eq("article_id", articleId)
      .order("sort_order", { ascending: true });
    if (pagesErr) throw pagesErr;

    const pageBlocks = (pages || [])
      .map((p: any) => {
        const text = stripHtml(p.content || "");
        // Titles are metadata delimiters only — the model is instructed NOT to
        // reuse them as section headings in its answer.
        return `<<PAGE id="${p.id}">>\n(title metadata, do not reproduce as a heading: ${p.title || "Untitled"})\n${text}\n<<END PAGE>>`;
      })
      .join("\n\n");

    if (!pageBlocks.trim()) {
      return new Response(
        JSON.stringify({
          answer: "This isn't covered in this SOP.",
          sourcePageIds: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const system = `You are a training assistant for a single company SOP (document titled "${article.title}"). Your job is to verify comprehension: tell the reader what they should have LEARNED from this SOP, not what the pages are named.

STRICT GROUNDING RULES (never break these):
- Answer ONLY from the SOP text provided by the user. Do NOT use any outside or general knowledge.
- If the answer is not present in the SOP text, reply EXACTLY: "This isn't covered in this SOP."
- Page titles inside <<PAGE>> blocks are metadata. Do NOT reuse them as section headings and do NOT produce a table of contents / outline of the document.

HOW TO ANSWER SUMMARY / OVERVIEW / "what should I have learned" QUESTIONS:
Synthesize across all pages and output using EXACTLY these markdown headings, omitting any section for which the SOP truly contains nothing:

**What this SOP is for**
1–2 plain-language sentences on the purpose and when it applies.

**What you should now be able to do**
- Action-oriented bullets, each starting with a verb (Identify, Submit, Approve, Escalate, etc.). These are learning outcomes, not page names.

**Key rules, numbers, and names**
- Pull specific thresholds, deadlines, dollar amounts, tools, form names, approvers, and role owners verbatim from the SOP.

**Steps in order** (only if the SOP prescribes a process)
1. Numbered steps in the order the SOP gives them.

**Common mistakes / do NOT** (only if the SOP calls them out)
- What to avoid, per the SOP.

**Who owns it / when to escalate** (only if present in the SOP)
- Role, person, or team named in the SOP.

HOW TO ANSWER SPECIFIC QUESTIONS (not a summary request):
Answer directly and concisely in the same grounded style. Prefer concrete rules and numbers from the SOP over paraphrase. Do not force the template above.

CITATIONS (required, unchanged contract):
After your answer, on a NEW line, output: SOURCES: <pageId>, <pageId>
listing the page IDs from the <<PAGE id="..."> delimiters you actually drew from.
If you deflected because the answer isn't in the SOP, output: SOURCES:`;

    const user = `SOP CONTENT:\n\n${pageBlocks}\n\nQUESTION: ${question}`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // If quality is still weak after this prompt change, the next lever is
        // upgrading the model (e.g. gpt-4o) — the prompt/contract stays the same.
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 1200,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: `AI error: ${errText}` }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";

    // Parse trailing SOURCES: line
    const match = raw.match(/^\s*SOURCES:\s*(.*)$/im);
    let answer = raw;
    let sourcePageIds: string[] = [];
    if (match) {
      answer = raw.slice(0, match.index).trim();
      sourcePageIds = match[1]
        .split(/[, \n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const validIds = new Set((pages || []).map((p: any) => p.id));
    sourcePageIds = sourcePageIds.filter((id) => validIds.has(id));

    return new Response(JSON.stringify({ answer: answer.trim(), sourcePageIds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
