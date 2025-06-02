
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, BookOpen, CheckCircle, Clock, Calendar } from "lucide-react";

interface UserProgressData {
  user_id: string;
  user_name: string;
  user_email: string;
  courses: Array<{
    course_id: string;
    course_title: string;
    status: string;
    progress_percentage: number;
    started_at: string | null;
    completed_at: string | null;
    last_accessed_at: string | null;
    completed_units: number;
    total_units: number;
  }>;
}

interface UserProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const UserProgressModal = ({ isOpen, onClose, userId }: UserProgressModalProps) => {
  const [userProgress, setUserProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProgress();
    }
  }, [isOpen, userId]);

  const fetchUserProgress = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Fetch user course progress with details
      const { data: progressData, error: progressError } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          profiles:user_id (email, first_name, last_name),
          courses:course_id (title)
        `)
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false });

      if (progressError) throw progressError;

      if (!progressData || progressData.length === 0) {
        setUserProgress(null);
        return;
      }

      // Get unit counts for each course
      const courseIds = [...new Set(progressData.map(p => p.course_id))];
      const unitCounts = await Promise.all(
        courseIds.map(async (courseId) => {
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', courseId);

          if (!lessons || lessons.length === 0) return { courseId, totalUnits: 0 };

          const { count } = await supabase
            .from('units')
            .select('*', { count: 'exact', head: true })
            .in('section_id', lessons.map(l => l.id));

          return { courseId, totalUnits: count || 0 };
        })
      );

      // Get completed unit counts
      const completedUnitCounts = await Promise.all(
        progressData.map(async (progress) => {
          const { count } = await supabase
            .from('user_unit_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', progress.user_id)
            .eq('course_id', progress.course_id)
            .eq('completed', true);

          return { 
            courseId: progress.course_id, 
            completedUnits: count || 0 
          };
        })
      );

      // Transform the data
      const firstProgress = progressData[0];
      const profile = firstProgress.profiles;
      
      const courses = progressData.map(progress => {
        const course = progress.courses;
        const unitCount = unitCounts.find(uc => uc.courseId === progress.course_id);
        const completedCount = completedUnitCounts.find(cc => cc.courseId === progress.course_id);

        return {
          course_id: progress.course_id,
          course_title: course?.title || 'Unknown Course',
          status: progress.status,
          progress_percentage: progress.progress_percentage,
          started_at: progress.started_at,
          completed_at: progress.completed_at,
          last_accessed_at: progress.last_accessed_at,
          completed_units: completedCount?.completedUnits || 0,
          total_units: unitCount?.totalUnits || 0
        };
      });

      setUserProgress({
        user_id: userId,
        user_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown',
        user_email: profile?.email || 'Unknown',
        courses
      });

    } catch (error) {
      console.error('Error fetching user progress:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user progress details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'not_started':
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!userProgress && !loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Progress Details</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">
            No progress data found for this user.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const completedCourses = userProgress?.courses.filter(c => c.status === 'completed').length || 0;
  const inProgressCourses = userProgress?.courses.filter(c => c.status === 'in_progress').length || 0;
  const totalCourses = userProgress?.courses.length || 0;
  const averageProgress = totalCourses > 0 
    ? Math.round((userProgress?.courses.reduce((sum, c) => sum + c.progress_percentage, 0) || 0) / totalCourses)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Progress Dashboard
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : userProgress && (
          <div className="space-y-6">
            {/* User Info Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{userProgress.user_name}</h3>
                    <p className="text-gray-600">{userProgress.user_email}</p>
                  </div>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCourses}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedCourses}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inProgressCourses}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageProgress}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Course Details */}
            <Card>
              <CardHeader>
                <CardTitle>Course Progress Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProgress.courses.map((course, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{course.course_title}</h4>
                        {getStatusBadge(course.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="text-sm">
                          <span className="text-gray-600">Progress: </span>
                          <span className="font-medium">{course.progress_percentage}%</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Units: </span>
                          <span className="font-medium">{course.completed_units}/{course.total_units}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Last Accessed: </span>
                          <span className="font-medium">
                            {course.last_accessed_at 
                              ? new Date(course.last_accessed_at).toLocaleDateString()
                              : 'Never'
                            }
                          </span>
                        </div>
                      </div>

                      <Progress value={course.progress_percentage} className="w-full" />

                      {course.completed_at && (
                        <div className="text-sm text-green-600 mt-2">
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Completed on {new Date(course.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProgressModal;
