import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { WikiCategory, WikiAccessLevel } from "@/hooks/useWikiCategories";

export type EffectiveAccess = "none" | "view" | "edit" | "full";

const rank: Record<WikiAccessLevel, number> = { view: 1, edit: 2, full: 3 };

/**
 * Computes the current user's effective access level on wiki categories.
 * Mirrors the DB function `public.wiki_category_access` so the UI can
 * gate buttons consistently with RLS.
 */
export const useWikiAccess = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const { data: myGroupIds = [] } = useQuery({
    queryKey: ["my-group-ids", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []).map((r: any) => r.group_id as string);
    },
  });

  const getAccess = (category: WikiCategory | undefined | null): EffectiveAccess => {
    if (!category || !user?.id) return "none";
    if (isAdmin) return "full";
    if (category.owner_id === user.id) return "full";

    const groupSet = new Set(myGroupIds);
    let best: WikiAccessLevel | null = null;
    for (const sg of category.shared_groups || []) {
      if (!groupSet.has(sg.id)) continue;
      if (!best || rank[sg.access_level] > rank[best]) best = sg.access_level;
    }
    if (best) return best;

    if (category.is_published && category.discoverability === "discoverable") {
      return "view";
    }
    return "none";
  };

  const canView = (c: WikiCategory) => getAccess(c) !== "none";
  const canEdit = (c: WikiCategory) => {
    const a = getAccess(c);
    return a === "edit" || a === "full";
  };
  const canDelete = (c: WikiCategory) => getAccess(c) === "full";

  return { getAccess, canView, canEdit, canDelete, isAdmin };
};
