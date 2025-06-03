
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, CheckCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import QuizInterface from "../quiz/QuizInterface";

type Quiz = Tables<'quizzes'>;

interface QuizDisplayProps {
  quiz: Quiz;
  unitTitle: string;
}

const QuizDisplay = ({ quiz, unitTitle }: QuizDisplayProps) => {
  const [quizStarted, setQuizStarted] = useState(false);

  const handleQuizComplete = async (score: number, passed: boolean) => {
    console.log('Quiz completed:', { score, passed });
    
    // Import gamification utilities
    const { useAuth } = await import("@/hooks/useAuth");
    const { hasGamificationAccess } = await import("@/utils/gamificationAccess");
    const { supabase } = await import("@/integrations/supabase/client");
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Get user profile to check email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();
      
      // Check if user has gamification access
      if (profile && hasGamificationAccess(profile.email)) {
        try {
          // Calculate points based on score
          let points = Math.floor(score * 0.5); // Base points based on score
          let activityType = 'quiz_completion';
          let description = `Completed quiz: ${quiz.title} (${score}%)`;
          
          // Bonus points for perfect score
          if (score === 100) {
            points += 25;
            activityType = 'perfect_quiz';
            description = `Perfect score on quiz: ${quiz.title}!`;
          }
          
          // Award points
          await supabase.rpc('update_user_points', {
            p_user_id: user.id,
            p_points: points,
            p_activity_type: activityType,
            p_activity_id: quiz.id,
            p_description: description
          });
          
          // Check for new achievements
          await supabase.rpc('check_achievements', {
            p_user_id: user.id
          });
          
          console.log(`Awarded ${points} XP for quiz completion`);
        } catch (error) {
          console.error('Error awarding quiz points:', error);
        }
      }
    }
  };

  if (quizStarted) {
    return (
      <QuizInterface 
        quiz={quiz}
        unitTitle={unitTitle}
        onQuizComplete={handleQuizComplete}
      />
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">{quiz.title}</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Quiz
          </Badge>
        </div>
        {quiz.description && (
          <p className="text-blue-700 text-sm">{quiz.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Passing Score: {quiz.passing_score}%</span>
          </div>
          {quiz.time_limit_minutes && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span>Time Limit: {quiz.time_limit_minutes} minutes</span>
            </div>
          )}
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={() => setQuizStarted(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!quiz.is_active}
          >
            {quiz.is_active ? 'Start Quiz' : 'Quiz Not Available'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizDisplay;
