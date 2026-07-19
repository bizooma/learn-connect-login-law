import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WikiSearchResult =
  | {
      kind: "subject";
      id: string;
      title: string;
      subjectTitle: string;
      snippet: string;
      matchInTitle: boolean;
    }
  | {
      kind: "article";
      id: string;
      title: string;
      subjectTitle: string;
      subjectId: string;
      contentType: string;
      snippet: string;
      matchInTitle: boolean;
    }
  | {
      kind: "page";
      id: string;
      title: string;
      articleId: string;
      articleTitle: string;
      articleContentType: string;
      subjectId: string;
      subjectTitle: string;
      snippet: string;
      matchInTitle: boolean;
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

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildSnippet = (text: string, term: string, radius = 80): string => {
  if (!text) return "";
  const clean = text;
  const idx = clean.toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) return clean.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(clean.length, idx + term.length + radius);
  return (start > 0 ? "…" : "") + clean.slice(start, end) + (end < clean.length ? "…" : "");
};

export const highlightSnippet = (snippet: string, term: string): string => {
  if (!term) return snippet;
  const re = new RegExp(`(${escapeRegex(term)})`, "gi");
  return snippet.replace(re, '<mark style="background-color:#FFDA00;color:#000;padding:0 2px;border-radius:2px;">$1</mark>');
};

export const useDebounced = <T,>(value: T, delay = 250): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export const useWikiGlobalSearch = (term: string) => {
  const debounced = useDebounced(term.trim(), 250);

  return useQuery({
    queryKey: ["wiki-global-search", debounced],
    enabled: debounced.length >= 2,
    queryFn: async (): Promise<WikiSearchResult[]> => {
      const q = debounced;
      const like = `%${q}%`;

      const [catsRes, artsRes, pagesTitleRes, pagesBodyRes] = await Promise.all([
        supabase
          .from("wiki_categories")
          .select("id, title, description")
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(25),
        supabase
          .from("wiki_articles")
          .select("id, title, category_id, content_type")
          .ilike("title", like)
          .limit(25),
        supabase
          .from("wiki_pages" as any)
          .select("id, title, content, article_id")
          .ilike("title", like)
          .limit(25),
        supabase
          .from("wiki_pages" as any)
          .select("id, title, content, article_id")
          .ilike("content", like)
          .limit(25),
      ]);

      // Merge page hits (dedupe by id, title-hit wins)
      const pageMap = new Map<string, any>();
      (pagesTitleRes.data || []).forEach((p: any) => pageMap.set(p.id, { ...p, _titleHit: true }));
      (pagesBodyRes.data || []).forEach((p: any) => {
        if (!pageMap.has(p.id)) pageMap.set(p.id, { ...p, _titleHit: false });
      });
      const pageRows = Array.from(pageMap.values());

      // Fetch parent articles for pages (also for parent lookup on articles)
      const articleIds = new Set<string>();
      pageRows.forEach((p) => articleIds.add(p.article_id));
      (artsRes.data || []).forEach((a: any) => articleIds.add(a.id));

      let articlesById = new Map<string, any>();
      (artsRes.data || []).forEach((a: any) => articlesById.set(a.id, a));

      const missingArticleIds = Array.from(articleIds).filter((id) => !articlesById.has(id));
      if (missingArticleIds.length > 0) {
        const { data: moreArts } = await supabase
          .from("wiki_articles")
          .select("id, title, category_id, content_type")
          .in("id", missingArticleIds);
        (moreArts || []).forEach((a: any) => articlesById.set(a.id, a));
      }

      // Fetch parent categories
      const categoryIds = new Set<string>();
      (catsRes.data || []).forEach((c: any) => categoryIds.add(c.id));
      articlesById.forEach((a) => categoryIds.add(a.category_id));

      let categoriesById = new Map<string, any>();
      (catsRes.data || []).forEach((c: any) => categoriesById.set(c.id, c));
      const missingCatIds = Array.from(categoryIds).filter((id) => !categoriesById.has(id));
      if (missingCatIds.length > 0) {
        const { data: moreCats } = await supabase
          .from("wiki_categories")
          .select("id, title, description")
          .in("id", missingCatIds);
        (moreCats || []).forEach((c: any) => categoriesById.set(c.id, c));
      }

      const results: WikiSearchResult[] = [];

      (catsRes.data || []).forEach((c: any) => {
        const titleHit = c.title?.toLowerCase().includes(q.toLowerCase());
        const source = titleHit ? c.title : c.description || c.title || "";
        results.push({
          kind: "subject",
          id: c.id,
          title: c.title,
          subjectTitle: c.title,
          snippet: buildSnippet(source, q),
          matchInTitle: !!titleHit,
        });
      });

      (artsRes.data || []).forEach((a: any) => {
        const cat = categoriesById.get(a.category_id);
        results.push({
          kind: "article",
          id: a.id,
          title: a.title,
          subjectTitle: cat?.title || "",
          subjectId: a.category_id,
          contentType: a.content_type,
          snippet: buildSnippet(a.title, q),
          matchInTitle: true,
        });
      });

      pageRows.forEach((p: any) => {
        const art = articlesById.get(p.article_id);
        const cat = art ? categoriesById.get(art.category_id) : null;
        const bodyText = stripHtml(p.content || "");
        const source = p._titleHit ? p.title : bodyText;
        results.push({
          kind: "page",
          id: p.id,
          title: p.title,
          articleId: p.article_id,
          articleTitle: art?.title || "",
          articleContentType: art?.content_type || "document",
          subjectId: art?.category_id || "",
          subjectTitle: cat?.title || "",
          snippet: buildSnippet(source, q),
          matchInTitle: !!p._titleHit,
        });
      });

      // Rank: title matches > body; subject > article > page
      const kindRank: Record<string, number> = { subject: 0, article: 1, page: 2 };
      results.sort((a, b) => {
        if (a.matchInTitle !== b.matchInTitle) return a.matchInTitle ? -1 : 1;
        return kindRank[a.kind] - kindRank[b.kind];
      });

      return results.slice(0, 40);
    },
  });
};
