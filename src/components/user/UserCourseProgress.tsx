
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Trophy, Play } from "lucide-react";
import { useUserProgress } from "@/hooks/useUserProgress";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type CourseProgress = Tables<'user_course_progress'>;

interface CourseWithProgress extends Course {
  progress?: CourseProgress;
}

interface UserCourseProgressProps {
  userId: string;
}

const UserCourseProgress = ({ userId }: UserCourseProgressProps) => {
  const { completedCourses, currentCourse, loading } = useUserProgress(userId);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Course */}
      {currentCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              Currently Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{currentCourse.title}</h3>
                  <p className="text-gray-600 text-sm">{currentCourse.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {currentCourse.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {currentCourse.instructor}
                    </span>
                  </div>
                </div>
                <Badge className={getStatusColor(currentCourse.progress?.status || 'not_started')}>
                  {getStatusText(currentCourse.progress?.status || 'not_started')}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{currentCourse.progress?.progress_percentage || 0}%</span>
                </div>
                <Progress value={currentCourse.progress?.progress_percentage || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              Completed Courses ({completedCourses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedCourses.map((course) => (
                <div key={course.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{course.title}</h4>
                    <p className="text-sm text-gray-600">{course.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.instructor}
                      </span>
                      {course.progress?.completed_at && (
                        <span>
                          Completed: {new Date(course.progress.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="bg-green-500">
                      Completed
                    </Badge>
                    <span className="text-sm font-medium text-green-600">100%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!currentCourse && completedCourses.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No course progress yet</h3>
              <p className="text-gray-600">This user hasn't started any courses.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserCourseProgress;
