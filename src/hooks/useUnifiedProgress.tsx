import { useOptimizedProgress } from './useOptimizedProgress';
import { useProgressCalculations } from './useProgressCalculations';
import { useAuth } from './useAuth';
import { useMemo, useCallback } from 'react';

/**
 * Unified progress hook that consolidates all progress-related functionality
 * This is the primary hook that should be used instead of the legacy hooks
 */
export const useUnifiedProgress = () => {
  const { user } = useAuth();
  const optimizedProgress = useOptimizedProgress({ autoFetch: true });
  const progressCalculations = useProgressCalculations();

  // Legacy compatibility layer - provides the same interface as old useUserProgress
  const legacyInterface = useMemo(() => ({
    // Course progress data
    courseProgress: optimizedProgress.courseProgress.map(course => ({
      id: course.course_id,
      course_id: course.course_id,
      status: course.status,
      progress_percentage: course.progress_percentage,
      completed_at: course.completed_at,
      last_accessed_at: course.last_accessed_at,
      // Additional computed properties for enhanced functionality
      progress: {
        status: course.status,
        progress_percentage: course.progress_percentage,
        completed_at: course.completed_at,
        last_accessed_at: course.last_accessed_at
      }
    })),

    // Computed collections
    completedCourses: optimizedProgress.completedCourses,
    inProgressCourses: optimizedProgress.inProgressCourses,
    currentCourse: optimizedProgress.currentCourse,

    // Loading and error states
    loading: optimizedProgress.isLoading,
    error: optimizedProgress.error,

    // Actions
    updateCourseProgress: async (courseId: string, status: string, progressPercentage: number) => {
      // This functionality would be implemented through the progress context
      console.log('Legacy updateCourseProgress called:', { courseId, status, progressPercentage });
      await optimizedProgress.refreshProgress();
    },

    markUnitComplete: optimizedProgress.markUnitComplete,
    fetchUserProgress: optimizedProgress.refreshProgress,

    // Enhanced functionality not available in legacy hooks
    getCourseProgress: optimizedProgress.getCourseProgress,
    refreshProgress: optimizedProgress.refreshProgress
  }), [optimizedProgress]);

  // Enhanced progress operations
  const enhancedOperations = useMemo(() => ({
    // Advanced calculations
    calculateCourseProgress: progressCalculations.calculateCourseStats,
    calculateUserStats: progressCalculations.calculateUserOverallStats,

    // Utility functions
    getCourseCompletionRate: (courseId: string) => {
      const course = optimizedProgress.getCourseProgress(courseId);
      return course?.progress_percentage || 0;
    },

    isUserEnrolledInCourse: (courseId: string) => {
      return optimizedProgress.courseProgress.some(course => course.course_id === courseId);
    },

    getUserCompletionStats: () => {
      const total = optimizedProgress.courseProgress.length;
      const completed = optimizedProgress.completedCourses.length;
      const inProgress = optimizedProgress.inProgressCourses.length;
      
      return {
        totalCourses: total,
        completedCourses: completed,
        inProgressCourses: inProgress,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      };
    }
  }), [optimizedProgress, progressCalculations]);

  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    cacheHitRate: 0, // Would be provided by the progress context
    lastCalculationTime: 0, // Would be provided by the progress context
    dataFreshness: Date.now() // Timestamp of last data update
  }), []);

  return {
    // Legacy interface for backward compatibility
    ...legacyInterface,
    
    // Enhanced operations
    ...enhancedOperations,
    
    // Performance metrics
    performanceMetrics,
    
    // Direct access to underlying hooks for advanced use cases
    _internal: {
      optimizedProgress,
      progressCalculations
    }
  };
};

/**
 * Hook for course-specific progress operations
 * Provides a focused interface for single course progress management
 */
export const useUnifiedCourseProgress = (courseId: string) => {
  const { getCourseProgress, markUnitComplete, refreshProgress } = useUnifiedProgress();
  const progressCalculations = useProgressCalculations();
  const { user } = useAuth();

  const courseProgress = useMemo(() => {
    return getCourseProgress(courseId);
  }, [getCourseProgress, courseId]);

  const courseOperations = useMemo(() => ({
    // Course-specific data
    progress: courseProgress,
    isCompleted: courseProgress?.status === 'completed',
    isInProgress: courseProgress?.status === 'in_progress',
    completionPercentage: courseProgress?.progress_percentage || 0,

    // Course-specific actions
    markUnitComplete: (unitId: string) => markUnitComplete(unitId, courseId),
    refreshCourseProgress: refreshProgress,
    calculateProgress: () => progressCalculations.calculateCourseStats(user?.id || '', courseId),

    // Utility functions
    getCompletionDate: () => courseProgress?.completed_at,
    getLastAccessed: () => courseProgress?.last_accessed_at
  }), [courseProgress, markUnitComplete, courseId, refreshProgress, progressCalculations, user?.id]);

  return courseOperations;
};

/**
 * Migration helper hook for components that need to gradually transition
 * from legacy hooks to the unified system
 */
export const useProgressMigration = (hookName: string) => {
  const unifiedProgress = useUnifiedProgress();
  
  // Feature flag to control migration (could be environment variable or user setting)
  const shouldUseLegacy = false; // Set to true to use legacy hooks during migration
  
  const migrationInfo = useMemo(() => ({
    isUsingUnified: !shouldUseLegacy,
    hookName,
    migrationComplete: true, // Would be determined by actual migration state
    performanceGain: 0, // Percentage improvement over legacy
    cacheEfficiency: 0 // Cache hit rate improvement
  }), [shouldUseLegacy, hookName]);

  if (shouldUseLegacy) {
    // During migration, this would return the legacy hook interface
    console.warn(`Component using legacy ${hookName} hook. Consider migrating to unified system.`);
  }

  return {
    ...unifiedProgress,
    _migration: migrationInfo
  };
};