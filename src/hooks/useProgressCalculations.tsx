import { useCallback, useMemo } from 'react';
import { useProgressContext } from '@/contexts/ProgressContext';

// Memoized calculation functions for expensive progress computations
export const useProgressCalculations = () => {
  const progressContext = useProgressContext();

  // Calculate detailed course statistics with caching
  const calculateCourseStats = useCallback(async (userId: string, courseId: string) => {
    const calcKey = `detailed-stats-${userId}-${courseId}`;
    
    // Check if we have cached calculation
    const cached = progressContext.getCalculation(calcKey);
    if (cached) {
      return cached;
    }

    try {
      // Get course progress calculation
      const { progress, status } = await progressContext.calculateCourseProgress(userId, courseId);
      
      // Get unit progress for detailed breakdown
      await progressContext.fetchUnitProgress(userId, courseId);
      const unitProgress = progressContext.getUnitProgress(userId, courseId) || [];
      
      const totalUnits = unitProgress.length;
      const completedUnits = unitProgress.filter(u => u.completed).length;
      const remainingUnits = totalUnits - completedUnits;
      
      // Calculate estimated time to completion (if applicable)
      const averageTimePerUnit = 15; // minutes, could be made dynamic
      const estimatedTimeRemaining = remainingUnits * averageTimePerUnit;
      
      // Calculate completion velocity (units per day)
      const completedWithDates = unitProgress.filter(u => u.completed && u.completed_at);
      let completionVelocity = 0;
      
      if (completedWithDates.length >= 2) {
        const dates = completedWithDates
          .map(u => new Date(u.completed_at!))
          .sort((a, b) => a.getTime() - b.getTime());
        
        const daysDiff = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
        completionVelocity = daysDiff > 0 ? completedWithDates.length / daysDiff : 0;
      }

      const result = {
        progress,
        status,
        totalUnits,
        completedUnits,
        remainingUnits,
        estimatedTimeRemaining,
        completionVelocity,
        lastActivity: unitProgress
          .filter(u => u.completed_at)
          .map(u => u.completed_at!)
          .sort()
          .pop() || null
      };

      // Cache the result
      progressContext.getCalculation(calcKey);
      
      return result;
    } catch (error) {
      console.error('Error calculating detailed course stats:', error);
      throw error;
    }
  }, [progressContext]);

  // Calculate user overall statistics across all courses
  const calculateUserOverallStats = useCallback((userId: string) => {
    const courseProgress = progressContext.getCourseProgress(userId);
    if (!courseProgress) return null;

    const totalCourses = courseProgress.length;
    const completedCourses = courseProgress.filter(c => c.status === 'completed').length;
    const inProgressCourses = courseProgress.filter(c => c.status === 'in_progress').length;
    const notStartedCourses = courseProgress.filter(c => c.status === 'not_started').length;

    const overallProgress = totalCourses > 0 
      ? Math.round(courseProgress.reduce((sum, c) => sum + c.progress_percentage, 0) / totalCourses)
      : 0;

    const completionRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    // Calculate streaks and engagement
    const recentActivity = courseProgress
      .filter(c => c.last_accessed_at)
      .map(c => new Date(c.last_accessed_at!))
      .sort((a, b) => b.getTime() - a.getTime());

    const lastActivity = recentActivity[0] || null;
    const isActive = lastActivity ? (Date.now() - lastActivity.getTime()) < (7 * 24 * 60 * 60 * 1000) : false; // Active within 7 days

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      notStartedCourses,
      overallProgress,
      completionRate,
      lastActivity,
      isActive
    };
  }, [progressContext]);

  // Calculate team performance metrics
  const calculateTeamPerformanceMetrics = useCallback((teamId: string) => {
    const teamProgress = progressContext.getTeamProgress(teamId);
    if (!teamProgress) return null;

    const members = teamProgress.members;
    const totalMembers = members.length;

    if (totalMembers === 0) {
      return {
        totalMembers: 0,
        averageProgress: 0,
        topPerformers: [],
        strugglingMembers: [],
        teamVelocity: 0,
        completionTrend: 'stable'
      };
    }

    // Calculate performance metrics
    const averageProgress = Math.round(
      members.reduce((sum, m) => sum + m.overall_progress, 0) / totalMembers
    );

    // Identify top performers (top 20% or those with >80% progress)
    const topPerformers = members
      .filter(m => m.overall_progress >= 80)
      .sort((a, b) => b.overall_progress - a.overall_progress)
      .slice(0, Math.max(1, Math.ceil(totalMembers * 0.2)));

    // Identify struggling members (bottom 20% or those with <30% progress)
    const strugglingMembers = members
      .filter(m => m.overall_progress < 30)
      .sort((a, b) => a.overall_progress - b.overall_progress)
      .slice(0, Math.max(1, Math.ceil(totalMembers * 0.2)));

    // Calculate team velocity (completion rate trend)
    const totalCoursesAssigned = members.reduce((sum, m) => sum + m.total_courses, 0);
    const totalCompleted = members.reduce((sum, m) => sum + m.completed_courses, 0);
    const teamCompletionRate = totalCoursesAssigned > 0 ? (totalCompleted / totalCoursesAssigned) * 100 : 0;

    // Determine completion trend (simplified - in real implementation, this would use historical data)
    let completionTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (teamCompletionRate > 75) {
      completionTrend = 'improving';
    } else if (teamCompletionRate < 40) {
      completionTrend = 'declining';
    }

    return {
      totalMembers,
      averageProgress,
      topPerformers,
      strugglingMembers,
      teamVelocity: teamCompletionRate,
      completionTrend,
      distributionMetrics: {
        highPerformers: topPerformers.length,
        averagePerformers: totalMembers - topPerformers.length - strugglingMembers.length,
        strugglingMembers: strugglingMembers.length
      }
    };
  }, [progressContext]);

  // Calculate learning analytics for insights
  const calculateLearningAnalytics = useCallback((userId: string) => {
    const courseProgress = progressContext.getCourseProgress(userId);
    if (!courseProgress) return null;

    // Analyze learning patterns
    const coursesWithProgress = courseProgress.filter(c => c.progress_percentage > 0);
    
    // Calculate average completion time (simplified)
    const completedCourses = courseProgress.filter(c => c.status === 'completed');
    const averageCompletionTime = completedCourses.length > 0 ? '2-3 weeks' : 'N/A'; // Simplified

    // Identify learning preferences (by course category)
    const categoryPerformance = coursesWithProgress.reduce((acc, course) => {
      // Note: Would need to join with course data to get category
      // This is simplified for demonstration
      const category = 'General'; // Placeholder
      if (!acc[category]) {
        acc[category] = { total: 0, averageProgress: 0 };
      }
      acc[category].total++;
      acc[category].averageProgress += course.progress_percentage;
      return acc;
    }, {} as Record<string, { total: number; averageProgress: number }>);

    // Finalize category averages
    Object.keys(categoryPerformance).forEach(category => {
      categoryPerformance[category].averageProgress = Math.round(
        categoryPerformance[category].averageProgress / categoryPerformance[category].total
      );
    });

    // Determine learning streak (simplified)
    const hasRecentActivity = courseProgress.some(c => {
      if (!c.last_accessed_at) return false;
      const daysSinceAccess = (Date.now() - new Date(c.last_accessed_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAccess <= 7;
    });

    return {
      totalCoursesStarted: coursesWithProgress.length,
      averageCompletionTime,
      categoryPerformance,
      learningStreak: hasRecentActivity ? '1 week' : '0 days', // Simplified
      recommendedFocus: coursesWithProgress.length > completedCourses.length ? 'Course completion' : 'Continue current pace',
      engagementLevel: hasRecentActivity ? 'High' : 'Low'
    };
  }, [progressContext]);

  return {
    calculateCourseStats,
    calculateUserOverallStats,
    calculateTeamPerformanceMetrics,
    calculateLearningAnalytics
  };
};