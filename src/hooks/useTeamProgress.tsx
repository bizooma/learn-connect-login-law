
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

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

  const fetchTeamProgress = useCallback(async (teamId: string) => {
    setLoading(true);
    
    try {
      logger.log('📊 Fetching team progress for team:', teamId);
      
      // Get team members
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

      // Get course assignments for all team members
      const { data: assignments, error: assignmentsError } = await supabase
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
        .in('user_id', memberIds);

      if (assignmentsError) throw assignmentsError;

      // Get course progress for all assignments
      const { data: progress, error: progressError } = await supabase
        .from('user_course_progress')
        .select(`
          user_id,
          course_id,
          progress_percentage,
          status,
          completed_at
        `)
        .in('user_id', memberIds);

      if (progressError) throw progressError;

      // Process the data
      const memberProgress: TeamMemberProgress[] = profiles?.map(profile => {
        const memberAssignments = assignments?.filter(a => a.user_id === profile.id) || [];
        const memberProgressData = progress?.filter(p => p.user_id === profile.id) || [];

        const courseProgress: CourseProgress[] = memberAssignments.map(assignment => {
          const progressData = memberProgressData.find(p => p.course_id === assignment.course_id);
          
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
      }) || [];

      setTeamProgress(memberProgress);
      logger.log('✅ Team progress loaded:', memberProgress.length, 'members');

    } catch (error: any) {
      logger.error('❌ Error fetching team progress:', error);
      toast({
        title: "Error",
        description: "Failed to load team progress",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    teamProgress,
    loading,
    fetchTeamProgress
  };
};
