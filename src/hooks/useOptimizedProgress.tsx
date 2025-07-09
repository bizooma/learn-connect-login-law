import { useCallback, useEffect, useMemo } from 'react';
import { useProgressContext } from '@/contexts/ProgressContext';
import { useAuth } from '@/hooks/useAuth';

interface UseProgressOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

// Unified progress hook that replaces multiple existing hooks
export const useOptimizedProgress = (options: UseProgressOptions = {}) => {
  const { user } = useAuth();
  const progressContext = useProgressContext();
  const { autoFetch = true, refreshInterval } = options;

  // Auto-fetch user's course progress on mount
  useEffect(() => {
    if (autoFetch && user?.id) {
      progressContext.fetchCourseProgress(user.id);
    }
  }, [autoFetch, user?.id, progressContext]);

  // Optional refresh interval
  useEffect(() => {
    if (refreshInterval && user?.id) {
      const interval = setInterval(() => {
        progressContext.fetchCourseProgress(user.id, true);
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval, user?.id, progressContext]);

  // Course progress selectors
  const courseProgress = useMemo(() => {
    return user?.id ? progressContext.getCourseProgress(user.id) || [] : [];
  }, [user?.id, progressContext]);

  const completedCourses = useMemo(() => {
    return courseProgress.filter(c => c.status === 'completed');
  }, [courseProgress]);

  const inProgressCourses = useMemo(() => {
    return courseProgress.filter(c => c.status === 'in_progress');
  }, [courseProgress]);

  const notStartedCourses = useMemo(() => {
    return courseProgress.filter(c => c.status === 'not_started');
  }, [courseProgress]);

  const currentCourse = useMemo(() => {
    return inProgressCourses[0] || null;
  }, [inProgressCourses]);

  // Loading and error states
  const isLoading = useMemo(() => {
    return user?.id ? progressContext.isLoading(`course-${user.id}`) : false;
  }, [user?.id, progressContext]);

  const error = useMemo(() => {
    return user?.id ? progressContext.getError(`course-${user.id}`) : null;
  }, [user?.id, progressContext]);

  // Actions
  const refreshProgress = useCallback(() => {
    if (user?.id) {
      progressContext.fetchCourseProgress(user.id, true);
    }
  }, [user?.id, progressContext]);

  const markUnitComplete = useCallback(async (unitId: string, courseId: string) => {
    if (!user?.id) return;
    
    await progressContext.updateUnitProgress(user.id, unitId, courseId, true);
    
    // Trigger course progress recalculation
    await progressContext.calculateCourseProgress(user.id, courseId);
  }, [user?.id, progressContext]);

  return {
    // Data
    courseProgress,
    completedCourses,
    inProgressCourses,
    notStartedCourses,
    currentCourse,
    
    // State
    isLoading,
    error,
    
    // Actions
    refreshProgress,
    markUnitComplete
  };
};

// Specialized hook for unit progress
export const useOptimizedUnitProgress = (courseId: string, options: UseProgressOptions = {}) => {
  const { user } = useAuth();
  const progressContext = useProgressContext();
  const { autoFetch = true } = options;

  // Auto-fetch unit progress
  useEffect(() => {
    if (autoFetch && user?.id && courseId) {
      progressContext.fetchUnitProgress(user.id, courseId);
    }
  }, [autoFetch, user?.id, courseId, progressContext]);

  // Unit progress data
  const unitProgress = useMemo(() => {
    if (!user?.id || !courseId) return [];
    return progressContext.getUnitProgress(user.id, courseId) || [];
  }, [user?.id, courseId, progressContext]);

  // Helper functions
  const isUnitCompleted = useCallback((unitId: string) => {
    return unitProgress.find(u => u.unit_id === unitId)?.completed || false;
  }, [unitProgress]);

  const getUnitCompletedAt = useCallback((unitId: string) => {
    return unitProgress.find(u => u.unit_id === unitId)?.completed_at || null;
  }, [unitProgress]);

  const markUnitComplete = useCallback(async (unitId: string) => {
    if (!user?.id || !courseId) return;
    await progressContext.updateUnitProgress(user.id, unitId, courseId, true);
  }, [user?.id, courseId, progressContext]);

  const isLoading = useMemo(() => {
    if (!user?.id || !courseId) return false;
    return progressContext.isLoading(`unit-${user.id}-${courseId}`);
  }, [user?.id, courseId, progressContext]);

  return {
    unitProgress,
    isUnitCompleted,
    getUnitCompletedAt,
    markUnitComplete,
    isLoading
  };
};

// Specialized hook for team progress
export const useOptimizedTeamProgress = (teamId?: string, options: UseProgressOptions = {}) => {
  const progressContext = useProgressContext();
  const { autoFetch = true } = options;

  // Auto-fetch team progress
  useEffect(() => {
    if (autoFetch && teamId) {
      progressContext.fetchTeamProgress(teamId);
    }
  }, [autoFetch, teamId, progressContext]);

  // Team progress data
  const teamProgress = useMemo(() => {
    return teamId ? progressContext.getTeamProgress(teamId) : null;
  }, [teamId, progressContext]);

  // Team statistics
  const teamStats = useMemo(() => {
    if (!teamProgress) return null;

    const totalMembers = teamProgress.members.length;
    const totalCourses = teamProgress.members.reduce((sum, m) => sum + m.total_courses, 0);
    const totalCompletedCourses = teamProgress.members.reduce((sum, m) => sum + m.completed_courses, 0);
    const averageProgress = totalMembers > 0 
      ? Math.round(teamProgress.members.reduce((sum, m) => sum + m.overall_progress, 0) / totalMembers)
      : 0;

    return {
      totalMembers,
      totalCourses,
      totalCompletedCourses,
      averageProgress,
      completionRate: totalCourses > 0 ? Math.round((totalCompletedCourses / totalCourses) * 100) : 0
    };
  }, [teamProgress]);

  const isLoading = useMemo(() => {
    return teamId ? progressContext.isLoading(`team-${teamId}`) : false;
  }, [teamId, progressContext]);

  const refreshTeamProgress = useCallback(() => {
    if (teamId) {
      progressContext.fetchTeamProgress(teamId, true);
    }
  }, [teamId, progressContext]);

  return {
    teamProgress,
    teamStats,
    isLoading,
    refreshTeamProgress
  };
};

// Hook for batch operations
export const useBatchProgressOperations = () => {
  const progressContext = useProgressContext();

  const batchFetchCourseProgress = useCallback(async (userIds: string[]) => {
    await progressContext.batchFetchCourseProgress(userIds);
  }, [progressContext]);

  const batchCalculateProgress = useCallback(async (requests: Array<{ userId: string; courseId: string }>) => {
    await progressContext.batchCalculateProgress(requests);
  }, [progressContext]);

  return {
    batchFetchCourseProgress,
    batchCalculateProgress
  };
};