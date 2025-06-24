
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, TrendingUp, Users, BookOpen, Clock, Eye } from 'lucide-react';
import { useTeamProgress, TeamMemberProgress } from '@/hooks/useTeamProgress';
import { AdminTeam } from '@/hooks/useAdminTeams';
import TeamMemberProgressCard from './TeamMemberProgressCard';
import TeamMemberProgressModal from './TeamMemberProgressModal';

interface TeamProgressDashboardProps {
  team: AdminTeam;
}

const TeamProgressDashboard = ({ team }: TeamProgressDashboardProps) => {
  const { teamProgress, loading, fetchTeamProgress } = useTeamProgress();
  const [selectedMember, setSelectedMember] = useState<TeamMemberProgress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('progress');

  useEffect(() => {
    fetchTeamProgress(team.id);
  }, [team.id, fetchTeamProgress]);

  // Filter and sort logic
  const filteredMembers = teamProgress
    .filter(member => {
      const searchMatch = searchTerm === '' || 
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'completed' && member.completed_courses === member.total_assigned_courses) ||
        (filterStatus === 'in_progress' && member.in_progress_courses > 0) ||
        (filterStatus === 'not_started' && member.overall_progress === 0);
      
      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.overall_progress - a.overall_progress;
        case 'name':
          return (a.first_name || a.email).localeCompare(b.first_name || b.email);
        case 'completed':
          return b.completed_courses - a.completed_courses;
        default:
          return 0;
      }
    });

  // Calculate team statistics
  const teamStats = {
    totalMembers: teamProgress.length,
    avgProgress: teamProgress.length > 0 
      ? Math.round(teamProgress.reduce((sum, m) => sum + m.overall_progress, 0) / teamProgress.length)
      : 0,
    totalCompletedCourses: teamProgress.reduce((sum, m) => sum + m.completed_courses, 0),
    totalAssignedCourses: teamProgress.reduce((sum, m) => sum + m.total_assigned_courses, 0),
    membersCompleted: teamProgress.filter(m => m.completed_courses === m.total_assigned_courses && m.total_assigned_courses > 0).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading team progress...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
            <div className="text-sm text-gray-600">Team Members</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{teamStats.avgProgress}%</div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">{teamStats.totalCompletedCourses}</div>
            <div className="text-sm text-gray-600">Courses Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{teamStats.membersCompleted}</div>
            <div className="text-sm text-gray-600">Fully Complete</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Member Progress Cards */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No members found</h3>
              <p>{searchTerm || filterStatus !== 'all' ? "Try adjusting your filters" : "This team has no members yet"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <TeamMemberProgressCard
                  key={member.user_id}
                  member={member}
                  onViewDetails={() => setSelectedMember(member)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Progress Modal */}
      <TeamMemberProgressModal
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
};

export default TeamProgressDashboard;
