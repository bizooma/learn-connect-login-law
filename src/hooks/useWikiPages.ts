import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WikiPage {
  id: string;
  article_id: string;
  title: string;
  content: string | null;
  sort_order: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useWikiPages = (articleId?: string) => {
  const queryClient = useQueryClient();

  const pagesQuery = useQuery({
    queryKey: ["wiki-pages", articleId],
    queryFn: async () => {
      if (!articleId) return [] as WikiPage[];
      const { data, error } = await supabase
        .from("wiki_pages" as any)
        .select("*")
        .eq("article_id", articleId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as WikiPage[];
    },
    enabled: !!articleId,
  });

  const createPage = useMutation({
    mutationFn: async ({ article_id, title }: { article_id: string; title: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("wiki_pages" as any)
        .select("sort_order")
        .eq("article_id", article_id)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? (existing[0] as any).sort_order + 1 : 0;

      const { data, error } = await supabase
        .from("wiki_pages" as any)
        .insert({
          article_id,
          title,
          sort_order: nextOrder,
          created_by: userData.user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-pages"] });
      toast.success("Page created");
    },
    onError: (error: any) => toast.error("Failed to create page: " + error.message),
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wiki_pages" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-pages"] });
      toast.success("Page deleted");
    },
    onError: (error: any) => toast.error("Failed to delete: " + error.message),
  });

  return {
    pages: pagesQuery.data || [],
    isLoading: pagesQuery.isLoading,
    createPage,
    deletePage,
  };
};
