
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizImportManagerProps {
  importedQuizData: any;
  units: any[];
  onImportComplete: (importData: any) => void;
  onCancelImport: () => void;
  refetch: () => void;
  setImportedQuizData: (data: any) => void;
  setActiveTab: (tab: string) => void;
}

export const useQuizImportManager = ({
  refetch,
  setImportedQuizData,
  setActiveTab
}: Pick<QuizImportManagerProps, 'refetch' | 'setImportedQuizData' | 'setActiveTab'>) => {
  const { toast } = useToast();

  const handleImportComplete = (importData: any) => {
    setImportedQuizData(importData);
    setActiveTab("review");
  };

  const handleConfirmImport = async (finalData: any) => {
    try {
      // Create the quiz without unit assignment
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: finalData.title,
          description: finalData.description,
          passing_score: finalData.passing_score,
          time_limit_minutes: finalData.time_limit_minutes,
          source_type: 'powerpoint',
          is_active: true
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions and options
      for (let i = 0; i < finalData.questions.length; i++) {
        const question = finalData.questions[i];
        
        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question_text: question.question_text,
            question_type: 'multiple_choice',
            points: 1,
            sort_order: i,
            source_slide_number: question.slide_number
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create options
        const optionsToInsert = question.options.map((option: any, optionIndex: number) => ({
          question_id: questionData.id,
          option_text: option.text,
          is_correct: option.is_correct,
          sort_order: optionIndex
        }));

        const { error: optionsError } = await supabase
          .from('quiz_question_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      setImportedQuizData(null);
      setActiveTab("browse");
      refetch();
      
      toast({
        title: "Success",
        description: `Quiz "${finalData.title}" created successfully with ${finalData.questions.length} questions. You can now assign it to units when creating or editing courses.`,
      });

    } catch (error) {
      console.error('Error creating imported quiz:', error);
      toast({
        title: "Error",
        description: "Failed to create quiz from import",
        variant: "destructive",
      });
    }
  };

  const handleCancelImport = () => {
    setImportedQuizData(null);
    setActiveTab("browse");
  };

  return {
    handleImportComplete,
    handleConfirmImport,
    handleCancelImport
  };
};
