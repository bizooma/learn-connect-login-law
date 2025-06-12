
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

// Helper function to get display title for courses
const getCourseDisplayTitle = (title: string | null | undefined): string => {
  if (!title || title.trim() === '') {
    return 'Untitled Course';
  }
  return title;
};

const UserProgressModal = ({ isOpen, onClose, userId }: UserProgressModalProps) => {
  const [userProgress, setUserProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const fetchUserProgress = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      console.log('🔄 Fetching user progress for user:', userId);

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      console.log('👤 Profile data:', profile);

      // First, get course assignments for this user
      const { data: courseAssignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select('course_id')
        .eq('user_id', userId);

      if (assignmentsError) {
        console.error('❌ Course assignments fetch error:', assignmentsError);
        throw new Error(`Failed to fetch course assignments: ${assignmentsError.message}`);
      }

      console.log('📋 Course assignments:', courseAssignments);

      if (!courseAssignments || courseAssignments.length === 0) {
        console.log('⚠️ No course assignments found for user');
        setUserProgress({
          user_id: userId,
          user_email: profile.email,
          user_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          courses: []
        });
        return;
      }

      const assignedCourseIds = courseAssignments.map(a => a.course_id);
      console.log('📚 Assigned course IDs:', assignedCourseIds);

      // Fetch course progress with left join to courses table to handle missing course data
      const { data: courseProgress, error: progressError } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          courses (id, title)
        `)
        .eq('user_id', userId)
        .in('course_id', assignedCourseIds);

      if (progressError) {
        console.error('❌ Course progress fetch error:', progressError);
        throw new Error(`Failed to fetch course progress: ${progressError.message}`);
      }

      console.log('📊 Raw course progress data from DB:', courseProgress);

      // For courses that have assignments but no progress records, create entries
      const existingCourseIds = courseProgress?.map(p => p.course_id) || [];
      const missingCourseIds = assignedCourseIds.filter(id => !existingCourseIds.includes(id));

      console.log('📝 Missing course progress for:', missingCourseIds);

      if (missingCourseIds.length > 0) {
        // Get course details for missing courses
        const { data: missingCourses, error: coursesError } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', missingCourseIds);

        if (coursesError) {
          console.error('❌ Missing courses fetch error:', coursesError);
        } else {
          console.log('📚 Missing courses details:', missingCourses);
          
          // Add missing courses to progress data with default values
          const missingProgressEntries = missingCourses?.map(course => ({
            user_id: userId,
            course_id: course.id,
            status: 'not_started',
            progress_percentage: 0,
            started_at: null,
            completed_at: null,
            last_accessed_at: null,
            courses: { id: course.id, title: course.title }
          })) || [];

          courseProgress?.push(...missingProgressEntries);
        }
      }

      // Fetch detailed unit progress for each course
      const coursesWithUnits = await Promise.all(
        (courseProgress || []).map(async (course) => {
          const courseTitle = getCourseDisplayTitle(course.courses?.title);
          console.log(`📚 Processing course: ${courseTitle} (${course.course_id})`);
          
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
            console.error('❌ Lessons fetch error for course:', course.course_id, lessonsError);
            return {
              course_id: course.course_id,
              course_title: courseTitle,
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
          console.log(`📝 Found ${allUnits.length} units in course ${courseTitle}`);

          // Get unit progress for each unit
          const unitsWithProgress = await Promise.all(
            allUnits.map(async (unit) => {
              const { data: unitProgress, error: unitError } = await supabase
                .from('user_unit_progress')
                .select('completed, completion_method, completed_at')
                .eq('user_id', userId)
                .eq('unit_id', unit.id)
                .eq('course_id', course.course_id)
                .maybeSingle();

              if (unitError) {
                console.error('❌ Unit progress fetch error:', unitError);
              }

              const isCompleted = unitProgress?.completed || false;
              if (isCompleted) {
                console.log(`✅ Unit "${unit.title}" is completed via ${unitProgress?.completion_method}`);
              }

              return {
                unit_id: unit.id,
                unit_title: unit.title || 'Untitled Unit',
                completed: isCompleted,
                completion_method: unitProgress?.completion_method || null,
                completed_at: unitProgress?.completed_at || null
              };
            })
          );

          // Calculate completed and total units
          const completedUnits = unitsWithProgress.filter(unit => unit.completed).length;
          const totalUnits = unitsWithProgress.length;
          
          console.log(`📈 Course progress summary for ${courseTitle}:`, {
            completedUnits,
            totalUnits,
            dbProgressPercentage: course.progress_percentage,
            calculatedPercentage: totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0
          });

          return {
            course_id: course.course_id,
            course_title: courseTitle,
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

      console.log('✅ User progress data set:', coursesWithUnits);

    } catch (error: any) {
      console.error('❌ Error fetching user progress:', error);
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
      console.log('🔄 UserProgressModal opened, triggering fetch...');
      fetchUserProgress();
    }
  }, [isOpen, userId, refreshKey]);

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered in UserProgressModal...');
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteCourse = async (courseId: string) => {
    // Implementation for delete course functionality
    console.log('Delete course:', courseId);
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
                onDeleteCourse={handleDeleteCourse}
                onRefresh={handleRefresh}
                userId={userProgress.user_id}
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
                        {course.course_title} ({course.progress_percentage}%)
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
