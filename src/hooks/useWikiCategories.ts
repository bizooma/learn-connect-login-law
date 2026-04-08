import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WikiCategory {
  id: string;
  title: string;
  description: string | null;
  icon_name: string | null;
  sort_order: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  article_count?: number;
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

      return (data as WikiCategory[]).map((cat) => ({
        ...cat,
        article_count: counts[cat.id] || 0,
      }));
    },
  });

  const createCategory = useMutation({
    mutationFn: async (category: { title: string; description?: string; icon_name?: string }) => {
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
          sort_order: nextOrder,
          created_by: userData.user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Category created");
    },
    onError: (error) => toast.error("Failed to create category: " + error.message),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; icon_name?: string; is_published?: boolean; sort_order?: number }) => {
      const { data, error } = await supabase
        .from("wiki_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Category updated");
    },
    onError: (error) => toast.error("Failed to update category: " + error.message),
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
