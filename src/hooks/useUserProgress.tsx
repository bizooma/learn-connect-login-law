
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type CourseProgress = Tables<'user_course_progress'>;
type UnitProgress = Tables<'user_unit_progress'>;
type Course = Tables<'courses'>;

interface CourseWithProgress extends Course {
  progress?: CourseProgress;
}

export const useUserProgress = (userId?: string) => {
  const { toast } = useToast();
  const [courseProgress, setCourseProgress] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProgress = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Fetch all course progress for the user
      const { data: progressData, error: progressError } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          courses (*)
        `)
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false });

      if (progressError) throw progressError;

      // Transform the data to include course information
      const coursesWithProgress = progressData?.map(progress => ({
        ...progress.courses,
        progress: {
          id: progress.id,
          user_id: progress.user_id,
          course_id: progress.course_id,
          status: progress.status,
          progress_percentage: progress.progress_percentage,
          started_at: progress.started_at,
          completed_at: progress.completed_at,
          last_accessed_at: progress.last_accessed_at,
          created_at: progress.created_at,
          updated_at: progress.updated_at
        }
      })) || [];

      setCourseProgress(coursesWithProgress);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      toast({
        title: "Error",
        description: "Failed to load course progress",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCourseProgress = async (courseId: string, updates: Partial<CourseProgress>) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Refresh progress data
      await fetchUserProgress();
    } catch (error) {
      console.error('Error updating course progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  const markUnitComplete = async (unitId: string, courseId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_unit_progress')
        .upsert({
          user_id: userId,
          unit_id: unitId,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Calculate overall course progress
      await calculateCourseProgress(courseId);
    } catch (error) {
      console.error('Error marking unit complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark unit as complete",
        variant: "destructive",
      });
    }
  };

  const calculateCourseProgress = async (courseId: string) => {
    if (!userId) return;

    try {
      // Get total units in course by first getting sections
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('id')
        .eq('course_id', courseId);

      if (sectionsError) throw sectionsError;

      const sectionIds = sections?.map(s => s.id) || [];
      
      if (sectionIds.length === 0) return;

      // Get total units in these sections
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id')
        .in('section_id', sectionIds);

      if (unitsError) throw unitsError;

      // Get completed units for user
      const { data: completedUnits, error: completedError } = await supabase
        .from('user_unit_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true);

      if (completedError) throw completedError;

      const totalUnits = units?.length || 0;
      const completedCount = completedUnits?.length || 0;
      const progressPercentage = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

      // Update course progress
      const status = progressPercentage === 100 ? 'completed' : 
                   progressPercentage > 0 ? 'in_progress' : 'not_started';

      await updateCourseProgress(courseId, {
        progress_percentage: progressPercentage,
        status,
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        ...(status === 'in_progress' && progressPercentage === 1 && { started_at: new Date().toISOString() })
      });
    } catch (error) {
      console.error('Error calculating course progress:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserProgress();
    }
  }, [userId]);

  const completedCourses = courseProgress.filter(course => course.progress?.status === 'completed');
  const inProgressCourses = courseProgress.filter(course => course.progress?.status === 'in_progress');
  const currentCourse = inProgressCourses.length > 0 ? inProgressCourses[0] : null;

  return {
    courseProgress,
    completedCourses,
    inProgressCourses,
    currentCourse,
    loading,
    updateCourseProgress,
    markUnitComplete,
    fetchUserProgress
  };
};
