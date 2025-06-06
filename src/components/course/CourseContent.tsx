
import { Tables } from "@/integrations/supabase/types";
import CourseVideo from "./CourseVideo";
import QuizDisplay from "./QuizDisplay";
import CertificateDownload from "../certificates/CertificateDownload";
import UnitCompletionButton from "./UnitCompletionButton";
import { Button } from "@/components/ui/button";
import { Download, File } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCourseCompletion } from "@/hooks/useCourseCompletion";
import { useEffect } from "react";

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
  const { isCompleted, loading, refetchCompletion } = useCourseCompletion(courseId);

  // Refresh completion status when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      refetchCompletion();
    }
  }, [courseId, refetchCompletion]);

  const handleFileDownload = () => {
    if (unit?.file_url) {
      window.open(unit.file_url, '_blank');
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
        <UnitCompletionButton 
          unit={unit} 
          courseId={courseId} 
          onComplete={refetchCompletion}
        />
      )}

      {/* Certificate Download Section */}
      <CertificateDownload 
        courseId={courseId}
        courseTitle={courseTitle || 'Course'}
        isCompleted={isCompleted}
        loading={loading}
      />
    </div>
  );
};

export default CourseContent;
