
import { Tables } from "@/integrations/supabase/types";
import CourseVideo from "./CourseVideo";
import LessonVideo from "./LessonVideo";
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
type Lesson = Tables<'lessons'>;

interface UnitWithQuiz extends Omit<Unit, 'files'> {
  quiz?: Quiz;
  files?: Array<{ url: string; name: string; size: number }>;
}

interface CourseContentProps {
  unit: UnitWithQuiz | null;
  lesson?: Lesson | null;
  courseId: string;
  courseTitle?: string;
}

const CourseContent = ({ unit, lesson, courseId, courseTitle }: CourseContentProps) => {
  const { user } = useAuth();
  const { isCompleted, loading, refetchCompletion } = useCourseCompletion(courseId);

  // Refresh completion status when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      refetchCompletion();
    }
  }, [courseId, refetchCompletion]);

  const handleFileDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleLessonFileDownload = () => {
    if (lesson?.file_url) {
      window.open(lesson.file_url, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check if this unit has a quiz attached to it
  const hasQuiz = unit?.quiz && unit.quiz.is_active;

  // Convert UnitWithQuiz to Unit for components that expect the database type
  const unitForDatabase: Unit | null = unit ? {
    ...unit,
    files: unit.files ? JSON.stringify(unit.files) : null
  } : null;

  return (
    <div className="space-y-6">
      {/* Show lesson video if available */}
      {lesson && <LessonVideo lesson={lesson} courseId={courseId} />}
      
      {/* Show unit video */}
      <CourseVideo unit={unitForDatabase} courseId={courseId} />
      
      {/* Lesson file download section */}
      {lesson?.file_url && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 break-words">Lesson Resources</h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <File className="h-5 w-5 text-gray-600 flex-shrink-0" />
              <span className="font-medium break-words">
                {lesson.file_name || 'Download Lesson File'}
              </span>
            </div>
            <Button
              onClick={handleLessonFileDownload}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 flex-shrink-0 ml-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Unit multiple files download section */}
      {unit?.files && unit.files.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 break-words">Unit Resources ({unit.files.length} files)</h3>
          <div className="space-y-3">
            {unit.files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <File className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block break-words">{file.name}</span>
                    <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <Button
                  onClick={() => handleFileDownload(file.url)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 flex-shrink-0 ml-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy single file support (for backward compatibility) */}
      {unit?.file_url && !unit?.files && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 break-words">Unit Resources</h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <File className="h-5 w-5 text-gray-600 flex-shrink-0" />
              <span className="font-medium break-words">
                {unit.file_name || 'Download Unit File'}
              </span>
            </div>
            <Button
              onClick={() => handleFileDownload(unit.file_url!)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 flex-shrink-0 ml-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      )}
      
      {unit?.content && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 break-words">Unit Content</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed break-words">{unit.content}</p>
          </div>
        </div>
      )}
      
      {hasQuiz && (
        <QuizDisplay quiz={unit.quiz!} unitTitle={unit.title} courseId={courseId} />
      )}
      
      {!hasQuiz && unitForDatabase && (
        <UnitCompletionButton 
          unit={unitForDatabase} 
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
