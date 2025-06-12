
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Users, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TeamLeaderDashboardHeader = () => {
  const { user } = useAuth();
  const { teamMembers } = useTeamMembers();

  // Count all team members since they're all assigned to this team leader
  const activeMembers = teamMembers.length;

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Team Leader Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.email}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">{activeMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Progress</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
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
