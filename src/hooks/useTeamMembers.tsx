
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface TeamMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  profile_image_url?: string;
  roles?: string[];
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTeamMembers = async () => {
    if (!user?.id) {
      console.log('useTeamMembers: No user ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('useTeamMembers: Fetching team members for team leader:', user.id);
      
      // Fetch users assigned to this team leader
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          created_at,
          profile_image_url,
          user_roles (role)
        `)
        .eq('team_leader_id', user.id)
        .eq('is_deleted', false);

      if (error) {
        console.error('Error fetching team members:', error);
        toast({
          title: "Error",
          description: "Failed to fetch team members",
          variant: "destructive",
        });
        return;
      }

      console.log('useTeamMembers: Raw profiles data:', profiles);

      const formattedMembers = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        created_at: profile.created_at,
        profile_image_url: profile.profile_image_url,
        roles: profile.user_roles?.map((ur: any) => ur.role) || []
      })) || [];

      console.log('useTeamMembers: Formatted members:', formattedMembers);
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ team_leader_id: null })
        .eq('id', memberId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Team member removed successfully",
      });

      // Refresh the list
      fetchTeamMembers();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [user?.id]);

  return {
    teamMembers,
    loading,
    fetchTeamMembers,
    removeTeamMember
  };
};
