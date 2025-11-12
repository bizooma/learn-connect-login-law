
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Users, Target, TrendingUp, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamMemberProgress } from "@/hooks/useTeamLeaderProgress";

interface TeamLeaderDashboardHeaderProps {
  teamProgress: TeamMemberProgress[];
  loading: boolean;
}

const TeamLeaderDashboardHeader = ({ teamProgress, loading }: TeamLeaderDashboardHeaderProps) => {
  const { user, signOut } = useAuth();
  const { teamMembers } = useTeamMembers();

  // Count all team members since they're all assigned to this team leader
  const activeMembers = teamMembers.length;

  // Calculate active assignments (total courses assigned across all team members)
  const activeAssignments = teamProgress.reduce((total, member) => {
    return total + member.courses.length;
  }, 0);

  // Calculate average team progress
  const totalProgress = teamProgress.reduce((total, member) => {
    const memberAvg = member.courses.reduce((sum, course) => sum + course.progress_percentage, 0) / 
                      (member.courses.length || 1);
    return total + memberAvg;
  }, 0);
  const averageProgress = teamProgress.length > 0 
    ? Math.round(totalProgress / teamProgress.length) 
    : 0;

  return (
    <div style={{ background: '#213C82' }} className="shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                alt="New Frontier University" 
                className="h-12 w-auto"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Team Leader Dashboard
              </h1>
              <p className="text-white/90 mt-1">
                Welcome back, {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={signOut}
              className="flex items-center text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">{activeMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{activeAssignments}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Progress</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{averageProgress}%</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamLeaderDashboardHeader;
