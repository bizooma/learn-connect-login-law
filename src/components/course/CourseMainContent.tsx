
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Calendar, FileText } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import QuizDisplay from "./QuizDisplay";
import CourseCalendar from "./CourseCalendar";

type Course = Tables<'courses'> & {
  lessons: (Tables<'lessons'> & {
    units: (Tables<'units'> & {
      quiz?: Tables<'quizzes'>;
    })[];
  })[];
};

type Unit = Tables<'units'> & {
  quiz?: Tables<'quizzes'>;
};

interface CourseMainContentProps {
  course: Course;
  selectedUnit: Unit | null;
  courseTitle: string;
  isAdmin?: boolean;
}

const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return url;
  
  // If it's already an embed URL, return as is
  if (url.includes('/embed/')) return url;
  
  // Handle different YouTube URL formats
  let videoId = '';
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  } else if (url.includes('youtube.com/embed/')) {
    return url; // Already in embed format
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return url; // Return original if not a YouTube URL
};

const CourseMainContent = ({ course, selectedUnit, courseTitle, isAdmin = false }: CourseMainContentProps) => {
  return (
    <div className="space-y-6">
      {/* Course Calendar */}
      <CourseCalendar courseId={course.id} isAdmin={isAdmin} />

      {selectedUnit ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{selectedUnit.title}</CardTitle>
              {selectedUnit.duration_minutes && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {selectedUnit.duration_minutes} minutes
                </div>
              )}
            </div>
            {selectedUnit.description && (
              <p className="text-gray-600">{selectedUnit.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedUnit.video_url && (
              <div>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <iframe
                    src={getYouTubeEmbedUrl(selectedUnit.video_url)}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                    title={selectedUnit.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )}
            
            {selectedUnit.content && (
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedUnit.content.replace(/\n/g, '<br>') }} />
              </div>
            )}

            {selectedUnit.file_url && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedUnit.file_name || 'Download File'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedUnit.file_size && `${Math.round(selectedUnit.file_size / 1024)} KB`}
                    </p>
                  </div>
                  <a
                    href={selectedUnit.file_url}
                    download={selectedUnit.file_name}
                    className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}

            {/* Quiz */}
            {selectedUnit.quiz && (
              <div className="space-y-4">
                <QuizDisplay
                  quiz={selectedUnit.quiz}
                  unitTitle={selectedUnit.title}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a unit to get started</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseMainContent;
