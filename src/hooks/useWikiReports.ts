import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContentReportRow {
  article_id: string;
  title: string;
  category_id: string | null;
  category_title: string | null;
  is_published: boolean;
  updated_at: string;
  total_views: number;
  unique_readers: number;
  read_pct: number; // 0..100
}

export interface PeopleReportRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  job_title: string | null;
  articles_read: number;
  total_views: number;
  last_activity: string | null;
  read_pct: number;
}

export interface ActivityRow {
  id: string;
  viewed_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
  article_id: string;
  article_title: string;
  category_title: string | null;
}

const countActiveStaff = async () => {
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_deleted", false);
  return count ?? 0;
};

export const useContentReport = () => {
  return useQuery({
    queryKey: ["wiki-content-report"],
    queryFn: async (): Promise<ContentReportRow[]> => {
      const [articlesRes, categoriesRes, viewsRes, staffCount] = await Promise.all([
        supabase.from("wiki_articles").select("id, title, category_id, is_published, updated_at"),
        supabase.from("wiki_categories").select("id, title"),
        supabase.from("wiki_article_views").select("article_id, user_id"),
        countActiveStaff(),
      ]);

      if (articlesRes.error) throw articlesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (viewsRes.error) throw viewsRes.error;

      const catMap = new Map(
        (categoriesRes.data || []).map((c: any) => [c.id, c.title])
      );

      const totalsByArticle = new Map<string, number>();
      const uniqueByArticle = new Map<string, Set<string>>();
      for (const v of viewsRes.data || []) {
        totalsByArticle.set(v.article_id, (totalsByArticle.get(v.article_id) || 0) + 1);
        if (!uniqueByArticle.has(v.article_id)) uniqueByArticle.set(v.article_id, new Set());
        uniqueByArticle.get(v.article_id)!.add(v.user_id);
      }

      return (articlesRes.data || []).map((a: any) => {
        const unique = uniqueByArticle.get(a.id)?.size ?? 0;
        return {
          article_id: a.id,
          title: a.title,
          category_id: a.category_id,
          category_title: a.category_id ? catMap.get(a.category_id) ?? null : null,
          is_published: a.is_published,
          updated_at: a.updated_at,
          total_views: totalsByArticle.get(a.id) ?? 0,
          unique_readers: unique,
          read_pct: staffCount > 0 ? Math.round((unique / staffCount) * 100) : 0,
        };
      });
    },
  });
};

export const usePeopleReport = () => {
  return useQuery({
    queryKey: ["wiki-people-report"],
    queryFn: async (): Promise<PeopleReportRow[]> => {
      const [profilesRes, viewsRes, articleCountRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name, email, job_title")
          .eq("is_deleted", false),
        supabase
          .from("wiki_article_views")
          .select("user_id, article_id, viewed_at")
          .order("viewed_at", { ascending: false }),
        supabase
          .from("wiki_articles")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (viewsRes.error) throw viewsRes.error;

      const totalPublished = articleCountRes.count ?? 0;
      const totalsByUser = new Map<string, number>();
      const uniqueByUser = new Map<string, Set<string>>();
      const lastByUser = new Map<string, string>();
      for (const v of viewsRes.data || []) {
        totalsByUser.set(v.user_id, (totalsByUser.get(v.user_id) || 0) + 1);
        if (!uniqueByUser.has(v.user_id)) uniqueByUser.set(v.user_id, new Set());
        uniqueByUser.get(v.user_id)!.add(v.article_id);
        if (!lastByUser.has(v.user_id)) lastByUser.set(v.user_id, v.viewed_at);
      }

      return (profilesRes.data || []).map((p: any) => {
        const read = uniqueByUser.get(p.id)?.size ?? 0;
        return {
          user_id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          job_title: p.job_title,
          articles_read: read,
          total_views: totalsByUser.get(p.id) ?? 0,
          last_activity: lastByUser.get(p.id) ?? null,
          read_pct: totalPublished > 0 ? Math.round((read / totalPublished) * 100) : 0,
        };
      });
    },
  });
};

export const useActivityReport = (limit = 100) => {
  return useQuery({
    queryKey: ["wiki-activity-report", limit],
    queryFn: async (): Promise<ActivityRow[]> => {
      const viewsRes = await supabase
        .from("wiki_article_views")
        .select("id, viewed_at, user_id, article_id")
        .order("viewed_at", { ascending: false })
        .limit(limit);
      if (viewsRes.error) throw viewsRes.error;

      const userIds = Array.from(new Set((viewsRes.data || []).map((v: any) => v.user_id)));
      const articleIds = Array.from(new Set((viewsRes.data || []).map((v: any) => v.article_id)));

      const [profilesRes, articlesRes, categoriesRes] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds)
          : Promise.resolve({ data: [], error: null } as any),
        articleIds.length
          ? supabase.from("wiki_articles").select("id, title, category_id").in("id", articleIds)
          : Promise.resolve({ data: [], error: null } as any),
        supabase.from("wiki_categories").select("id, title"),
      ]);

      const profileMap = new Map(
        (profilesRes.data || []).map((p: any) => [p.id, p])
      );
      const articleMap = new Map(
        (articlesRes.data || []).map((a: any) => [a.id, a])
      );
      const catMap = new Map(
        (categoriesRes.data || []).map((c: any) => [c.id, c.title])
      );

      return (viewsRes.data || []).map((v: any) => {
        const p: any = profileMap.get(v.user_id);
        const a: any = articleMap.get(v.article_id);
        return {
          id: v.id,
          viewed_at: v.viewed_at,
          user_id: v.user_id,
          user_name: p
            ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email
            : "Unknown",
          user_email: p?.email ?? "",
          article_id: v.article_id,
          article_title: a?.title ?? "Deleted article",
          category_title: a?.category_id ? catMap.get(a.category_id) ?? null : null,
        };
      });
    },
  });
};
