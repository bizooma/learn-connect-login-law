import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamPulseItem {
  id: string;
  kind: "overdue_review" | "draft_stale" | "empty_subject";
  title: string;
  badge: string;
  context: string;
  age_days: number;
  link_to?: string;
}

export interface WeeklyBucket {
  label: string; // e.g. "Jun 01-07"
  start: string; // ISO
  count: number;
}

export interface HomeInsights {
  activeUsersByWeek: WeeklyBucket[];
  viewsByWeek: WeeklyBucket[];
  searchesByWeek: WeeklyBucket[];
  activeUsersTotal: number;
  viewsTotal: number;
  searchesTotal: number;
}

const OVERDUE_DAYS = 90;
const DRAFT_STALE_DAYS = 14;

const fmtRange = (start: Date, end: Date) => {
  const m = (d: Date) => d.toLocaleString("en-US", { month: "short" });
  return `${m(start)} ${String(start.getDate()).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
};

const buildWeeks = (numWeeks = 4) => {
  const weeks: { label: string; start: Date; end: Date }[] = [];
  const today = new Date();
  // Anchor on most recent Sunday
  const anchor = new Date(today);
  anchor.setHours(0, 0, 0, 0);
  anchor.setDate(anchor.getDate() - anchor.getDay());
  for (let i = numWeeks - 1; i >= 0; i--) {
    const start = new Date(anchor);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    weeks.push({ label: fmtRange(start, end), start, end });
  }
  return weeks;
};

export const useTeamPulse = () => {
  return useQuery({
    queryKey: ["wiki-team-pulse"],
    queryFn: async (): Promise<TeamPulseItem[]> => {
      const [articlesRes, categoriesRes] = await Promise.all([
        supabase
          .from("wiki_articles")
          .select("id, title, is_published, updated_at, category_id"),
        supabase.from("wiki_categories").select("id, title"),
      ]);
      if (articlesRes.error) throw articlesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const catMap = new Map((categoriesRes.data || []).map((c: any) => [c.id, c.title]));
      const articleCountByCat = new Map<string, number>();
      for (const a of articlesRes.data || []) {
        articleCountByCat.set(a.category_id, (articleCountByCat.get(a.category_id) || 0) + 1);
      }

      const now = Date.now();
      const items: TeamPulseItem[] = [];

      const overdue = (articlesRes.data || [])
        .filter((a: any) => a.is_published)
        .map((a: any) => ({ a, age: Math.floor((now - new Date(a.updated_at).getTime()) / 86400000) }))
        .filter((x) => x.age >= OVERDUE_DAYS)
        .sort((x, y) => y.age - x.age);

      if (overdue.length) {
        items.push({
          id: `overdue-${overdue[0].a.id}`,
          kind: "overdue_review",
          title:
            overdue.length === 1
              ? `1 published article is overdue for review`
              : `${overdue.length} published articles are overdue for review`,
          badge: "Review",
          context: catMap.get(overdue[0].a.category_id) || overdue[0].a.title,
          age_days: overdue[0].age,
        });
      }

      const draftStale = (articlesRes.data || [])
        .filter((a: any) => !a.is_published)
        .map((a: any) => ({ a, age: Math.floor((now - new Date(a.updated_at).getTime()) / 86400000) }))
        .filter((x) => x.age >= DRAFT_STALE_DAYS)
        .sort((x, y) => y.age - x.age);

      if (draftStale.length) {
        items.push({
          id: `draft-${draftStale[0].a.id}`,
          kind: "draft_stale",
          title:
            draftStale.length === 1
              ? `1 draft article needs to be published or removed`
              : `${draftStale.length} draft articles need to be published or removed`,
          badge: "Draft",
          context: draftStale[0].a.title,
          age_days: draftStale[0].age,
        });
      }

      const empty = (categoriesRes.data || []).filter((c: any) => !articleCountByCat.get(c.id));
      if (empty.length) {
        items.push({
          id: `empty-${empty[0].id}`,
          kind: "empty_subject",
          title:
            empty.length === 1
              ? `1 subject has no content yet`
              : `${empty.length} subjects have no content yet`,
          badge: "Empty",
          context: empty.map((c: any) => c.title).slice(0, 3).join(", "),
          age_days: 0,
        });
      }

      return items;
    },
  });
};

export const useHomeInsights = () => {
  return useQuery({
    queryKey: ["wiki-home-insights"],
    queryFn: async (): Promise<HomeInsights> => {
      const weeks = buildWeeks(4);
      const earliest = weeks[0].start.toISOString();
      const { data, error } = await supabase
        .from("wiki_article_views")
        .select("user_id, viewed_at")
        .gte("viewed_at", earliest);
      if (error) throw error;

      const activeUsersByWeek: WeeklyBucket[] = weeks.map((w) => ({
        label: w.label,
        start: w.start.toISOString(),
        count: 0,
      }));
      const viewsByWeek: WeeklyBucket[] = weeks.map((w) => ({
        label: w.label,
        start: w.start.toISOString(),
        count: 0,
      }));
      const usersPerWeek = weeks.map(() => new Set<string>());

      for (const v of data || []) {
        const t = new Date(v.viewed_at).getTime();
        const idx = weeks.findIndex((w) => t >= w.start.getTime() && t <= w.end.getTime() + 86399999);
        if (idx === -1) continue;
        viewsByWeek[idx].count += 1;
        usersPerWeek[idx].add(v.user_id);
      }
      usersPerWeek.forEach((s, i) => (activeUsersByWeek[i].count = s.size));

      const allUsers = new Set<string>();
      (data || []).forEach((v: any) => allUsers.add(v.user_id));

      return {
        activeUsersByWeek,
        viewsByWeek,
        searchesByWeek: weeks.map((w) => ({ label: w.label, start: w.start.toISOString(), count: 0 })),
        activeUsersTotal: allUsers.size,
        viewsTotal: data?.length ?? 0,
        searchesTotal: 0,
      };
    },
  });
};

export interface OwnedArticle {
  id: string;
  title: string;
  is_published: boolean;
  updated_at: string;
  category_title: string | null;
}

export const useContentYouOwn = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["wiki-content-owned", userId],
    enabled: !!userId,
    queryFn: async (): Promise<OwnedArticle[]> => {
      const [articlesRes, categoriesRes] = await Promise.all([
        supabase
          .from("wiki_articles")
          .select("id, title, is_published, updated_at, category_id")
          .eq("created_by", userId!)
          .order("updated_at", { ascending: false }),
        supabase.from("wiki_categories").select("id, title"),
      ]);
      if (articlesRes.error) throw articlesRes.error;
      const catMap = new Map((categoriesRes.data || []).map((c: any) => [c.id, c.title]));
      return (articlesRes.data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        is_published: a.is_published,
        updated_at: a.updated_at,
        category_title: catMap.get(a.category_id) ?? null,
      }));
    },
  });
};
