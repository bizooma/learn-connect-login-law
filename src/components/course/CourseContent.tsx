
import { Tables } from "@/integrations/supabase/types";
import CourseVideo from "./CourseVideo";
import QuizDisplay from "./QuizDisplay";
import CertificateDownload from "../certificates/CertificateDownload";
import { Button } from "@/components/ui/button";
import { Download, File, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useCourseCompletion } from "@/hooks/useCourseCompletion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface UnitWithQuiz extends Unit {
  quiz?: Quiz;
}

interface CourseContentProps {
  unit: UnitWithQuiz | null;
  courseId: string;
  courseTitle?: string;
}

const CourseContent = ({ unit, courseId, courseTitle }: CourseContentProps) => {
  const { user } = useAuth();
  const { markUnitComplete } = useUserProgress(user?.id);
  const { isCompleted } = useCourseCompletion(courseId);
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const handleFileDownload = () => {
    if (unit?.file_url) {
      window.open(unit.file_url, '_blank');
    }
  };

  const handleMarkComplete = async () => {
    if (!unit || !user || !courseId) {
      console.error('Missing required data for marking unit complete:', { unit: !!unit, user: !!user, courseId });
      toast({
        title: "Error",
        description: "Missing required information to mark unit complete",
        variant: "destructive",
      });
      return;
    }
    
    setIsCompleting(true);
    try {
      console.log('Marking unit complete:', { unitId: unit.id, courseId, userId: user.id });
      await markUnitComplete(unit.id, courseId);
      
      toast({
        title: "Success",
        description: "Unit marked as complete!",
      });
    } catch (error) {
      console.error('Error marking unit complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark unit as complete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // Check if this unit has a quiz attached to it
  const hasQuiz = unit?.quiz && unit.quiz.is_active;

  return (
    <div className="space-y-6">
      <CourseVideo unit={unit} courseId={courseId} />
      
      {unit?.file_url && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Downloadable Resources</h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2">
              <File className="h-5 w-5 text-gray-600" />
              <span className="font-medium">
                {unit.file_name || 'Download File'}
              </span>
            </div>
            <Button
              onClick={handleFileDownload}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      )}
      
      {unit?.content && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Unit Content</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{unit.content}</p>
          </div>
        </div>
      )}
      
      {hasQuiz && (
        <QuizDisplay quiz={unit.quiz!} unitTitle={unit.title} courseId={courseId} />
      )}
      
      {!hasQuiz && unit && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Complete Unit</h3>
              <p className="text-gray-600">Mark this unit as complete to track your progress.</p>
            </div>
            <Button 
              onClick={handleMarkComplete}
              disabled={isCompleting || !user}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isCompleting ? 'Completing...' : 'Mark Complete'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Certificate Download Section */}
      <CertificateDownload 
        courseId={courseId}
        courseTitle={courseTitle || 'Course'}
        isCompleted={isCompleted}
      />
    </div>
  );
};

export default CourseContent;
