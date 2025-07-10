
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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

export const useTeamProgress = () => {
  const [loading, setLoading] = useState(false);
  const [teamProgress, setTeamProgress] = useState<TeamMemberProgress[]>([]);
  const [cache, setCache] = useState<Map<string, { data: TeamMemberProgress[]; timestamp: number }>>(new Map());

  // Cache timeout of 5 minutes
  const CACHE_TIMEOUT = 5 * 60 * 1000;

  const fetchTeamProgress = useCallback(async (teamId: string, forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get(teamId);
      if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
        console.log('📋 Using cached team progress for team:', teamId);
        setTeamProgress(cached.data);
        return;
      }
    }

    setLoading(true);
    
    try {
      console.log('📊 Fetching team progress for team:', teamId);
      
      // Get team members first
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
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', memberIds)
        .eq('is_deleted', false);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setTeamProgress([]);
        return;
      }

      // Parallel batch operations for better performance
      const [assignmentsResponse, progressResponse] = await Promise.all([
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

      if (assignmentsResponse.error) throw assignmentsResponse.error;
      if (progressResponse.error) throw progressResponse.error;

      const assignments = assignmentsResponse.data || [];
      const progress = progressResponse.data || [];

      // Process data with memoized lookups for O(1) performance
      const assignmentsByUser = useMemo(() => {
        const map = new Map<string, typeof assignments>();
        assignments.forEach(assignment => {
          if (!map.has(assignment.user_id)) {
            map.set(assignment.user_id, []);
          }
          map.get(assignment.user_id)!.push(assignment);
        });
        return map;
      }, [assignments]);

      const progressByUser = useMemo(() => {
        const map = new Map<string, Map<string, typeof progress[0]>>();
        progress.forEach(p => {
          if (!map.has(p.user_id)) {
            map.set(p.user_id, new Map());
          }
          map.get(p.user_id)!.set(p.course_id, p);
        });
        return map;
      }, [progress]);

      // Process the data efficiently
      const memberProgress: TeamMemberProgress[] = profiles.map(profile => {
        const memberAssignments = assignmentsByUser.get(profile.id) || [];
        const memberProgressMap = progressByUser.get(profile.id) || new Map();

        const courseProgress: CourseProgress[] = memberAssignments.map(assignment => {
          const progressData = memberProgressMap.get(assignment.course_id);
          
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

        // Pre-calculate stats for better performance
        const totalCourses = courseProgress.length;
        const completedCourses = courseProgress.filter(c => c.status === 'completed').length;
        const inProgressCourses = courseProgress.filter(c => c.status === 'in_progress').length;
        const overallProgress = totalCourses > 0 
          ? Math.round(courseProgress.reduce((sum, c) => sum + c.progress_percentage, 0) / totalCourses)
          : 0;

        return {
          user_id: profile.id,
          email: profile.email || '',
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          total_assigned_courses: totalCourses,
          completed_courses: completedCourses,
          in_progress_courses: inProgressCourses,
          overall_progress: overallProgress,
          course_progress: courseProgress
        };
      });

      // Cache the results
      setCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.set(teamId, { data: memberProgress, timestamp: Date.now() });
        return newCache;
      });

      setTeamProgress(memberProgress);
      console.log('✅ Team progress loaded:', memberProgress.length, 'members');

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
  }, [cache]);

  // Clear cache helper function
  const clearCache = useCallback((teamId?: string) => {
    if (teamId) {
      setCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.delete(teamId);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  }, []);

  return {
    teamProgress,
    loading,
    fetchTeamProgress,
    clearCache
  };
};
