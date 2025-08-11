import { create } from 'zustand';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { progressCalculationService } from '@/services/progressCalculationService';
import { useCallback, useMemo } from 'react';

interface CourseProgressData {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CourseWithProgress {
  id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  duration: string | null;
  level: string | null;
  category: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  is_draft: boolean;
  rating: number | null;
  students_enrolled: number | null;
  tags: string[] | null;
  progress?: CourseProgressData;
}

interface UnitProgressData {
  unit_id: string;
  completed: boolean;
  completed_at: string | null;
  video_completed?: boolean;
  quiz_completed?: boolean;
}

interface VideoProgressData {
  unit_id: string;
  watch_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  watched_duration_seconds?: number;
  total_duration_seconds?: number | null;
}

interface ProgressStoreState {
  // Cache invalidation tracker
  lastInvalidation: number;
  invalidateCache: () => void;
}

const useProgressStoreState = create<ProgressStoreState>((set) => ({
  lastInvalidation: 0,
  invalidateCache: () => set({ lastInvalidation: Date.now() })
}));

// Optimized query keys
const progressKeys = {
  all: ['progress'] as const,
  user: (userId: string) => [...progressKeys.all, 'user', userId] as const,
  userCourses: (userId: string) => [...progressKeys.user(userId), 'courses'] as const,
  userCourse: (userId: string, courseId: string) => [...progressKeys.user(userId), 'course', courseId] as const,
  unitProgress: (userId: string, courseId: string) => [...progressKeys.user(userId), 'units', courseId] as const,
  videoProgress: (userId: string, courseId: string) => [...progressKeys.user(userId), 'video', courseId] as const,
};

// Centralized progress hook with React Query optimization
export const useProgressStore = (userId?: string) => {
  const queryClient = useQueryClient();
  const { lastInvalidation, invalidateCache } = useProgressStoreState();

  // Fetch user course progress with optimized caching
  const {
    data: courseProgress = [],
    isLoading: coursesLoading,
    error: coursesError
  } = useQuery({
    queryKey: progressKeys.userCourses(userId!),
    queryFn: async (): Promise<CourseWithProgress[]> => {
      if (!userId) return [];

      // First get assigned courses to ensure we only show assigned course progress
      const { data: assignments } = await supabase
        .from('course_assignments')
        .select('course_id')
        .eq('user_id', userId);

      if (!assignments || assignments.length === 0) {
        return [];
      }

      const assignedCourseIds = assignments.map(a => a.course_id);

      // Only fetch progress for assigned courses
      const { data, error } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          courses (*)
        `)
        .eq('user_id', userId)
        .in('course_id', assignedCourseIds)
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;

      return data?.map(progress => ({
        ...progress.courses,
        progress
      })).filter(Boolean) || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Batch progress calculation hook
  const calculateBatchProgressMutation = useMutation({
    mutationFn: async (courseIds: string[]) => {
      if (!userId) throw new Error('User ID required');
      return await progressCalculationService.calculateBatchProgress(userId, courseIds);
    },
    onSuccess: (results, courseIds) => {
      // Update cache with new progress data
      courseIds.forEach(courseId => {
        const result = results.get(courseId);
        if (result) {
          queryClient.setQueryData(
            progressKeys.userCourse(userId!, courseId),
            (oldData: any) => ({
              ...oldData,
              percentage: result.percentage,
              status: result.status
            })
          );
        }
      });
      
      // Invalidate course progress to trigger refetch
      queryClient.invalidateQueries({
        queryKey: progressKeys.userCourses(userId!)
      });
    }
  });

  // Single course progress calculation
  const calculateCourseProgressMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error('User ID required');
      return await progressCalculationService.calculateCourseProgress(userId, courseId);
    },
    onSuccess: (result, courseId) => {
      // Update specific course cache
      queryClient.setQueryData(
        progressKeys.userCourse(userId!, courseId),
        result
      );
      
      // Invalidate courses list
      queryClient.invalidateQueries({
        queryKey: progressKeys.userCourses(userId!)
      });
    }
  });

  // Unit progress update mutation
  const markUnitCompleteMutation = useMutation({
    mutationFn: async ({ unitId, courseId }: { unitId: string; courseId: string }) => {
      if (!userId) throw new Error('User ID required');
      
      // Mark unit complete using reliable RPC
      const { error } = await supabase.rpc(
        'mark_unit_complete_reliable' as any,
        {
          p_unit_id: unitId,
          p_course_id: courseId,
          p_completion_method: 'manual'
        }
      );


      if (error) throw error;

      // Recalculate course progress
      return await progressCalculationService.calculateCourseProgress(userId, courseId);
    },
    onSuccess: (result, { courseId }) => {
      // Update progress automatically
      queryClient.setQueryData(
        progressKeys.userCourse(userId!, courseId),
        result
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: progressKeys.unitProgress(userId!, courseId)
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.userCourses(userId!)
      });
    }
  });

  // Memoized computed values to prevent unnecessary recalculations
  const computedProgress = useMemo(() => {
    const completedCourses = courseProgress.filter(course => course.progress?.status === 'completed');
    const inProgressCourses = courseProgress.filter(course => course.progress?.status === 'in_progress');
    const currentCourse = inProgressCourses[0] || null;

    return {
      completedCourses,
      inProgressCourses,
      currentCourse,
      totalCourses: courseProgress.length,
      completionRate: courseProgress.length > 0 ? (completedCourses.length / courseProgress.length) * 100 : 0
    };
  }, [courseProgress]);

  // Optimized unit progress hook for specific course
  const useUnitProgress = useCallback((courseId: string) => {
    return useQuery({
      queryKey: progressKeys.unitProgress(userId!, courseId),
      queryFn: async (): Promise<Record<string, UnitProgressData>> => {
        if (!userId) return {};

        const { data, error } = await supabase
          .from('user_unit_progress')
          .select('unit_id, completed, completed_at, video_completed, quiz_completed')
          .eq('user_id', userId)
          .eq('course_id', courseId);

        if (error) throw error;

        return data?.reduce((acc, item) => {
          acc[item.unit_id] = item;
          return acc;
        }, {} as Record<string, UnitProgressData>) || {};
      },
      enabled: !!userId && !!courseId,
      staleTime: 30 * 1000, // 30 seconds
    });
  }, [userId]);

  // Optimized video progress hook
  const useVideoProgress = useCallback((courseId: string) => {
    return useQuery({
      queryKey: progressKeys.videoProgress(userId!, courseId),
      queryFn: async (): Promise<Record<string, VideoProgressData>> => {
        if (!userId) return {};

        const { data, error } = await supabase
          .from('user_video_progress')
          .select('unit_id, watch_percentage, is_completed, completed_at, watched_duration_seconds, total_duration_seconds')
          .eq('user_id', userId)
          .eq('course_id', courseId);

        if (error) throw error;

        return data?.reduce((acc, item) => {
          acc[item.unit_id] = item;
          return acc;
        }, {} as Record<string, VideoProgressData>) || {};
      },
      enabled: !!userId && !!courseId,
      staleTime: 10 * 1000, // 10 seconds for video progress
    });
  }, [userId]);

  // Cache invalidation function
  const invalidateProgress = useCallback((courseId?: string) => {
    if (courseId) {
      queryClient.invalidateQueries({
        queryKey: progressKeys.userCourse(userId!, courseId)
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.unitProgress(userId!, courseId)
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.videoProgress(userId!, courseId)
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: progressKeys.user(userId!)
      });
    }
    invalidateCache();
  }, [userId, queryClient, invalidateCache]);

  return {
    // Data
    courseProgress,
    ...computedProgress,
    
    // Loading states
    isLoading: coursesLoading,
    loading: coursesLoading, // Legacy compatibility
    error: coursesError,
    
    // Actions
    calculateBatchProgress: calculateBatchProgressMutation.mutate,
    calculateCourseProgress: calculateCourseProgressMutation.mutate,
    markUnitComplete: markUnitCompleteMutation.mutate,
    invalidateProgress,
    updateCourseProgress: async (courseId: string, status: string, progressPercentage: number) => {
      await progressCalculationService.updateBatchCourseProgress(userId!, [
        { courseId, percentage: progressPercentage, status }
      ]);
      invalidateProgress(courseId);
    },
    fetchUserProgress: () => invalidateProgress(),
    
    // Specialized hooks
    useUnitProgress,
    useVideoProgress,
    
    // Mutation states
    isCalculatingProgress: calculateCourseProgressMutation.isPending || calculateBatchProgressMutation.isPending,
    isUpdatingUnit: markUnitCompleteMutation.isPending,
  };
};

// Legacy compatibility wrapper hooks
export const useCourseProgress = (userId?: string) => {
  const store = useProgressStore(userId);
  
  return {
    courseProgress: store.courseProgress,
    loading: store.isLoading,
    fetchUserProgress: () => store.invalidateProgress(),
    updateCourseProgress: async (courseId: string, status: string, progressPercentage: number) => {
      // Use optimized batch update
      await progressCalculationService.updateBatchCourseProgress(userId!, [
        { courseId, percentage: progressPercentage, status }
      ]);
      store.invalidateProgress(courseId);
    },
    calculateCourseProgress: store.calculateCourseProgress
  };
};

export const useUnitProgressLegacy = (courseId: string, userId?: string) => {
  const store = useProgressStore(userId);
  const { data: unitProgress = {}, isLoading } = store.useUnitProgress(courseId);
  
  return {
    unitProgress,
    loading: isLoading,
    isUnitCompleted: (unitId: string) => unitProgress[unitId]?.completed || false,
    getUnitCompletedAt: (unitId: string) => unitProgress[unitId]?.completed_at || null,
    markUnitComplete: (unitId: string) => store.markUnitComplete({ unitId, courseId }),
    fetchUnitProgress: () => store.invalidateProgress(courseId)
  };
};

export const useVideoProgressLegacy = (courseId: string, unitId: string, userId?: string) => {
  const store = useProgressStore(userId);
  const { data: videoProgress = {}, isLoading } = store.useVideoProgress(courseId);
  const unitVideoProgress = videoProgress[unitId] || {
    unit_id: unitId,
    watch_percentage: 0,
    is_completed: false,
    completed_at: null,
    watched_duration_seconds: 0,
    total_duration_seconds: null
  };
  
  return {
    videoProgress: {
      ...unitVideoProgress,
      displayPercentage: unitVideoProgress.is_completed ? 100 : unitVideoProgress.watch_percentage
    },
    loading: isLoading,
    updateVideoProgress: async (watchedSeconds: number, totalSeconds: number, watchPercentage: number) => {
      // Optimized video progress update via reliable RPC
      const { error } = await supabase.rpc(
        'sync_video_completion_safe' as any,
        {
          p_unit_id: unitId,
          p_course_id: courseId,
          p_watch_percentage: Math.round(watchPercentage),
          p_total_duration_seconds: Math.round(totalSeconds),
          p_watched_duration_seconds: Math.round(watchedSeconds),
          p_force_complete: false
        }
      );
      
      if (!error) {
        store.invalidateProgress(courseId);
      }
    },
    markVideoComplete: () => store.markUnitComplete({ unitId, courseId }),
    fetchVideoProgress: () => store.invalidateProgress(courseId),
    syncVideoCompletionData: async () => store.invalidateProgress(courseId)
  };
};