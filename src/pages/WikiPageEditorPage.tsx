import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import birdIcon from "@/assets/bird.png";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/wiki/RichTextEditor";
import AiWritePageDialog from "@/components/admin/wiki/AiWritePageDialog";
import { useWikiPages, WikiPage } from "@/hooks/useWikiPages";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { FileText, ChevronRight } from "lucide-react";


// Strip legacy bold so old content renders at normal weight.
// Removes <strong>/<b> wrappers and inline font-weight styles.
const sanitizeContent = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<\/?(strong|b)(\s[^>]*)?>/gi, "")
    .replace(/font-weight\s*:\s*[^;"']+;?/gi, "");
};

const WikiPageEditorPage = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<WikiPage | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const { pages: siblingPages, updatePage } = useWikiPages(page?.article_id);
  const { isAdmin, isOwner } = useUserRole();
  const canUseAi = isAdmin || isOwner;

  // Fetch the full subject (category) tree: all articles in this category and all their pages
  const categoryId = (page as any)?.article_id ? undefined : undefined; // placeholder, real value below
  const { data: subjectTree } = useQuery({
    queryKey: ["wiki-subject-tree", page?.article_id],
    enabled: !!page?.article_id,
    queryFn: async () => {
      // 1) get current article to find its category_id
      const { data: currentArticle, error: aErr } = await supabase
        .from("wiki_articles")
        .select("id, category_id")
        .eq("id", page!.article_id)
        .single();
      if (aErr) throw aErr;
      const catId = (currentArticle as any).category_id as string;

      // 2) all articles in category
      const { data: articles, error: artsErr } = await supabase
        .from("wiki_articles")
        .select("id, title, content_type, sort_order, category_id")
        .eq("category_id", catId)
        .order("sort_order", { ascending: true });
      if (artsErr) throw artsErr;

      const articleIds = (articles || []).map((a: any) => a.id);
      // 3) all pages for those articles
      let pagesByArticle = new Map<string, WikiPage[]>();
      if (articleIds.length > 0) {
        const { data: allPages, error: pErr } = await supabase
          .from("wiki_pages" as any)
          .select("*")
          .in("article_id", articleIds)
          .order("sort_order", { ascending: true });
        if (pErr) throw pErr;
        for (const p of (allPages || []) as any[]) {
          const arr = pagesByArticle.get(p.article_id) || [];
          arr.push(p as WikiPage);
          pagesByArticle.set(p.article_id, arr);
        }
      }
      return {
        categoryId: catId,
        articles: (articles || []) as any[],
        pagesByArticle,
      };
    },
  });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!pageId) return;
      const { data, error } = await supabase
        .from("wiki_pages" as any)
        .select("*")
        .eq("id", pageId)
        .single();
      if (!active) return;
      if (error) {
        toast.error("Failed to load page");
        navigate(-1);
        return;
      }
      const p = data as unknown as WikiPage;
      setPage(p);
      setTitle(p.title);
      setContent(sanitizeContent(p.content || ""));
      setLoading(false);
      // Mark page as completed on open (idempotent)
      supabase.rpc("mark_wiki_page_complete" as any, { page_id: p.id }).then(({ error }) => {
        if (error) console.warn("mark_wiki_page_complete failed", error);
      });
    })();
    return () => {
      active = false;
    };
  }, [pageId, navigate]);

  const handleSave = async () => {
    if (!page) return;
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("wiki_pages" as any)
      .update({ title: trimmed, content: sanitizeContent(content) })
      .eq("id", page.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
      return;
    }
    setDirty(false);
    toast.success("Page saved");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleNavigateToPage = (targetId: string) => {
    if (targetId === page?.id) return;
    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) {
      return;
    }
    navigate(`/admin/wiki/pages/${targetId}`);
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:flex flex-col w-72 border-r border-border bg-muted/20 shrink-0">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Document Contents
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {subjectTree?.articles.length ?? 0} {(subjectTree?.articles.length ?? 0) === 1 ? "item" : "items"}
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {(subjectTree?.articles || []).map((article: any) => {
            const articlePages = subjectTree?.pagesByArticle.get(article.id) || [];
            const isCurrentArticle = article.id === page?.article_id;
            const handleArticleClick = () => {
              if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
              if (article.content_type === "flowchart") {
                navigate(`/admin/wiki/flowchart/${article.id}`);
              } else if (articlePages.length > 0) {
                navigate(`/admin/wiki/pages/${articlePages[0].id}`);
              } else {
                // Non-page article types (video, test, file, empty document) — AdminWikiPage opens it via ?article=
                navigate(`/admin/wiki/content?article=${article.id}`);
              }
            };
            return (
              <div key={article.id} className="mb-1">
                <button
                  onClick={handleArticleClick}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors hover:bg-muted/50 ${
                    isCurrentArticle ? "text-foreground font-semibold" : "text-foreground/80"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2 break-words flex-1">{article.title || "Untitled"}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                    {article.content_type}
                  </span>
                </button>
                {articlePages.length > 0 && (
                  <div className="ml-2 border-l border-border">
                    {articlePages.map((p, idx) => {
                      const isCurrent = p.id === page?.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleNavigateToPage(p.id)}
                          className={`w-full text-left pl-4 pr-3 py-1.5 text-sm flex items-start gap-2 transition-colors ${
                            isCurrent
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground hover:bg-muted/50"
                          }`}
                          style={isCurrent ? { backgroundColor: "#FFDA00" } : undefined}
                        >
                          <ChevronRight className="h-3 w-3 shrink-0 mt-1 opacity-60" />
                          <span className="text-xs opacity-70 shrink-0 mt-0.5">{idx + 1}.</span>
                          <span className="line-clamp-2 break-words">{p.title || "Untitled"}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>


      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-border bg-background">
          <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/wiki/content")}
                className="gap-2 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Content
              </Button>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
                className="text-lg font-semibold border-0 shadow-none focus-visible:ring-0 px-2"
                placeholder="Page title"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canUseAi && (
                <Button
                  size="sm"
                  onClick={() => setAiOpen(true)}
                  className="gap-2 text-white hover:opacity-90"
                  style={{ backgroundColor: "#213C82" }}
                >
                  <img src={birdIcon} alt="" className="h-7 w-7" /> Write with AI
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                {dirty ? "Unsaved changes" : "Saved"}
              </span>
              <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <RichTextEditor
            content={content}
            onChange={(html) => {
              setContent(html);
              setDirty(true);
            }}
          />
        </div>
      </div>

      {canUseAi && (
        <AiWritePageDialog
          open={aiOpen}
          onOpenChange={setAiOpen}
          pageTitle={title}
          currentContent={content}
          onInsert={(next) => {
            setContent(next);
            setDirty(true);
          }}
        />
      )}
    </div>
  );
};

export default WikiPageEditorPage;
