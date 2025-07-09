import { useCallback, useMemo } from 'react';
import { useProgressContext } from '@/contexts/ProgressContext';
import { useAuth } from '@/hooks/useAuth';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';

interface ProgressCalculationsConfig {
  enableCaching?: boolean;
  batchSize?: number;
}

interface UserStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  overallProgress: number;
  totalUnits: number;
  completedUnits: number;
  averageScore: number;
  streakDays: number;
}

interface CourseStats {
  courseId: string;
  progress: number;
  status: string;
  totalUnits: number;
  completedUnits: number;
  estimatedTimeRemaining: number;
}

export const useOptimizedProgressCalculations = (config: ProgressCalculationsConfig = {}) => {
  const { user } = useAuth();
  const progressContext = useProgressContext();
  const { enableCaching = true, batchSize = 10 } = config;

  // Calculate comprehensive course progress with enhanced metrics
  const calculateCourseProgress = useCallback(async (courseId: string): Promise<CourseStats> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const startTime = performance.now();
    
    try {
      // Use the optimized calculation from context
      const result = await progressContext.calculateCourseProgress(user.id, courseId);
      
      const stats: CourseStats = {
        courseId,
        progress: result.progress || 0,
        status: result.status || 'not_started',
        totalUnits: 0, // These would need to be fetched separately
        completedUnits: 0, // These would need to be fetched separately  
        estimatedTimeRemaining: calculateEstimatedTime(0, 0)
      };

      const endTime = performance.now();
      optimizationTracker.trackOptimization(
        `CalculateCourseProgress_${courseId}`,
        'parallel_processing',
        endTime - startTime,
        endTime,
        1
      );

      return stats;
    } catch (error) {
      console.error('Error calculating course progress:', error);
      throw error;
    }
  }, [user?.id, progressContext]);

  // Calculate user overall statistics
  const calculateUserOverallStats = useCallback(async (): Promise<UserStats> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const startTime = performance.now();

    try {
      // Ensure we have fresh course progress data
      await progressContext.fetchCourseProgress(user.id);
      
      const courseProgress = progressContext.getCourseProgress(user.id) || [];
      
      const totalCourses = courseProgress.length;
      const completedCourses = courseProgress.filter(c => c.status === 'completed').length;
      const inProgressCourses = courseProgress.filter(c => c.status === 'in_progress').length;
      
      // Calculate overall progress from individual course progress
      const overallProgress = totalCourses > 0 
        ? Math.round(courseProgress.reduce((sum, course) => sum + course.progress_percentage, 0) / totalCourses)
        : 0;

      // Get unit-level statistics for more detailed metrics
      const unitStats = await calculateUnitStatistics(courseProgress.map(c => c.course_id));

      const stats: UserStats = {
        totalCourses,
        completedCourses,
        inProgressCourses,
        overallProgress,
        totalUnits: unitStats.totalUnits,
        completedUnits: unitStats.completedUnits,
        averageScore: unitStats.averageScore,
        streakDays: await calculateLearningStreak()
      };

      const endTime = performance.now();
      optimizationTracker.trackOptimization(
        `CalculateUserStats_${user.id}`,
        'parallel_processing',
        endTime - startTime,
        endTime,
        totalCourses
      );

      return stats;
    } catch (error) {
      console.error('Error calculating user stats:', error);
      throw error;
    }
  }, [user?.id, progressContext]);

  // Batch calculate progress for multiple courses
  const batchCalculateProgress = useCallback(async (courseIds: string[]): Promise<CourseStats[]> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const startTime = performance.now();
    const results: CourseStats[] = [];

    try {
      // Process in batches to avoid overwhelming the system
      for (let i = 0; i < courseIds.length; i += batchSize) {
        const batch = courseIds.slice(i, i + batchSize);
        const batchPromises = batch.map(courseId => calculateCourseProgress(courseId));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`Error calculating progress for course ${batch[index]}:`, result.reason);
          }
        });
      }

      const endTime = performance.now();
      optimizationTracker.trackOptimization(
        `BatchCalculateProgress_${courseIds.length}`,
        'database_batch',
        endTime - startTime,
        endTime,
        courseIds.length
      );

      return results;
    } catch (error) {
      console.error('Error in batch calculation:', error);
      throw error;
    }
  }, [user?.id, batchSize, calculateCourseProgress]);

  // Helper function to calculate unit statistics
  const calculateUnitStatistics = useCallback(async (courseIds: string[]) => {
    if (!user?.id) return { totalUnits: 0, completedUnits: 0, averageScore: 0 };

    try {
      let totalUnits = 0;
      let completedUnits = 0;
      
      // Fetch unit progress for all courses in parallel
      const unitProgressPromises = courseIds.map(courseId => 
        progressContext.fetchUnitProgress(user.id!, courseId).then(() => 
          progressContext.getUnitProgress(user.id!, courseId) || []
        )
      );

      const allUnitProgress = await Promise.all(unitProgressPromises);
      
      allUnitProgress.forEach(unitProgress => {
        totalUnits += unitProgress.length;
        completedUnits += unitProgress.filter(unit => unit.completed).length;
      });

      return {
        totalUnits,
        completedUnits,
        averageScore: 0 // Could be enhanced to include actual quiz scores
      };
    } catch (error) {
      console.error('Error calculating unit statistics:', error);
      return { totalUnits: 0, completedUnits: 0, averageScore: 0 };
    }
  }, [user?.id, progressContext]);

  // Calculate learning streak (placeholder - would need streak tracking)
  const calculateLearningStreak = useCallback(async (): Promise<number> => {
    // This would integrate with a learning streak tracking system
    // For now, return 0 as placeholder
    return 0;
  }, []);

  // Estimate time remaining for course completion
  const calculateEstimatedTime = useCallback((totalUnits: number, completedUnits: number): number => {
    if (totalUnits === 0 || completedUnits >= totalUnits) return 0;
    
    // Assume average of 30 minutes per unit (could be made configurable)
    const averageTimePerUnit = 30; // minutes
    const remainingUnits = totalUnits - completedUnits;
    
    return remainingUnits * averageTimePerUnit;
  }, []);

  // Get progress trend analysis
  const getProgressTrend = useCallback(async (courseId: string, days = 30) => {
    // This would analyze progress over time
    // Placeholder for future implementation
    return {
      trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      changePercentage: 0,
      projectedCompletion: null as Date | null
    };
  }, []);

  return {
    calculateCourseProgress,
    calculateUserOverallStats,
    batchCalculateProgress,
    calculateEstimatedTime,
    getProgressTrend
  };
};