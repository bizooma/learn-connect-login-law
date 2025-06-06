
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Trophy, Play, ArrowRight } from "lucide-react";
import { useUserProgress } from "@/hooks/useUserProgress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type CourseProgress = Tables<'user_course_progress'>;

interface CourseWithProgress extends Course {
  progress?: CourseProgress;
}

interface UserCourseProgressProps {
  userId: string;
  showOnlyAssigned?: boolean;
  showOnlyCompleted?: boolean;
}

const UserCourseProgress = ({ userId, showOnlyAssigned = false, showOnlyCompleted = false }: UserCourseProgressProps) => {
  const { courseProgress, completedCourses, inProgressCourses, currentCourse, loading } = useUserProgress(userId);
  const navigate = useNavigate();

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

  const handleCourseClick = (courseId: string) => {
    // Fix: Use singular 'course' not 'courses' to match the route in App.tsx
    navigate(`/course/${courseId}`);
  };

  // Filter courses based on props - Fixed the logic to match stats calculation
  let coursesToShow: CourseWithProgress[] = [];
  
  if (showOnlyCompleted) {
    coursesToShow = completedCourses;
  } else if (showOnlyAssigned) {
    // Show ALL courses that have progress (assigned courses), including not_started ones
    // This matches how the stats are calculated in useDashboardStats
    coursesToShow = courseProgress.filter(course => course.progress);
  } else {
    coursesToShow = courseProgress;
  }

  // Enhanced debugging to understand the data structure
  console.log('UserCourseProgress Enhanced Debug:', {
    userId,
    showOnlyAssigned,
    showOnlyCompleted,
    totalCourseProgress: courseProgress.length,
    coursesWithProgress: courseProgress.filter(course => course.progress).length,
    coursesToShow: coursesToShow.length,
    rawCourseProgress: courseProgress,
    courseProgressDetails: courseProgress.map(c => ({
      id: c.id,
      title: c.title,
      hasProgress: !!c.progress,
      progressId: c.progress?.id,
      status: c.progress?.status || 'none',
      progressPercentage: c.progress?.progress_percentage || 0
    })),
    filteredCoursesToShow: coursesToShow.map(c => ({
      id: c.id,
      title: c.title,
      status: c.progress?.status || 'none'
    }))
  });

  return (
    <div className="space-y-6">
      {/* Show courses based on filter */}
      {coursesToShow.length > 0 ? (
        <div className="space-y-4">
          {coursesToShow.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCourseClick(course.id)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <Badge className={getStatusColor(course.progress?.status || 'not_started')}>
                        {getStatusText(course.progress?.status || 'not_started')}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.instructor}
                      </span>
                      <span className="capitalize">
                        {course.level}
                      </span>
                    </div>
                    
                    {course.progress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{course.progress.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={course.progress.progress_percentage || 0} className="h-2" />
                        
                        {course.progress.last_accessed_at && (
                          <p className="text-xs text-gray-500">
                            Last accessed: {new Date(course.progress.last_accessed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {course.progress?.status === 'completed' ? (
                        <>
                          <Trophy className="h-4 w-4" />
                          View Certificate
                        </>
                      ) : course.progress?.status === 'in_progress' ? (
                        <>
                          <Play className="h-4 w-4" />
                          Continue
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4" />
                          Start Course
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showOnlyCompleted ? "No completed courses yet" : 
                 showOnlyAssigned ? "No assigned courses yet" : 
                 "No course progress yet"}
              </h3>
              <p className="text-gray-600">
                {showOnlyCompleted ? "Complete some courses to see them here." :
                 showOnlyAssigned ? "Courses will appear here when assigned." :
                 "This user hasn't started any courses."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserCourseProgress;
