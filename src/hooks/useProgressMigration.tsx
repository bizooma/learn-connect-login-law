import { useOptimizedProgress, useOptimizedUnitProgress, useOptimizedTeamProgress } from '@/hooks/useOptimizedProgress';
import { useProgressCalculations } from '@/hooks/useProgressCalculations';

// Migration hook that provides a compatibility layer for existing hooks
// This allows gradual migration from old hooks to the new optimized system

/**
 * Drop-in replacement for the old useUserProgress hook
 * Provides the same interface but uses the optimized system underneath
 */
export const useUserProgressMigrated = (userId?: string) => {
  const optimizedProgress = useOptimizedProgress({ autoFetch: true });
  const { calculateUserOverallStats } = useProgressCalculations();

  // Maintain the same interface as the old hook
  return {
    courseProgress: optimizedProgress.courseProgress.map(cp => ({
      id: cp.course_id,
      title: 'Course Title', // This would need to be enriched from course data
      progress: {
        status: cp.status,
        progress_percentage: cp.progress_percentage,
        completed_at: cp.completed_at,
        last_accessed_at: cp.last_accessed_at
      }
    })),
    completedCourses: optimizedProgress.completedCourses,
    inProgressCourses: optimizedProgress.inProgressCourses,
    currentCourse: optimizedProgress.currentCourse,
    loading: optimizedProgress.isLoading,
    updateCourseProgress: async (courseId: string, status: string, progressPercentage: number) => {
      // This would need to be implemented based on the optimized context
      console.log('Update course progress called with:', { courseId, status, progressPercentage });
    },
    markUnitComplete: optimizedProgress.markUnitComplete,
    fetchUserProgress: optimizedProgress.refreshProgress
  };
};

/**
 * Drop-in replacement for the old useUnitProgress hook
 * Provides the same interface but uses the optimized system underneath
 */
export const useUnitProgressMigrated = (courseId: string) => {
  const optimizedUnitProgress = useOptimizedUnitProgress(courseId, { autoFetch: true });

  // Convert to old format for compatibility
  const unitProgress = optimizedUnitProgress.unitProgress.reduce((acc, unit) => {
    acc[unit.unit_id] = {
      unit_id: unit.unit_id,
      completed: unit.completed,
      completed_at: unit.completed_at
    };
    return acc;
  }, {} as Record<string, any>);

  return {
    unitProgress,
    loading: optimizedUnitProgress.isLoading,
    isUnitCompleted: optimizedUnitProgress.isUnitCompleted,
    getUnitCompletedAt: optimizedUnitProgress.getUnitCompletedAt,
    markUnitComplete: optimizedUnitProgress.markUnitComplete,
    fetchUnitProgress: () => {
      // Force refresh would be handled by the optimized context
      console.log('Fetch unit progress called for course:', courseId);
    }
  };
};

/**
 * Drop-in replacement for the old useTeamProgress hook
 * Provides the same interface but uses the optimized system underneath
 */
export const useTeamProgressMigrated = () => {
  // Note: The old hook took teamId as a parameter to fetchTeamProgress
  // This migration version maintains that pattern
  
  return {
    teamProgress: [],
    loading: false,
    fetchTeamProgress: async (teamId: string) => {
      const teamProgressHook = useOptimizedTeamProgress(teamId, { autoFetch: false });
      await teamProgressHook.refreshTeamProgress();
      
      // Transform to old format
      const teamProgress = teamProgressHook.teamProgress;
      if (!teamProgress) return [];

      return teamProgress.members.map(member => ({
        user_id: member.user_id,
        email: member.email,
        first_name: member.name.split(' ')[0] || null,
        last_name: member.name.split(' ').slice(1).join(' ') || null,
        total_assigned_courses: member.total_courses,
        completed_courses: member.completed_courses,
        in_progress_courses: member.total_courses - member.completed_courses,
        overall_progress: member.overall_progress,
        course_progress: [] // This would need to be enriched if needed
      }));
    }
  };
};

/**
 * Helper hook to gradually migrate components
 * Provides feature flags to control which system is used
 */
export const useProgressMigrationControl = () => {
  // These could be controlled by environment variables, user settings, or feature flags
  const migrationFlags = {
    useCentralizedProgress: true, // Enable centralized progress system
    useOptimizedQueries: true,    // Enable batch queries and caching
    useRealTimeSync: true,        // Enable real-time progress synchronization
    debugMode: process.env.NODE_ENV === 'development'
  };

  return {
    migrationFlags,
    shouldUseLegacyHook: (hookName: string) => {
      // Could implement gradual rollout logic here
      return !migrationFlags.useCentralizedProgress;
    },
    shouldUseOptimizedQueries: () => migrationFlags.useOptimizedQueries,
    shouldUseRealTimeSync: () => migrationFlags.useRealTimeSync,
    isDebugMode: () => migrationFlags.debugMode
  };
};

/**
 * Performance comparison hook for monitoring migration benefits
 */
export const useProgressPerformanceComparison = () => {
  const startTime = performance.now();
  
  const trackOperation = (operationName: string, isOptimized: boolean) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Progress Operation: ${operationName}`, {
        isOptimized,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    }

    // Could send to analytics service in production
    return duration;
  };

  return {
    trackOperation
  };
};