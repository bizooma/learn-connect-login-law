
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Option, useQuestionFormValidation } from "./questionFormValidation";

interface UseCreateQuestionFormProps {
  quizId: string;
  onQuestionCreated: () => void;
  onClose: () => void;
}

export const useCreateQuestionForm = ({ quizId, onQuestionCreated, onClose }: UseCreateQuestionFormProps) => {
  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState<Option[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { validateQuestion } = useQuestionFormValidation();

  const resetForm = () => {
    setQuestionText("");
    setPoints(1);
    setOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateQuestion(questionText, options)) {
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    setLoading(true);
    
    try {
      // Get the next sort order
      const { data: existingQuestions } = await supabase
        .from('quiz_questions')
        .select('sort_order')
        .eq('quiz_id', quizId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = existingQuestions?.[0]?.sort_order ? existingQuestions[0].sort_order + 1 : 0;

      // Create the question
      const { data: questionData, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quizId,
          question_text: questionText.trim(),
          points: points,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (questionError) {
        throw questionError;
      }

      // Create the options
      const optionsToInsert = validOptions.map((option, index) => ({
        question_id: questionData.id,
        option_text: option.text.trim(),
        is_correct: option.isCorrect,
        sort_order: index,
      }));

      const { error: optionsError } = await supabase
        .from('quiz_question_options')
        .insert(optionsToInsert);

      if (optionsError) {
        throw optionsError;
      }

      toast({
        title: "Success",
        description: "Question created successfully",
      });
      
      resetForm();
      onQuestionCreated();
      onClose();
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    questionText,
    setQuestionText,
    points,
    setPoints,
    options,
    setOptions,
    loading,
    handleSubmit,
    resetForm
  };
};
