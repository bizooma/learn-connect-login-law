
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User, BookOpen, Award, Clock, Calendar, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<'profiles'>;

interface EmployeeProgressData {
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

interface EmployeeProgressModalProps {
  employee: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeProgressModal = ({ employee, isOpen, onClose }: EmployeeProgressModalProps) => {
  const [progressData, setProgressData] = useState<EmployeeProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEmployeeProgress = async () => {
    if (!employee) return;

    try {
      setLoading(true);
      
      // Fetch employee course progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          courses:course_id (title)
        `)
        .eq('user_id', employee.id)
        .order('last_accessed_at', { ascending: false });

      if (progressError) throw progressError;

      if (!progressData || progressData.length === 0) {
        setProgressData({
          user_id: employee.id,
          user_name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown',
          user_email: employee.email,
          courses: []
        });
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

      setProgressData({
        user_id: employee.id,
        user_name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown',
        user_email: employee.email,
        courses
      });

    } catch (error) {
      console.error('Error fetching employee progress:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employee progress details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && employee) {
      fetchEmployeeProgress();
    }
  }, [isOpen, employee]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'not_started':
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!progressData && !loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Progress</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">
            No progress data found for this employee.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const completedCourses = progressData?.courses.filter(c => c.status === 'completed').length || 0;
  const inProgressCourses = progressData?.courses.filter(c => c.status === 'in_progress').length || 0;
  const totalCourses = progressData?.courses.length || 0;
  const averageProgress = totalCourses > 0 
    ? Math.round((progressData?.courses.reduce((sum, c) => sum + c.progress_percentage, 0) || 0) / totalCourses)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Progress Dashboard
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : progressData && (
          <div className="space-y-6">
            {/* Employee Header */}
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-lg font-semibold">{progressData.user_name}</h3>
                  <p className="text-gray-600">{progressData.user_email}</p>
                </div>
              </CardHeader>
            </Card>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{totalCourses}</div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{completedCourses}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{inProgressCourses}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{averageProgress}%</div>
                  <div className="text-sm text-gray-600">Avg Progress</div>
                </CardContent>
              </Card>
            </div>

            {/* Course List */}
            <Card>
              <CardHeader>
                <CardTitle>Course Progress Details</CardTitle>
              </CardHeader>
              <CardContent>
                {progressData.courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No course assignments found for this employee.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {progressData.courses.map((course) => (
                      <div key={course.course_id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{course.course_title}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {course.completed_units}/{course.total_units} units
                              </span>
                              {course.last_accessed_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Last accessed: {formatDate(course.last_accessed_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(course.status)}
                            <div className="text-sm font-medium mt-1">
                              {course.progress_percentage}%
                            </div>
                          </div>
                        </div>
                        
                        <Progress value={course.progress_percentage} className="mb-3" />
                        
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Started:</span> {formatDate(course.started_at)}
                          </div>
                          <div>
                            <span className="font-medium">Completed:</span> {formatDate(course.completed_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeProgressModal;
