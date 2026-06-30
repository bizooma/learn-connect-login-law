import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type WikiSubjectCategory = "policy" | "procedure" | "company";

export interface WikiCategory {
  id: string;
  title: string;
  description: string | null;
  icon_name: string | null;
  category: WikiSubjectCategory;
  sort_order: number;
  is_published: boolean;
  owner_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  article_count?: number;
  owner?: { id: string; first_name: string | null; last_name: string | null; email: string; profile_image_url: string | null } | null;
  shared_groups?: { id: string; name: string }[];
}

export const useWikiCategories = () => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["wiki-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wiki_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;

      // Get article counts
      const { data: articles, error: articlesError } = await supabase
        .from("wiki_articles")
        .select("category_id");
      if (articlesError) throw articlesError;

      const counts: Record<string, number> = {};
      articles?.forEach((a: any) => {
        counts[a.category_id] = (counts[a.category_id] || 0) + 1;
      });

      // Get owner profiles
      const ownerIds = Array.from(
        new Set((data as any[]).map((c) => c.owner_id).filter(Boolean)),
      ) as string[];
      let ownersMap: Record<string, any> = {};
      if (ownerIds.length > 0) {
        const { data: owners } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", ownerIds);
        ownersMap = Object.fromEntries((owners || []).map((o: any) => [o.id, o]));
      }

      // Get shared groups
      const categoryIds = (data as any[]).map((c) => c.id);
      const sharesMap: Record<string, { id: string; name: string }[]> = {};
      if (categoryIds.length > 0) {
        const { data: shares } = await supabase
          .from("wiki_category_groups")
          .select("category_id, group:groups(id, name)")
          .in("category_id", categoryIds);
        (shares || []).forEach((s: any) => {
          if (!s.group) return;
          (sharesMap[s.category_id] ||= []).push({ id: s.group.id, name: s.group.name });
        });
      }

      return (data as WikiCategory[]).map((cat) => ({
        ...cat,
        article_count: counts[cat.id] || 0,
        owner: cat.owner_id ? ownersMap[cat.owner_id] || null : null,
        shared_groups: sharesMap[cat.id] || [],
      }));
    },
  });

  const createCategory = useMutation({
    mutationFn: async (category: { title: string; description?: string; icon_name?: string; category?: WikiSubjectCategory }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("wiki_categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? (existing[0] as any).sort_order + 1 : 0;

      const { data, error } = await supabase
        .from("wiki_categories")
        .insert({
          title: category.title,
          description: category.description || null,
          icon_name: category.icon_name || "FileText",
          category: category.category || "company",
          sort_order: nextOrder,
          created_by: userData.user.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Subject created");
    },
    onError: (error) => toast.error("Failed to create subject: " + error.message),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; icon_name?: string; category?: WikiSubjectCategory; is_published?: boolean; sort_order?: number; owner_id?: string | null }) => {
      const { data, error } = await supabase
        .from("wiki_categories")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Subject updated");
    },
    onError: (error) => toast.error("Failed to update subject: " + error.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wiki_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Category deleted");
    },
    onError: (error) => toast.error("Failed to delete category: " + error.message),
  });

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
