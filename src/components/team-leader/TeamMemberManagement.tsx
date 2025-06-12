
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import TeamMemberCard from "./TeamMemberCard";

const TeamMemberManagement = () => {
  const { teamMembers, loading } = useTeamMembers();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <CardTitle>Team Member Management</CardTitle>
            </div>
            <div className="text-sm text-gray-600">
              {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-500">
                Team members will appear here once they are assigned to you by an admin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamMemberManagement;
