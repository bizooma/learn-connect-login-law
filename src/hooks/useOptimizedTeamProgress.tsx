import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';
import { useAdvancedCaching } from './useAdvancedCaching';

export interface TeamMemberProgress {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  total_assigned_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  overall_progress: number;
  course_progress: CourseProgress[];
}

export interface CourseProgress {
  course_id: string;
  course_title: string;
  course_category: string;
  progress_percentage: number;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  due_date: string | null;
  is_mandatory: boolean;
}

export const useOptimizedTeamProgress = () => {
  const [loading, setLoading] = useState(false);
  const [teamProgress, setTeamProgress] = useState<TeamMemberProgress[]>([]);
  const { getCachedData, setCachedData, invalidateCache, warmCache, preloadRelatedData, getCacheStats } = useAdvancedCaching();

  // Optimized single-query approach with advanced caching
  const fetchTeamProgressOptimized = useCallback(async (teamId: string) => {
    const start = performance.now();
    const cacheKey = `team_progress_${teamId}`;
    const dependencies = ['team_members', 'course_assignments', 'user_progress'];
    
    // Check advanced cache first
    const cached = getCachedData<TeamMemberProgress[]>(cacheKey, dependencies);
    if (cached) {
      setTeamProgress(cached);
      optimizationTracker.trackOptimization(
        'TeamProgress_AdvancedCacheHit',
        'memory_optimization',
        0,
        performance.now() - start
      );
      return;
    }

    setLoading(true);
    
    try {
      console.log('📊 Fetching optimized team progress for team:', teamId);
      
      // Get team members first, then fetch their profiles
      const { data: teamMembers, error: membersError } = await supabase
        .from('admin_team_members')
        .select('user_id')
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      if (!teamMembers || teamMembers.length === 0) {
        setTeamProgress([]);
        return;
      }

      const memberIds = teamMembers.map(m => m.user_id);

      // Get profiles for team members
      const { data: teamData, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', memberIds)
        .eq('is_deleted', false);

      if (error) throw error;

      if (!teamData || teamData.length === 0) {
        setTeamProgress([]);
        return;
      }

      // Batch fetch all course data in parallel
      const [assignmentsResult, progressResult] = await Promise.all([
        supabase
          .from('course_assignments')
          .select(`
            user_id,
            course_id,
            assigned_at,
            due_date,
            is_mandatory,
            courses!inner(
              id,
              title,
              category
            )
          `)
          .in('user_id', memberIds),
        
        supabase
          .from('user_course_progress')
          .select(`
            user_id,
            course_id,
            progress_percentage,
            status,
            completed_at
          `)
          .in('user_id', memberIds)
      ]);

      if (assignmentsResult.error) throw assignmentsResult.error;
      if (progressResult.error) throw progressResult.error;

      const assignments = assignmentsResult.data || [];
      const progress = progressResult.data || [];

      // Optimized data processing with Maps for O(1) lookups
      const progressMap = new Map(
        progress.map(p => [`${p.user_id}-${p.course_id}`, p])
      );
      
      const assignmentsByUser = new Map<string, any[]>();
      assignments.forEach(assignment => {
        const userId = assignment.user_id;
        if (!assignmentsByUser.has(userId)) {
          assignmentsByUser.set(userId, []);
        }
        assignmentsByUser.get(userId)!.push(assignment);
      });

      // Process team data with optimized calculations
      const memberProgress: TeamMemberProgress[] = teamData.map(member => {
        const userAssignments = assignmentsByUser.get(member.id) || [];
        
        const courseProgress: CourseProgress[] = userAssignments.map(assignment => {
          const progressKey = `${assignment.user_id}-${assignment.course_id}`;
          const progressData = progressMap.get(progressKey);
          
          return {
            course_id: assignment.course_id,
            course_title: assignment.courses?.title || 'Unknown Course',
            course_category: assignment.courses?.category || 'General',
            progress_percentage: progressData?.progress_percentage || 0,
            status: progressData?.status || 'not_started',
            assigned_at: assignment.assigned_at,
            completed_at: progressData?.completed_at || null,
            due_date: assignment.due_date,
            is_mandatory: assignment.is_mandatory
          };
        });

        // Optimized calculations
        const totalCourses = courseProgress.length;
        const completedCourses = courseProgress.filter(c => c.status === 'completed').length;
        const inProgressCourses = courseProgress.filter(c => c.status === 'in_progress').length;
        const overallProgress = totalCourses > 0 
          ? Math.round(courseProgress.reduce((sum, c) => sum + c.progress_percentage, 0) / totalCourses)
          : 0;

        return {
          user_id: member.id,
          email: member.email || '',
          first_name: member.first_name || null,
          last_name: member.last_name || null,
          total_assigned_courses: totalCourses,
          completed_courses: completedCourses,
          in_progress_courses: inProgressCourses,
          overall_progress: overallProgress,
          course_progress: courseProgress
        };
      });

      // Cache the results with advanced caching
      setCachedData(cacheKey, memberProgress, 5 * 60 * 1000, dependencies);

      setTeamProgress(memberProgress);
      
      // Preload related data
      preloadRelatedData(cacheKey, [
        `team_stats_${teamId}`,
        `team_courses_${teamId}`
      ], async (relatedKey) => {
        // Placeholder for related data fetching
        return null;
      });
      
      const duration = performance.now() - start;
      optimizationTracker.trackOptimization(
        'TeamProgress_OptimizedFetch',
        'database_batch',
        0,
        duration,
        memberProgress.length
      );
      
      console.log('✅ Optimized team progress loaded:', memberProgress.length, 'members in', Math.round(duration), 'ms');

    } catch (error: any) {
      console.error('❌ Error fetching team progress:', error);
      toast({
        title: "Error",
        description: "Failed to load team progress",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [getCachedData, setCachedData, preloadRelatedData]);

  // Clear cache when needed
  const clearCacheForTeam = useCallback((teamId?: string) => {
    if (teamId) {
      invalidateCache('team_members');
      invalidateCache('course_assignments');
      invalidateCache('user_progress');
    } else {
      invalidateCache('team_members');
      invalidateCache('course_assignments');
      invalidateCache('user_progress');
    }
  }, [invalidateCache]);

  // Memoized cache status using advanced caching
  const advancedCacheStats = useMemo(() => getCacheStats(), [getCacheStats, teamProgress]);

  return {
    teamProgress,
    loading,
    fetchTeamProgress: fetchTeamProgressOptimized,
    clearCache: clearCacheForTeam,
    cacheStats: advancedCacheStats
  };
};