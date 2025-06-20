
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
      const { data, error } = await supabase
        .from('admin_team_members')
        .select(`
          *,
          user_profile:profiles(email, first_name, last_name)
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      return data || [];
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
      const { data, error } = await supabase.rpc('get_team_progress_summary', {
        p_team_id: teamId
      });

      if (error) throw error;
      return data?.[0] || null;
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
