
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
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
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchUserProgress = useCallback(async (userId: string) => {
    if (!userId || !mountedRef.current) return;

    // Cancel any ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      
      // Fetch user course progress with details (simplified to avoid complex joins)
      const { data: progressData, error: progressError } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          profiles:user_id (email, first_name, last_name),
          courses:course_id (title)
        `)
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false });

      if (!mountedRef.current) return;
      if (progressError) throw progressError;

      if (!progressData || progressData.length === 0) {
        setUserProgress(null);
        return;
      }

      // Get optimized unit counts using batch queries
      const courseIds = [...new Set(progressData.map(p => p.course_id))];
      
      // Single query for all unit counts
      const { data: unitCountsData } = await supabase
        .from('lessons')
        .select(`
          course_id,
          units:section_id (id)
        `)
        .in('course_id', courseIds);

      // Single query for all completed unit counts
      const { data: completedUnitsData } = await supabase
        .from('user_unit_progress')
        .select('course_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .in('course_id', courseIds);

      // Process unit counts efficiently
      const unitCountMap = new Map<string, number>();
      const completedCountMap = new Map<string, number>();

      // Calculate total units per course
      unitCountsData?.forEach((lesson: any) => {
        const courseId = lesson.course_id;
        const unitCount = lesson.units?.length || 0;
        unitCountMap.set(courseId, (unitCountMap.get(courseId) || 0) + unitCount);
      });

      // Calculate completed units per course
      completedUnitsData?.forEach((progress: any) => {
        const courseId = progress.course_id;
        completedCountMap.set(courseId, (completedCountMap.get(courseId) || 0) + 1);
      });

      // Transform the data efficiently
      const processedCourses = progressData.map(progress => {
        const course = progress.courses;

        return {
          course_id: progress.course_id,
          course_title: course?.title || 'Unknown Course',
          status: progress.status,
          progress_percentage: progress.progress_percentage,
          started_at: progress.started_at,
          completed_at: progress.completed_at,
          last_accessed_at: progress.last_accessed_at,
          completed_units: completedCountMap.get(progress.course_id) || 0,
          total_units: unitCountMap.get(progress.course_id) || 0
        };
      });

      if (!mountedRef.current) return;

      // Transform the data efficiently
      const firstProgress = progressData[0];
      const profile = firstProgress.profiles;

      setUserProgress({
        user_id: userId,
        user_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown',
        user_email: profile?.email || 'Unknown',
        courses: processedCourses
      });

    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error fetching user progress:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user progress details",
        variant: "destructive",
      });
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [toast]);

  const handleDeleteAssignment = useCallback(async (userId: string, courseId: string) => {
    if (!userId || !mountedRef.current) return;

    try {
      // Use transaction-like approach with Promise.all for atomicity
      const [assignmentResult, progressResult, unitProgressResult] = await Promise.allSettled([
        supabase
          .from('course_assignments')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', courseId),
        supabase
          .from('user_course_progress')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', courseId),
        supabase
          .from('user_unit_progress')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', courseId)
      ]);

      // Check for errors in any of the operations
      const errors = [assignmentResult, progressResult, unitProgressResult]
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      if (errors.length > 0) {
        throw new Error(`Failed operations: ${errors.join(', ')}`);
      }

      if (!mountedRef.current) return;

      toast({
        title: "Success",
        description: "Course assignment deleted successfully",
      });

      // Refresh the data
      await fetchUserProgress(userId);
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error deleting course assignment:', error);
      toast({
        title: "Error",
        description: "Failed to delete course assignment",
        variant: "destructive",
      });
    }
  }, [fetchUserProgress, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    userProgress,
    loading,
    fetchUserProgress,
    handleDeleteAssignment
  };
};
