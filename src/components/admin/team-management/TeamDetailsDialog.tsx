
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Plus, Trash2, Search, TrendingUp, BookOpen } from 'lucide-react';
import { useAdminTeams, AdminTeam, AdminTeamMember } from '@/hooks/useAdminTeams';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TeamDetailsDialogProps {
  team: AdminTeam;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

const TeamDetailsDialog = ({ team, open, onOpenChange }: TeamDetailsDialogProps) => {
  const { getTeamMembers, addTeamMember, removeTeamMember } = useAdminTeams();
  const [members, setMembers] = useState<AdminTeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchMembers = async () => {
    try {
      const teamMembers = await getTeamMembers(team.id);
      setMembers(teamMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('is_deleted', false)
        .ilike('email', `%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      
      // Filter out users who are already team members
      const memberIds = members.map(m => m.user_id);
      const filtered = (data || []).filter(user => !memberIds.includes(user.id));
      setAvailableUsers(filtered);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, team.id]);

  useEffect(() => {
    if (showAddMember) {
      fetchAvailableUsers();
    }
  }, [showAddMember, searchTerm, members]);

  const handleAddMember = async (userId: string) => {
    try {
      setLoading(true);
      await addTeamMember(team.id, userId);
      await fetchMembers();
      setShowAddMember(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (confirm('Are you sure you want to remove this member from the team?')) {
      try {
        setLoading(true);
        await removeTeamMember(team.id, userId);
        await fetchMembers();
      } catch (error) {
        console.error('Error removing member:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getDisplayName = (member: AdminTeamMember) => {
    const profile = member.user_profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile?.email || 'Unknown User';
  };

  const getInitials = (member: AdminTeamMember) => {
    const profile = member.user_profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {team.name}
          </DialogTitle>
          {team.description && (
            <p className="text-sm text-gray-600">{team.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold">{members.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <Button 
                onClick={() => setShowAddMember(!showAddMember)}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              {showAddMember && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search users by email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded bg-white">
                        <div>
                          <p className="font-medium">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}` 
                              : user.email}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAddMember(user.id)}
                          disabled={loading}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No members in this team yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(member)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getDisplayName(member)}</p>
                          <p className="text-sm text-gray-600">{member.user_profile?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Added {new Date(member.added_at).toLocaleDateString()}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDetailsDialog;
