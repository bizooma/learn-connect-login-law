
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Settings, Eye, TrendingUp, MoreVertical, BarChart3 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAdminTeams, AdminTeam, TeamProgressSummary } from '@/hooks/useAdminTeams';
import TeamDetailsDialog from './TeamDetailsDialog';
import EditTeamDialog from './EditTeamDialog';
import TeamProgressDashboard from './TeamProgressDashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AdminTeamCardProps {
  team: AdminTeam;
}

const AdminTeamCard = ({ team }: AdminTeamCardProps) => {
  const { getTeamProgressSummary, deleteTeam } = useAdminTeams();
  const [progressSummary, setProgressSummary] = useState<TeamProgressSummary | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const summary = await getTeamProgressSummary(team.id);
        setProgressSummary(summary);
      } catch (error) {
        console.error('Error fetching team progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [team.id, getTeamProgressSummary]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await deleteTeam(team.id);
      } catch (error) {
        console.error('Error deleting team:', error);
      }
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold truncate">{team.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowProgress(true)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                View Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDetails(true)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEdit(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600"
              >
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {team.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{team.description}</p>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                <Users className="w-4 h-4 mr-2 text-blue-500" />
                <span>Members</span>
              </div>
              <Badge variant="outline">
                {loading ? '...' : progressSummary?.total_members || 0}
              </Badge>
            </div>

            {!loading && progressSummary && progressSummary.total_members > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                    <span>Avg Progress</span>
                  </div>
                  <Badge variant="outline">
                    {Math.round(progressSummary.average_progress)}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-600">
                      {progressSummary.courses_in_progress}
                    </div>
                    <div className="text-blue-500">In Progress</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-600">
                      {progressSummary.courses_completed}
                    </div>
                    <div className="text-green-500">Completed</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowProgress(true)}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Progress
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetails(true)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Dashboard Dialog */}
      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>{team.name} - Progress Dashboard</span>
            </DialogTitle>
          </DialogHeader>
          <TeamProgressDashboard team={team} />
        </DialogContent>
      </Dialog>

      <TeamDetailsDialog
        team={team}
        open={showDetails}
        onOpenChange={setShowDetails}
      />

      <EditTeamDialog
        team={team}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
    </>
  );
};

export default AdminTeamCard;
