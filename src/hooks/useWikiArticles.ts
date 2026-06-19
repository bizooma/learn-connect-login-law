import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type WikiContentType =
  | "document"
  | "flowchart"
  | "video"
  | "file"
  | "checklist"
  | "test"
  // legacy values kept for backwards compatibility with existing rows
  | "policy"
  | "procedure";

export type WikiSubjectKind = "company" | "policy" | "procedure";

export interface WikiArticle {
  id: string;
  category_id: string;
  title: string;
  content: string | null;
  content_type: WikiContentType;
  subject_category: WikiSubjectKind | null;
  owner_id: string | null;
  file_url: string | null;
  file_name: string | null;
  tags: string[];
  sort_order: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const contentTypeLabels: Record<WikiContentType, string> = {
  document: "Document",
  flowchart: "Flowchart",
  video: "Video",
  file: "File",
  checklist: "Checklist",
  test: "Test",
  policy: "Policy",
  procedure: "Procedure",
};

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
    mutationFn: async (article: { category_id: string; title: string; content?: string; tags?: string[]; content_type?: WikiContentType; subject_category?: WikiSubjectKind; owner_id?: string | null; file_url?: string; file_name?: string }) => {
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
          content_type: article.content_type || "document",
          subject_category: article.subject_category || null,
          file_url: article.file_url || null,
          file_name: article.file_name || null,
          tags: article.tags || [],
          sort_order: nextOrder,
          created_by: userData.user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      const label = contentTypeLabels[variables.content_type || "document"];
      queryClient.invalidateQueries({ queryKey: ["wiki-articles"] });
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success(`${label} created`);
    },
    onError: (error) => toast.error("Failed to create: " + error.message),
  });

  const updateArticle = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: string; tags?: string[]; is_published?: boolean; sort_order?: number; file_url?: string; file_name?: string; subject_category?: WikiSubjectKind }) => {
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
      toast.success("Saved successfully");
    },
    onError: (error) => toast.error("Failed to save: " + error.message),
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wiki_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-articles"] });
      queryClient.invalidateQueries({ queryKey: ["wiki-categories"] });
      toast.success("Deleted successfully");
    },
    onError: (error) => toast.error("Failed to delete: " + error.message),
  });

  return {
    articles: articlesQuery.data || [],
    isLoading: articlesQuery.isLoading,
    createArticle,
    updateArticle,
    deleteArticle,
  };
};
