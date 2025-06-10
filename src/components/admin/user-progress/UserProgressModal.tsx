
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserProgressCourseList from "./UserProgressCourseList";
import UserProgressUnitActions from "./UserProgressUnitActions";

interface UserProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

interface CourseProgressData {
  course_id: string;
  course_title: string;
  status: string;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string | null;
  completed_units: number;
  total_units: number;
  units: Array<{
    unit_id: string;
    unit_title: string;
    completed: boolean;
    completion_method: string | null;
    completed_at: string | null;
  }>;
}

interface UserProgressData {
  user_id: string;
  user_email: string;
  user_name: string;
  courses: CourseProgressData[];
}

const UserProgressModal = ({ isOpen, onClose, userId }: UserProgressModalProps) => {
  const [userProgress, setUserProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUserProgress = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      // Fetch user's course progress
      const { data: courseProgress, error: progressError } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          courses!inner(id, title)
        `)
        .eq('user_id', userId);

      if (progressError) {
        throw new Error(`Failed to fetch course progress: ${progressError.message}`);
      }

      // Fetch detailed unit progress for each course
      const coursesWithUnits = await Promise.all(
        (courseProgress || []).map(async (course) => {
          // Get lessons and units for this course
          const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select(`
              id,
              units!inner(
                id,
                title
              )
            `)
            .eq('course_id', course.course_id);

          if (lessonsError) {
            console.error('Error fetching lessons:', lessonsError);
            return {
              course_id: course.course_id,
              course_title: course.courses.title,
              status: course.status,
              progress_percentage: course.progress_percentage,
              started_at: course.started_at,
              completed_at: course.completed_at,
              last_accessed_at: course.last_accessed_at,
              completed_units: 0,
              total_units: 0,
              units: []
            };
          }

          // Flatten units from all lessons
          const allUnits = lessons?.flatMap(lesson => lesson.units) || [];

          // Get unit progress for each unit
          const unitsWithProgress = await Promise.all(
            allUnits.map(async (unit) => {
              const { data: unitProgress } = await supabase
                .from('user_unit_progress')
                .select('completed, completion_method, completed_at')
                .eq('user_id', userId)
                .eq('unit_id', unit.id)
                .eq('course_id', course.course_id)
                .single();

              return {
                unit_id: unit.id,
                unit_title: unit.title,
                completed: unitProgress?.completed || false,
                completion_method: unitProgress?.completion_method || null,
                completed_at: unitProgress?.completed_at || null
              };
            })
          );

          // Calculate completed and total units
          const completedUnits = unitsWithProgress.filter(unit => unit.completed).length;
          const totalUnits = unitsWithProgress.length;

          return {
            course_id: course.course_id,
            course_title: course.courses.title,
            status: course.status,
            progress_percentage: course.progress_percentage,
            started_at: course.started_at,
            completed_at: course.completed_at,
            last_accessed_at: course.last_accessed_at,
            completed_units: completedUnits,
            total_units: totalUnits,
            units: unitsWithProgress
          };
        })
      );

      setUserProgress({
        user_id: userId,
        user_email: profile.email,
        user_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
        courses: coursesWithUnits
      });

    } catch (error: any) {
      console.error('Error fetching user progress:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch user progress",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProgress();
    }
  }, [isOpen, userId]);

  const handleRefresh = () => {
    fetchUserProgress();
  };

  const selectedCourse = userProgress?.courses.find(c => c.course_id === selectedCourseId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            User Progress Details - {userProgress?.user_name || 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : userProgress ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Course Overview</TabsTrigger>
              <TabsTrigger value="units">Unit Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <UserProgressCourseList 
                courses={userProgress.courses}
                onRefresh={handleRefresh}
              />
            </TabsContent>
            
            <TabsContent value="units" className="space-y-4">
              {userProgress.courses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No courses assigned to this user
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {userProgress.courses.map((course) => (
                      <button
                        key={course.course_id}
                        onClick={() => setSelectedCourseId(course.course_id)}
                        className={`px-3 py-1 rounded text-sm border ${
                          selectedCourseId === course.course_id
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {course.course_title}
                      </button>
                    ))}
                  </div>

                  {selectedCourse ? (
                    <UserProgressUnitActions
                      userId={userProgress.user_id}
                      userName={userProgress.user_name}
                      courseId={selectedCourse.course_id}
                      courseTitle={selectedCourse.course_title}
                      units={selectedCourse.units}
                      onRefresh={handleRefresh}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select a course to manage unit completions
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No user progress data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProgressModal;
