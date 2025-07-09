
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface AdminTeam {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AdminTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  added_by: string;
  added_at: string;
  user_profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface TeamProgressSummary {
  total_members: number;
  courses_in_progress: number;
  courses_completed: number;
  average_progress: number;
}

export const useAdminTeams = () => {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_teams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase.rpc('create_admin_team', {
        p_name: name,
        p_description: description || null
      });

      if (error) throw error;

      toast({
        title: "Team Created",
        description: "Team has been successfully created.",
      });

      await fetchTeams();
      return data;
    } catch (err) {
      console.error('Error creating team:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create team",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateTeam = async (teamId: string, updates: { name?: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from('admin_teams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: "Team Updated",
        description: "Team has been successfully updated.",
      });

      await fetchTeams();
    } catch (err) {
      console.error('Error updating team:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update team",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('admin_teams')
        .update({ is_active: false })
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: "Team Deleted",
        description: "Team has been successfully deleted.",
      });

      await fetchTeams();
    } catch (err) {
      console.error('Error deleting team:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete team",
        variant: "destructive",
      });
      throw err;
    }
  };

  const getTeamMembers = async (teamId: string): Promise<AdminTeamMember[]> => {
    try {
      // First get team members
      const { data: membersData, error: membersError } = await supabase
        .from('admin_team_members')
        .select('*')
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        return [];
      }

      // Get user profiles for all members
      const userIds = membersData.map(member => member.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine members with their profiles
      const membersWithProfiles = membersData.map(member => {
        const profile = profilesData?.find(p => p.id === member.user_id);
        return {
          ...member,
          user_profile: profile ? {
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name
          } : undefined
        };
      });

      return membersWithProfiles;
    } catch (err) {
      console.error('Error fetching team members:', err);
      throw err;
    }
  };

  const addTeamMember = async (teamId: string, userId: string) => {
    try {
      const { data, error } = await supabase.rpc('add_team_member', {
        p_team_id: teamId,
        p_user_id: userId
      });

      if (error) throw error;

      toast({
        title: "Member Added",
        description: "User has been successfully added to the team.",
      });

      return data;
    } catch (err) {
      console.error('Error adding team member:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add team member",
        variant: "destructive",
      });
      throw err;
    }
  };

  const removeTeamMember = async (teamId: string, userId: string) => {
    try {
      const { data, error } = await supabase.rpc('remove_team_member', {
        p_team_id: teamId,
        p_user_id: userId
      });

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: "User has been successfully removed from the team.",
      });

      return data;
    } catch (err) {
      console.error('Error removing team member:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove team member",
        variant: "destructive",
      });
      throw err;
    }
  };

  const getTeamProgressSummary = async (teamId: string): Promise<TeamProgressSummary | null> => {
    try {
      const { data, error } = await supabase.rpc('get_optimized_team_progress', {
        p_team_id: teamId
      });

      if (error) throw error;
      
      // Transform the data to match the expected interface
      if (!data || !Array.isArray(data) || data.length === 0) {
        return {
          total_members: 0,
          courses_in_progress: 0,
          courses_completed: 0,
          average_progress: 0
        };
      }

      // Calculate summary from individual member data
      const totalMembers = data.length;
      const totalCoursesInProgress = data.reduce((sum: number, member: any) => sum + member.in_progress_courses, 0);
      const totalCoursesCompleted = data.reduce((sum: number, member: any) => sum + member.completed_courses, 0);
      const averageProgress = totalMembers > 0 
        ? Math.round(data.reduce((sum: number, member: any) => sum + member.overall_progress, 0) / totalMembers)
        : 0;

      return {
        total_members: totalMembers,
        courses_in_progress: totalCoursesInProgress,
        courses_completed: totalCoursesCompleted,
        average_progress: averageProgress
      };
    } catch (err) {
      console.error('Error fetching team progress:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return {
    teams,
    loading,
    error,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    getTeamMembers,
    addTeamMember,
    removeTeamMember,
    getTeamProgressSummary
  };
};
