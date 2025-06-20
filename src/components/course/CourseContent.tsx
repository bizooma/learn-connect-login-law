
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import CourseVideo from "./CourseVideo";
import LessonVideo from "./LessonVideo";
import LessonCard from "./LessonCard";
import QuizDisplay from "./QuizDisplay";
import CertificateDownload from "../certificates/CertificateDownload";
import UnitCompletionButton from "./UnitCompletionButton";
import SmartCompletionIndicator from "./SmartCompletionIndicator";
import UnitCompletionRequirements from "./UnitCompletionRequirements";
import { Button } from "@/components/ui/button";
import { Download, File } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCourseCompletion } from "@/hooks/useCourseCompletion";
import MarkdownRenderer from "@/components/ui/markdown-renderer";

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
  onProgressUpdate?: () => void;
}

const CourseContent = ({ unit, lesson, courseId, courseTitle, onProgressUpdate }: CourseContentProps) => {
  const { user } = useAuth();
  const { isCompleted, loading, refetchCompletion } = useCourseCompletion(courseId);
  const [unitQuiz, setUnitQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch quiz for the current unit with real-time updates
  useEffect(() => {
    const fetchUnitQuiz = async () => {
      if (!unit?.id) {
        setUnitQuiz(null);
        return;
      }

      console.log('COURSE CONTENT: Fetching quiz for unit:', unit.id);
      setQuizLoading(true);
      
      try {
        const { data: quizData, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('unit_id', unit.id)
          .eq('is_active', true)
          .eq('is_deleted', false)
          .is('deleted_at', null)
          .maybeSingle();

        if (error) {
          console.error('COURSE CONTENT: Error fetching quiz:', error);
          setUnitQuiz(null);
        } else {
          console.log('COURSE CONTENT: Quiz found:', quizData ? `${quizData.title} (ID: ${quizData.id})` : 'No quiz');
          setUnitQuiz(quizData);
        }
      } catch (error) {
        console.error('COURSE CONTENT: Error in fetchUnitQuiz:', error);
        setUnitQuiz(null);
      } finally {
        setQuizLoading(false);
      }
    };

    fetchUnitQuiz();

    // Set up real-time subscription for quiz changes
    if (unit?.id) {
      console.log('COURSE CONTENT: Setting up real-time subscription for unit quiz changes');
      
      const channel = supabase
        .channel(`unit-quiz-${unit.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quizzes',
            filter: `unit_id=eq.${unit.id}`
          },
          (payload) => {
            console.log('COURSE CONTENT: Quiz change detected:', payload);
            fetchUnitQuiz();
          }
        )
        .subscribe();

      return () => {
        console.log('COURSE CONTENT: Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      };
    }
  }, [unit?.id]);

  // Refresh completion status when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      refetchCompletion();
    }
  }, [courseId, refetchCompletion, refreshKey]);

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

  const handleProgressRefresh = () => {
    console.log('COURSE CONTENT: Refreshing progress after completion');
    setRefreshKey(prev => prev + 1);
    refetchCompletion();
    if (onProgressUpdate) {
      onProgressUpdate();
    }
  };

  // Check if this unit has a quiz attached to it
  const hasQuiz = unitQuiz && unitQuiz.is_active && !unitQuiz.is_deleted;

  // Convert UnitWithQuiz to Unit for components that expect the database type
  const unitForDatabase: Unit | null = unit ? {
    ...unit,
    files: unit.files ? JSON.stringify(unit.files) : null
  } : null;

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Lesson Card - Display when lesson is available */}
      {lesson && (
        <LessonCard lesson={lesson} />
      )}

      {/* Unit Completion Requirements - Show requirements and progress */}
      {unitForDatabase && (
        <UnitCompletionRequirements 
          unit={unitForDatabase} 
          courseId={courseId} 
          hasQuiz={!!hasQuiz} 
          refreshKey={refreshKey}
        />
      )}

      {/* Smart Completion Indicator */}
      {unitForDatabase && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Status</h3>
            <SmartCompletionIndicator 
              unit={unitForDatabase} 
              courseId={courseId} 
              hasQuiz={!!hasQuiz} 
              refreshKey={refreshKey}
            />
          </div>
        </div>
      )}

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
          <div className="max-w-none">
            <MarkdownRenderer 
              content={unit.content} 
              className="text-gray-700 leading-relaxed break-words"
            />
          </div>
        </div>
      )}
      
      {/* Quiz Display Section */}
      {quizLoading && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span>Loading quiz...</span>
          </div>
        </div>
      )}
      
      {hasQuiz && !quizLoading && (
        <QuizDisplay 
          quiz={unitQuiz!} 
          unitTitle={unit?.title || 'Unit'} 
          courseId={courseId} 
          onUnitComplete={handleProgressRefresh}
        />
      )}
      
      {!hasQuiz && !quizLoading && unitForDatabase && (
        <UnitCompletionButton 
          unit={unitForDatabase} 
          courseId={courseId} 
          onComplete={handleProgressRefresh}
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
