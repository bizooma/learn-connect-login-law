
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, RefreshCw } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import TeamMemberProgressCard from "./TeamMemberProgressCard";
import UserProgressModal from "../admin/user-progress/UserProgressModal";
import { useState, useEffect, useMemo } from "react";

interface TeamMemberProgress {
  user_id: string;
  user_name: string;
  user_email: string;
  profile_image_url: string | null;
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
}

interface TeamMemberManagementProps {
  teamProgress: TeamMemberProgress[];
  progressLoading: boolean;
  onRefresh: () => void;
}

const TeamMemberManagement = ({ teamProgress, progressLoading, onRefresh }: TeamMemberManagementProps) => {
  const { teamMembers, loading: membersLoading, fetchTeamMembers } = useTeamMembers();
  const [selectedUserForProgress, setSelectedUserForProgress] = useState<string | null>(null);

  useEffect(() => {
    // Fetch team members on mount
    fetchTeamMembers();
  }, []);

  // Create efficient lookup map for progress data
  const progressByUserId = useMemo(() => {
    const map = new Map();
    teamProgress.forEach(progress => {
      map.set(progress.user_id, {
        totalCourses: progress.total_courses,
        completedCourses: progress.completed_courses,
        inProgressCourses: progress.in_progress_courses,
        overallProgress: progress.completed_courses > 0 
          ? Math.round((progress.completed_courses / progress.total_courses) * 100) 
          : 0
      });
    });
    return map;
  }, [teamProgress]);

  const handleViewProgress = (userId: string) => {
    console.log('👀 Opening progress modal for user:', userId);
    setSelectedUserForProgress(userId);
  };

  const handleRefresh = () => {
    fetchTeamMembers();
    onRefresh(); // Call parent's refresh function
  };

  const isLoading = membersLoading && teamMembers.length === 0;

  if (isLoading) {
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
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={membersLoading || progressLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(membersLoading || progressLoading) ? 'animate-spin' : ''}`} />
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
                  progress={progressByUserId.get(member.id)}
                  loading={progressLoading}
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
