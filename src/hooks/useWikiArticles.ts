import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WikiArticle {
  id: string;
  category_id: string;
  title: string;
  content: string | null;
  tags: string[];
  sort_order: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useWikiArticles = (categoryId?: string) => {
  const queryClient = useQueryClient();

  const articlesQuery = useQuery({
    queryKey: ["wiki-articles", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("wiki_articles")
        .select("*")
        .order("sort_order", { ascending: true });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WikiArticle[];
    },
    enabled: !!categoryId || categoryId === undefined,
  });

  const createArticle = useMutation({
    mutationFn: async (article: { category_id: string; title: string; content?: string; tags?: string[] }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("wiki_articles")
        .select("sort_order")
        .eq("category_id", article.category_id)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? (existing[0] as any).sort_order + 1 : 0;

      const { data, error } = await supabase
        .from("wiki_articles")
        .insert({
          category_id: article.category_id,
          title: article.title,
          content: article.content || "",
          tags: article.tags || [],
          sort_order: nextOrder,
          created_by: userData.user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-articles"] });
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Article created");
    },
    onError: (error) => toast.error("Failed to create article: " + error.message),
  });

  const updateArticle = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: string; tags?: string[]; is_published?: boolean; sort_order?: number }) => {
      const { data, error } = await supabase
        .from("wiki_articles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-articles"] });
      toast.success("Article updated");
    },
    onError: (error) => toast.error("Failed to update article: " + error.message),
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wiki_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-articles"] });
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Article deleted");
    },
    onError: (error) => toast.error("Failed to delete article: " + error.message),
  });

  return {
    articles: articlesQuery.data || [],
    isLoading: articlesQuery.isLoading,
    createArticle,
    updateArticle,
    deleteArticle,
  };
};
