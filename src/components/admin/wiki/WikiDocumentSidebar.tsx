import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  FileText,
  FileUp,
  GitBranch,
  HelpCircle,
  ListChecks,
  Loader2,
  ScrollText,
  Shield,
  Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WikiPage } from "@/hooks/useWikiPages";
import { WikiArticle, WikiContentType, contentTypeLabels } from "@/hooks/useWikiArticles";
import AskThisSopButton from "./AskThisSopButton";

interface WikiDocumentSidebarProps {
  categoryId?: string | null;
  activeArticleId?: string | null;
  activePageId?: string | null;
  activeKnowledgeCheck?: boolean;
  onBeforeNavigate?: () => boolean;
}

interface WikiCategorySummary {
  id: string;
  title: string;
}

interface WikiDocumentTreeData {
  category: WikiCategorySummary;
  articles: WikiArticle[];
  pagesByArticle: Record<string, WikiPage[]>;
}

const contentTypeIcons: Record<WikiContentType, typeof FileText> = {
  document: FileText,
  flowchart: GitBranch,
  video: Video,
  file: FileUp,
  checklist: ListChecks,
  test: ClipboardCheck,
  policy: Shield,
  procedure: ScrollText,
};

const WikiDocumentSidebar = ({
  categoryId,
  activeArticleId,
  activePageId,
  activeKnowledgeCheck,
  onBeforeNavigate,
}: WikiDocumentSidebarProps) => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<WikiDocumentTreeData>({
    queryKey: ["wiki-document-sidebar", categoryId, activeArticleId],
    enabled: !!categoryId || !!activeArticleId,
    queryFn: async () => {
      let resolvedCategoryId = categoryId || null;

      if (!resolvedCategoryId && activeArticleId) {
        const { data: currentArticle, error: currentArticleError } = await supabase
          .from("wiki_articles")
          .select("category_id")
          .eq("id", activeArticleId)
          .single();

        if (currentArticleError) throw currentArticleError;
        resolvedCategoryId = (currentArticle as { category_id: string }).category_id;
      }

      if (!resolvedCategoryId) throw new Error("Missing subject");

      const [{ data: category, error: categoryError }, { data: articles, error: articlesError }] = await Promise.all([
        supabase.from("wiki_categories").select("id, title").eq("id", resolvedCategoryId).single(),
        supabase
          .from("wiki_articles")
          .select("*")
          .eq("category_id", resolvedCategoryId)
          .order("sort_order", { ascending: true }),
      ]);

      if (categoryError) throw categoryError;
      if (articlesError) throw articlesError;

      const articleRows = (articles || []) as WikiArticle[];
      const articleIds = articleRows.map((article) => article.id);
      const pagesByArticle: Record<string, WikiPage[]> = {};

      if (articleIds.length > 0) {
        const { data: pages, error: pagesError } = await supabase
          .from("wiki_pages" as any)
          .select("*")
          .in("article_id", articleIds)
          .order("sort_order", { ascending: true });

        if (pagesError) throw pagesError;

        for (const page of (pages || []) as unknown as WikiPage[]) {
          if (!pagesByArticle[page.article_id]) pagesByArticle[page.article_id] = [];
          pagesByArticle[page.article_id].push(page);
        }
      }

      return {
        category: category as WikiCategorySummary,
        articles: articleRows,
        pagesByArticle,
      };
    },
  });

  const itemCount = useMemo(() => {
    if (!data) return 0;
    return data.articles.length + Object.values(data.pagesByArticle).reduce((sum, pages) => sum + pages.length, 0);
  }, [data]);

  const activeArticleTitle = useMemo(() => {
    if (!data || !activeArticleId) return undefined;
    return data.articles.find((a) => a.id === activeArticleId)?.title;
  }, [data, activeArticleId]);

  const requestNavigation = (to: string) => {
    if (onBeforeNavigate && !onBeforeNavigate()) return;
    navigate(to, data?.category.id ? { state: { activeCategoryId: data.category.id } } : undefined);
  };

  const openAllContent = () => {
    if (onBeforeNavigate && !onBeforeNavigate()) return;
    navigate("/admin/wiki/content");
  };

  const openArticle = (article: WikiArticle) => {
    if (article.content_type === "flowchart") {
      requestNavigation(`/admin/wiki/flowchart/${article.id}`);
      return;
    }

    requestNavigation(`/admin/wiki/content?article=${article.id}`);
  };

  return (
    <aside className="hidden md:flex flex-col w-80 border-r border-border bg-background shrink-0">
      <div className="px-4 py-3 border-b border-border" style={{ backgroundColor: "#FFDA00" }}>
        <button
          type="button"
          onClick={openAllContent}
          className="text-xs font-semibold uppercase tracking-wide text-foreground/80 hover:text-foreground"
        >
          All Content
        </button>
        <h2 className="text-sm font-semibold text-foreground line-clamp-2 mt-1">
          {data?.category.title || "Document Contents"}
        </h2>
        <p className="text-xs text-foreground/70 mt-1">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          data?.articles.map((article) => {
            const Icon = contentTypeIcons[article.content_type] || FileText;
            const pages = data.pagesByArticle[article.id] || [];
            const isActiveArticle = activeArticleId === article.id && !activePageId;
            const isCurrentArticle = activeArticleId === article.id;
            const typeLabel = contentTypeLabels[article.content_type] || "Item";

            return (
              <div key={article.id}>
                <button
                  type="button"
                  onClick={() => openArticle(article)}
                  aria-current={isActiveArticle ? "page" : undefined}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-b border-border transition-colors hover:bg-muted/40 ${
                    isCurrentArticle ? "font-semibold" : "font-medium"
                  }`}
                  style={isActiveArticle ? { backgroundColor: "#FFDA00" } : undefined}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isActiveArticle ? "text-foreground" : "text-muted-foreground"}`} />
                    <span className="text-sm text-foreground line-clamp-2 break-words">{article.title || "Untitled"}</span>
                  </span>
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0">
                    {typeLabel}
                  </span>
                </button>

                {pages.length > 0 && (
                  <div>
                    {pages.map((page) => {
                      const isActivePage = activePageId === page.id;
                      return (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => requestNavigation(`/admin/wiki/pages/${page.id}`)}
                          aria-current={isActivePage ? "page" : undefined}
                          className="w-full flex items-center justify-between gap-2 px-4 py-2 pl-12 bg-background border-b border-border text-left hover:bg-muted/30 transition-colors"
                          style={isActivePage ? { backgroundColor: "#FFDA00" } : undefined}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded shrink-0">Page</span>
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className={`text-sm line-clamp-2 break-words ${isActivePage ? "font-semibold text-foreground" : "text-foreground"}`}>
                              {page.title || "Untitled"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        {data && (
          <button
            type="button"
            onClick={() => requestNavigation(`/admin/wiki/knowledge-check/category/${data.category.id}`)}
            aria-current={activeKnowledgeCheck ? "page" : undefined}
            className="w-full flex items-center gap-2 px-4 py-2 pl-12 bg-background border-b border-border text-left hover:bg-muted/30 transition-colors"
            style={activeKnowledgeCheck ? { backgroundColor: "#FFDA00" } : undefined}
          >
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Test</span>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Knowledge Check</span>
          </button>
        )}
      </nav>

      {activeArticleId && (
        <div className="p-4 border-t border-border bg-background shrink-0">
          <AskThisSopButton
            variant="nav"
            articleId={activeArticleId}
            articleTitle={activeArticleTitle}
          />
        </div>
      )}
    </aside>
  );
};

export default WikiDocumentSidebar;