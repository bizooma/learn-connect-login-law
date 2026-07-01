import "https://deno.land/std@0.224.0/dotenv/load.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      pageTitle = "",
      subjectName = "",
      prompt = "",
      tone = "professional",
      length = "medium",
    } = body ?? {};

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lengthGuide =
      length === "short"
        ? "Keep it concise: ~150-250 words."
        : length === "long"
        ? "Provide comprehensive coverage: ~600-900 words."
        : "Moderate depth: ~300-500 words.";

    const system = `You are a technical writer producing content for an internal company Policies & Procedures wiki.
Output ONLY clean semantic HTML suitable for a TipTap rich-text editor.
Rules:
- Do NOT include <html>, <head>, <body>, <style>, <script>, or Markdown code fences.
- Use <h2> and <h3> for section headings (never <h1>; the page title is rendered separately).
- Use <p>, <ul>, <ol>, <li>, <strong> (sparingly), <em>, <blockquote>, <a href="...">.
- No inline styles, no classes, no data attributes.
- Prefer scannable structure: short paragraphs, bullet lists, clear headings.
- Tone: ${tone}. ${lengthGuide}`;

    const user = `Page title: ${pageTitle || "(untitled)"}
${subjectName ? `Subject/Category: ${subjectName}\n` : ""}Write the page content based on this request:

${prompt}`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: `OpenAI error: ${errText}` }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    let html: string = data?.choices?.[0]?.message?.content ?? "";

    // Strip potential markdown fences if the model ignored instructions
    html = html.trim().replace(/^```(?:html)?\s*/i, "").replace(/```$/i, "").trim();

    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
