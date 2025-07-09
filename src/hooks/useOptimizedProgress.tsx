import React, { useCallback, useMemo } from 'react';
import { useProgressContext } from '@/contexts/ProgressContext';
import { useAuth } from '@/hooks/useAuth';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';

interface OptimizedProgressConfig {
  autoFetch?: boolean;
  enableCaching?: boolean;
  cacheTimeout?: number;
}

interface CourseProgressSummary {
  course_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  completed_at?: string;
  last_accessed_at?: string;
}

export const useOptimizedProgress = (config: OptimizedProgressConfig = {}) => {
  const { user } = useAuth();
  const progressContext = useProgressContext();
  const {
    autoFetch = true,
    enableCaching = true,
    cacheTimeout = 5 * 60 * 1000 // 5 minutes
  } = config;

  // Fetch user's course progress with intelligent caching
  const fetchProgress = useCallback(async (force = false) => {
    if (!user?.id) return;

    const startTime = performance.now();
    
    try {
      await progressContext.fetchCourseProgress(user.id, force);
      
      const endTime = performance.now();
      optimizationTracker.trackOptimization(
        `OptimizedProgressHook_${user.id}`,
        'parallel_processing',
        endTime - startTime,
        endTime,
        1
      );
    } catch (error) {
      console.error('Error in optimized progress fetch:', error);
      throw error;
    }
  }, [user?.id, progressContext]);

  // Auto-fetch on mount if enabled
  React.useEffect(() => {
    if (autoFetch && user?.id) {
      fetchProgress();
    }
  }, [autoFetch, user?.id, fetchProgress]);

  // Get cached course progress
  const courseProgress = useMemo((): CourseProgressSummary[] => {
    if (!user?.id) return [];
    
    const cached = progressContext.getCourseProgress(user.id);
    return cached || [];
  }, [user?.id, progressContext]);

  // Computed values with memoization for performance
  const completedCourses = useMemo(() => 
    courseProgress.filter(course => course.status === 'completed'),
    [courseProgress]
  );

  const inProgressCourses = useMemo(() => 
    courseProgress.filter(course => course.status === 'in_progress'),
    [courseProgress]
  );

  const currentCourse = useMemo(() => 
    courseProgress.find(course => course.status === 'in_progress') || 
    courseProgress[courseProgress.length - 1],
    [courseProgress]
  );

  // Mark unit complete with optimistic updates
  const markUnitComplete = useCallback(async (unitId: string, courseId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const startTime = performance.now();

    try {
      await progressContext.updateUnitProgress(user.id, unitId, courseId, true);
      
      // Refresh course progress to update percentages
      await progressContext.fetchCourseProgress(user.id, true);

      const endTime = performance.now();
      optimizationTracker.trackOptimization(
        `OptimizedUnitComplete_${unitId}`,
        'database_batch',
        endTime - startTime,
        endTime,
        1
      );
    } catch (error) {
      console.error('Error marking unit complete:', error);
      throw error;
    }
  }, [user?.id, progressContext]);

  // Get specific course progress
  const getCourseProgress = useCallback((courseId: string) => {
    return courseProgress.find(course => course.course_id === courseId);
  }, [courseProgress]);

  // Refresh progress data
  const refreshProgress = useCallback(() => {
    return fetchProgress(true);
  }, [fetchProgress]);

  // Performance metrics
  const isLoading = user?.id ? progressContext.isLoading(`course-${user.id}`) : false;
  const error = user?.id ? progressContext.getError(`course-${user.id}`) : null;

  return {
    courseProgress,
    completedCourses,
    inProgressCourses,
    currentCourse,
    isLoading,
    error,
    markUnitComplete,
    getCourseProgress,
    refreshProgress,
    fetchProgress
  };
};

export const useOptimizedUnitProgress = (courseId: string, config: OptimizedProgressConfig = {}) => {
  const { user } = useAuth();
  const progressContext = useProgressContext();
  const { autoFetch = true } = config;

  // Fetch unit progress for specific course
  const fetchUnitProgress = useCallback(async (force = false) => {
    if (!user?.id || !courseId) return;

    try {
      await progressContext.fetchUnitProgress(user.id, courseId, force);
    } catch (error) {
      console.error('Error fetching unit progress:', error);
      throw error;
    }
  }, [user?.id, courseId, progressContext]);

  // Auto-fetch on mount
  React.useEffect(() => {
    if (autoFetch && user?.id && courseId) {
      fetchUnitProgress();
    }
  }, [autoFetch, user?.id, courseId, fetchUnitProgress]);

  // Get cached unit progress
  const unitProgress = useMemo(() => {
    if (!user?.id || !courseId) return [];
    
    return progressContext.getUnitProgress(user.id, courseId) || [];
  }, [user?.id, courseId, progressContext]);

  // Utility functions
  const isUnitCompleted = useCallback((unitId: string) => {
    return unitProgress.some(unit => unit.unit_id === unitId && unit.completed);
  }, [unitProgress]);

  const getUnitCompletedAt = useCallback((unitId: string) => {
    const unit = unitProgress.find(unit => unit.unit_id === unitId);
    return unit?.completed_at;
  }, [unitProgress]);

  const markUnitComplete = useCallback(async (unitId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      await progressContext.updateUnitProgress(user.id, unitId, courseId, true);
    } catch (error) {
      console.error('Error marking unit complete:', error);
      throw error;
    }
  }, [user?.id, courseId, progressContext]);

  const refreshUnitProgress = useCallback(() => {
    return fetchUnitProgress(true);
  }, [fetchUnitProgress]);

  const isLoading = user?.id ? progressContext.isLoading(`unit-${user.id}-${courseId}`) : false;
  const error = user?.id ? progressContext.getError(`unit-${user.id}-${courseId}`) : null;

  return {
    unitProgress,
    isLoading,
    error,
    isUnitCompleted,
    getUnitCompletedAt,
    markUnitComplete,
    refreshUnitProgress,
    fetchUnitProgress
  };
};

export const useOptimizedTeamProgress = (teamId: string, config: OptimizedProgressConfig = {}) => {
  const progressContext = useProgressContext();
  const { autoFetch = true } = config;

  // Fetch team progress
  const fetchTeamProgress = useCallback(async (force = false) => {
    if (!teamId) return;

    try {
      await progressContext.fetchTeamProgress(teamId, force);
    } catch (error) {
      console.error('Error fetching team progress:', error);
      throw error;
    }
  }, [teamId, progressContext]);

  // Auto-fetch on mount
  React.useEffect(() => {
    if (autoFetch && teamId) {
      fetchTeamProgress();
    }
  }, [autoFetch, teamId, fetchTeamProgress]);

  // Get cached team progress
  const teamProgress = useMemo(() => {
    return progressContext.getTeamProgress(teamId);
  }, [teamId, progressContext]);

  const refreshTeamProgress = useCallback(() => {
    return fetchTeamProgress(true);
  }, [fetchTeamProgress]);

  const isLoading = progressContext.isLoading(`team-${teamId}`);
  const error = progressContext.getError(`team-${teamId}`);

  return {
    teamProgress,
    isLoading,
    error,
    refreshTeamProgress,
    fetchTeamProgress
  };
};