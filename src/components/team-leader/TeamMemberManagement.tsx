
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Loader2 } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import TeamMemberProgressCard from "./TeamMemberProgressCard";
import UserProgressModal from "../admin/user-progress/UserProgressModal";
import { useState } from "react";

const TeamMemberManagement = () => {
  const { teamMembers, loading, fetchTeamMembers } = useTeamMembers();
  const [selectedUserForProgress, setSelectedUserForProgress] = useState<string | null>(null);

  const handleViewProgress = (userId: string) => {
    console.log('👀 Opening progress modal for user:', userId);
    setSelectedUserForProgress(userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading team members...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Members ({teamMembers.length})</span>
            </CardTitle>
            <Button onClick={fetchTeamMembers} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members</h3>
              <p className="text-gray-600 mb-4">
                You don't have any team members assigned yet. Contact an administrator to have team members assigned to you.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <TeamMemberProgressCard
                  key={member.id}
                  member={member}
                  onViewProgress={handleViewProgress}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Progress Modal */}
      <UserProgressModal
        isOpen={!!selectedUserForProgress}
        onClose={() => setSelectedUserForProgress(null)}
        userId={selectedUserForProgress}
      />
    </div>
  );
};

export default TeamMemberManagement;
