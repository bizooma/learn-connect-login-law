import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface QuizAttemptData {
  quizId: string;
  unitId: string;
  courseId: string;
  answers: Record<string, string>;
  calculatedScore: number;
  displayedScore: number;
  correctAnswers: number;
  totalQuestions: number;
  passingScore: number;
}

export const useQuizAudit = () => {
  const { user } = useAuth();

  const logQuizAttempt = useCallback(async (attemptData: QuizAttemptData) => {
    if (!user) return;

    try {
      // Log to user activity log for audit trail
      const { error } = await supabase
        .from('user_activity_log')
        .insert({
          user_id: user.id,
          activity_type: 'quiz_complete',
          course_id: attemptData.courseId,
          unit_id: attemptData.unitId,
          quiz_id: attemptData.quizId,
          metadata: {
            calculated_score: attemptData.calculatedScore,
            displayed_score: attemptData.displayedScore,
            correct_answers: attemptData.correctAnswers,
            total_questions: attemptData.totalQuestions,
            passing_score: attemptData.passingScore,
            score_discrepancy: attemptData.calculatedScore !== attemptData.displayedScore,
            answers: attemptData.answers,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('❌ Failed to log quiz attempt:', error);
      } else {
        console.log('✅ Quiz attempt logged successfully');
      }

      // If there's a score discrepancy, log it as a warning
      if (attemptData.calculatedScore !== attemptData.displayedScore) {
        console.warn('⚠️ QUIZ SCORE DISCREPANCY DETECTED:', {
          calculated: attemptData.calculatedScore,
          displayed: attemptData.displayedScore,
          quiz: attemptData.quizId,
          user: user.id
        });
      }

    } catch (error) {
      console.error('❌ Error logging quiz attempt:', error);
    }
  }, [user]);

  const validateQuizScore = useCallback((
    answers: Record<string, string>,
    questions: any[],
    passingScore: number
  ) => {
    let correctAnswers = 0;
    
    questions.forEach(question => {
      const selectedOptionId = answers[question.id];
      const correctOption = question.quiz_question_options?.find((opt: any) => opt.is_correct);
      
      if (selectedOptionId === correctOption?.id) {
        correctAnswers++;
      }
    });

    const calculatedScore = Math.round((correctAnswers / questions.length) * 100);
    
    return {
      calculatedScore,
      correctAnswers,
      totalQuestions: questions.length,
      passed: calculatedScore >= passingScore
    };
  }, []);

  return {
    logQuizAttempt,
    validateQuizScore
  };
};