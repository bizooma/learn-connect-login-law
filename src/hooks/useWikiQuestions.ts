import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WikiQuestionChoice {
  id: string;
  question_id: string;
  choice_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface WikiQuestion {
  id: string;
  article_id: string;
  question_text: string;
  question_type: string;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  choices: WikiQuestionChoice[];
}

export const useWikiQuestions = (articleId?: string) => {
  const qc = useQueryClient();

  const questionsQuery = useQuery({
    queryKey: ["wiki-questions", articleId],
    queryFn: async () => {
      if (!articleId) return [] as WikiQuestion[];
      const { data: qs, error } = await supabase
        .from("wiki_questions" as any)
        .select("*")
        .eq("article_id", articleId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      const questions = (qs || []) as any[];
      if (questions.length === 0) return [];
      const ids = questions.map((q) => q.id);
      const { data: choices, error: cErr } = await supabase
        .from("wiki_question_choices" as any)
        .select("*")
        .in("question_id", ids)
        .order("sort_order", { ascending: true });
      if (cErr) throw cErr;
      const byQ: Record<string, WikiQuestionChoice[]> = {};
      ((choices || []) as any[]).forEach((c) => {
        (byQ[c.question_id] ||= []).push(c);
      });
      return questions.map((q) => ({ ...q, choices: byQ[q.id] || [] })) as WikiQuestion[];
    },
    enabled: !!articleId,
  });

  const createQuestion = useMutation({
    mutationFn: async (article_id: string) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("wiki_questions" as any)
        .select("sort_order")
        .eq("article_id", article_id)
        .order("sort_order", { ascending: false })
        .limit(1);
      const next = existing && existing.length ? (existing[0] as any).sort_order + 1 : 0;
      const { data: q, error } = await supabase
        .from("wiki_questions" as any)
        .insert({ article_id, sort_order: next, created_by: u.user.id })
        .select()
        .single();
      if (error) throw error;
      // seed with 2 empty choices
      await supabase.from("wiki_question_choices" as any).insert([
        { question_id: (q as any).id, sort_order: 0 },
        { question_id: (q as any).id, sort_order: 1 },
      ]);
      return q;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki-questions"] }),
    onError: (e: any) => toast.error("Failed to add question: " + e.message),
  });

  const updateQuestion = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; question_text?: string; question_type?: string }) => {
      const { error } = await supabase.from("wiki_questions" as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki-questions"] }),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wiki_questions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki-questions"] }),
  });

  const addChoice = useMutation({
    mutationFn: async ({ question_id, sort_order }: { question_id: string; sort_order: number }) => {
      const { error } = await supabase
        .from("wiki_question_choices" as any)
        .insert({ question_id, sort_order });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki-questions"] }),
  });

  const updateChoice = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; choice_text?: string; is_correct?: boolean }) => {
      const { error } = await supabase.from("wiki_question_choices" as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki-questions"] }),
  });

  const setCorrectChoice = useMutation({
    mutationFn: async ({ question_id, choice_id }: { question_id: string; choice_id: string }) => {
      await supabase.from("wiki_question_choices" as any).update({ is_correct: false }).eq("question_id", question_id);
      const { error } = await supabase
        .from("wiki_question_choices" as any)
        .update({ is_correct: true })
        .eq("id", choice_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki-questions"] }),
  });

  const deleteChoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wiki_question_choices" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki-questions"] }),
  });

  return {
    questions: questionsQuery.data || [],
    isLoading: questionsQuery.isLoading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    addChoice,
    updateChoice,
    setCorrectChoice,
    deleteChoice,
  };
};
