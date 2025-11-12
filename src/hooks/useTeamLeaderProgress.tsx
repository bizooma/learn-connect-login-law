import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CourseProgress {
  course_id: string;
  course_title: string;
  course_category: string;
  progress_percentage: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string | null;
}

export interface TeamMemberProgress {
  user_id: string;
  user_name: string;
  user_email: string;
  profile_image_url: string | null;
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  courses: CourseProgress[];
}

export const useTeamLeaderProgress = () => {
  const [teamProgress, setTeamProgress] = useState<TeamMemberProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const cacheRef = useRef<Map<string, { data: TeamMemberProgress[]; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchTeamLeaderProgress = useCallback(async (teamLeaderId: string, forceRefresh = false) => {
    if (!teamLeaderId) {
      console.warn('No team leader ID provided');
      return;
    }

    // Check cache
    const cached = cacheRef.current.get(teamLeaderId);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setTeamProgress(cached.data);
      return;
    }

    try {
      setLoading(true);
      console.log('useTeamLeaderProgress: fetching team progress', { teamLeaderId, forceRefresh });

      // Fetch team members assigned to this team leader
      const { data: teamMembers, error: membersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, profile_image_url')
        .eq('team_leader_id', teamLeaderId)
        .eq('is_deleted', false);

      if (membersError) throw membersError;

      if (!teamMembers || teamMembers.length === 0) {
        setTeamProgress([]);
        cacheRef.current.set(teamLeaderId, { data: [], timestamp: Date.now() });
        return;
      }

      const memberIds = teamMembers.map(m => m.id);

      // Fetch course assignments for all team members
      const { data: assignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select(`
          user_id,
          course_id,
          courses (
            id,
            title,
            category
          )
        `)
        .in('user_id', memberIds);

      if (assignmentsError) throw assignmentsError;

      // Fetch user progress for all team members
      const { data: progressData, error: progressError } = await supabase
        .from('user_course_progress')
        .select('*')
        .in('user_id', memberIds);

      if (progressError) throw progressError;

      console.log('useTeamLeaderProgress: fetched raw data', { members: teamMembers.length, assignments: assignments?.length || 0, progressRows: progressData?.length || 0 });
      // Build progress map for quick lookup
      const progressMap = new Map<string, any>();
      progressData?.forEach(progress => {
        const key = `${progress.user_id}-${progress.course_id}`;
        progressMap.set(key, progress);
      });

      // Build team member progress data
      const memberProgress: TeamMemberProgress[] = teamMembers.map(member => {
        const memberAssignments = assignments?.filter(a => a.user_id === member.id) || [];
        
        const courses: CourseProgress[] = memberAssignments.map(assignment => {
          const key = `${member.id}-${assignment.course_id}`;
          const progress = progressMap.get(key);
          const course = assignment.courses as any;

          return {
            course_id: assignment.course_id,
            course_title: course?.title || 'Unknown Course',
            course_category: course?.category || 'Uncategorized',
            progress_percentage: progress?.progress_percentage || 0,
            status: progress?.status || 'not_started',
            started_at: progress?.started_at || null,
            completed_at: progress?.completed_at || null,
            last_accessed_at: progress?.last_accessed_at || null,
          };
        });

        const completedCourses = courses.filter(c => c.status === 'completed').length;
        const inProgressCourses = courses.filter(c => c.status === 'in_progress').length;

        return {
          user_id: member.id,
          user_name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown',
          user_email: member.email,
          profile_image_url: member.profile_image_url,
          total_courses: courses.length,
          completed_courses: completedCourses,
          in_progress_courses: inProgressCourses,
          courses,
        };
      });

      setTeamProgress(memberProgress);
      cacheRef.current.set(teamLeaderId, { data: memberProgress, timestamp: Date.now() });

    } catch (error) {
      console.error('Error fetching team leader progress:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team progress",
        variant: "destructive",
      });
      setTeamProgress([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearCache = useCallback((teamLeaderId?: string) => {
    if (teamLeaderId) {
      cacheRef.current.delete(teamLeaderId);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  return {
    teamProgress,
    loading,
    fetchTeamLeaderProgress,
    clearCache,
  };
};
