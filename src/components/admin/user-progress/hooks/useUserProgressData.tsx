
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export const useUserProgressData = () => {
  const [userProgress, setUserProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUserProgress = async (userId: string) => {
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

  const handleDeleteAssignment = async (userId: string, courseId: string) => {
    if (!userId) return;

    try {
      // Delete the course assignment
      const { error: assignmentError } = await supabase
        .from('course_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (assignmentError) throw assignmentError;

      // Delete the user course progress
      const { error: progressError } = await supabase
        .from('user_course_progress')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (progressError) throw progressError;

      // Delete any unit progress for this course
      const { error: unitProgressError } = await supabase
        .from('user_unit_progress')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (unitProgressError) throw unitProgressError;

      toast({
        title: "Success",
        description: "Course assignment deleted successfully",
      });

      // Refresh the data
      await fetchUserProgress(userId);
    } catch (error) {
      console.error('Error deleting course assignment:', error);
      toast({
        title: "Error",
        description: "Failed to delete course assignment",
        variant: "destructive",
      });
    }
  };

  return {
    userProgress,
    loading,
    fetchUserProgress,
    handleDeleteAssignment
  };
};
