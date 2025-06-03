
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, TrendingUp } from "lucide-react";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useAuth } from "@/hooks/useAuth";
import UserCourseProgress from "@/components/user/UserCourseProgress";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import LMSTreeFooter from "@/components/lms-tree/LMSTreeFooter";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { completedCourses, currentCourse, loading } = useUserProgress(user?.id || '');
  
  // Calculate progress statistics
  const completedCoursesCount = completedCourses.length;
  const totalCourses = completedCourses.length + (currentCourse ? 1 : 0);
  const totalProgressPercentage = totalCourses > 0 
    ? Math.round(((completedCoursesCount * 100) + (currentCourse?.progress?.progress_percentage || 0)) / totalCourses)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      <div className="flex-1 space-y-6 p-6">
        <NotificationBanner />
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Track your learning progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCoursesCount}</div>
              <p className="text-xs text-muted-foreground">
                Keep learning to unlock more achievements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProgressPercentage}%</div>
              <p className="text-xs text-muted-foreground">
                Across all assigned courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Course</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {currentCourse?.title || 'No active course'}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentCourse?.progress?.progress_percentage || 0}% completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <UserCourseProgress userId={user?.id || ''} />
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

export default StudentDashboard;
