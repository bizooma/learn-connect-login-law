import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CategoryRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
}

interface ArticleRow {
  id: string;
  title: string;
  content: string | null;
  content_type: string;
  sort_order: number;
  is_published: boolean;
}

interface PageRow {
  id: string;
  article_id: string;
  title: string;
  content: string | null;
  sort_order: number;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );

const renderFlowchart = (raw: string | null) => {
  if (!raw) return "<p><em>Empty flowchart</em></p>";
  try {
    const { nodes = [], edges = [] } = JSON.parse(raw) as {
      nodes: Array<{ id: string; data: { label?: string; shape?: string } }>;
      edges: Array<{ source: string; target: string; label?: string }>;
    };
    const byId = new Map(nodes.map((n) => [n.id, n.data?.label || "(untitled)"]));
    const steps = nodes
      .map((n, i) => `<li><strong>${escapeHtml(n.data?.label || `Step ${i + 1}`)}</strong> <span class="muted">(${escapeHtml(n.data?.shape || "box")})</span></li>`)
      .join("");
    const conns = edges
      .map(
        (e) =>
          `<li>${escapeHtml(byId.get(e.source) || e.source)} → ${escapeHtml(byId.get(e.target) || e.target)}${e.label ? ` <span class="muted">[${escapeHtml(e.label)}]</span>` : ""}</li>`,
      )
      .join("");
    return `<h4>Steps</h4><ol>${steps}</ol>${conns ? `<h4>Connections</h4><ul>${conns}</ul>` : ""}`;
  } catch {
    return "<p><em>Unable to render flowchart</em></p>";
  }
};

export async function printSubjectPdf(categoryId: string) {
  const tid = toast.loading("Preparing PDF...");
  try {
    const [{ data: cat, error: catErr }, { data: articles, error: artErr }] = await Promise.all([
      supabase.from("wiki_categories").select("id, title, description, category").eq("id", categoryId).single(),
      supabase
        .from("wiki_articles")
        .select("id, title, content, content_type, sort_order, is_published")
        .eq("category_id", categoryId)
        .order("sort_order", { ascending: true }),
    ]);
    if (catErr || !cat) throw catErr || new Error("Subject not found");
    if (artErr) throw artErr;

    const articleRows = (articles || []) as ArticleRow[];
    const articleIds = articleRows.map((a) => a.id);

    let pagesByArticle = new Map<string, PageRow[]>();
    if (articleIds.length > 0) {
      const { data: pages, error: pgErr } = await supabase
        .from("wiki_pages" as any)
        .select("id, article_id, title, content, sort_order")
        .in("article_id", articleIds)
        .order("sort_order", { ascending: true });
      if (pgErr) throw pgErr;
      for (const p of (pages || []) as unknown as PageRow[]) {
        const arr = pagesByArticle.get(p.article_id) || [];
        arr.push(p);
        pagesByArticle.set(p.article_id, arr);
      }
    }

    const category = cat as CategoryRow;
    const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

    const articleHtml = articleRows
      .map((a) => {
        const pages = pagesByArticle.get(a.id) || [];
        const body =
          a.content_type === "flowchart"
            ? renderFlowchart(a.content)
            : a.content
            ? a.content
            : pages.length === 0
            ? "<p><em>No content</em></p>"
            : "";
        const pagesHtml = pages
          .map(
            (p) => `
              <section class="page">
                <h3>${escapeHtml(p.title)}</h3>
                <div class="rt">${p.content || "<p><em>Empty page</em></p>"}</div>
              </section>`,
          )
          .join("");
        return `
          <article class="article">
            <h2>${escapeHtml(a.title)} <span class="badge">${escapeHtml(a.content_type)}</span></h2>
            ${body ? `<div class="rt">${body}</div>` : ""}
            ${pagesHtml}
          </article>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${escapeHtml(category.title)}</title>
<style>
  @page { size: Letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; line-height: 1.55; margin: 0; }
  header.cover { border-bottom: 3px solid #213C82; padding-bottom: 16px; margin-bottom: 24px; }
  header.cover .kicker { color: #213C82; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  header.cover h1 { margin: 6px 0 4px; font-size: 28px; color: #111827; }
  header.cover .meta { color: #6b7280; font-size: 12px; }
  h2 { font-size: 20px; color: #213C82; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 28px; }
  h3 { font-size: 15px; color: #111827; margin-top: 18px; }
  h4 { font-size: 13px; color: #374151; margin: 14px 0 4px; }
  .article { page-break-inside: avoid; }
  .article + .article { margin-top: 8px; }
  .page { margin-top: 10px; padding-left: 12px; border-left: 2px solid #FFDA00; }
  .badge { display: inline-block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 999px; vertical-align: middle; margin-left: 6px; }
  .rt img { max-width: 100%; height: auto; }
  .rt table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .rt th, .rt td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 12px; text-align: left; }
  .rt ul, .rt ol { padding-left: 22px; }
  .muted { color: #6b7280; font-size: 11px; }
  footer.foot { margin-top: 32px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; text-align: center; }
  @media print { a { color: inherit; text-decoration: none; } }
</style>
</head>
<body>
  <header class="cover">
    <div class="kicker">${escapeHtml(category.category || "Subject")}</div>
    <h1>${escapeHtml(category.title)}</h1>
    ${category.description ? `<p>${escapeHtml(category.description)}</p>` : ""}
    <div class="meta">Generated ${escapeHtml(today)} · ${articleRows.length} ${articleRows.length === 1 ? "document" : "documents"}</div>
  </header>
  ${articleHtml || "<p><em>This subject has no content yet.</em></p>"}
  <footer class="foot">New Frontier Immigration Law · Policies &amp; Procedures</footer>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.focus(); window.print(); }, 250);
    });
  </script>
</body></html>`;

    const win = window.open("", "_blank");
    if (!win) {
      toast.dismiss(tid);
      toast.error("Pop-up blocked. Allow pop-ups to print PDFs.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    toast.dismiss(tid);
    toast.success("Opened print dialog — choose 'Save as PDF'");
  } catch (e: any) {
    toast.dismiss(tid);
    toast.error("Failed to build PDF: " + (e?.message || "unknown error"));
  }
}
