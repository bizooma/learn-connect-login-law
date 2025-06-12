
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Award, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserProgress } from "@/hooks/useUserProgress";

const TeamOverviewTab = () => {
  const { user } = useAuth();
  const { teamMembers } = useTeamMembers();
  const { courseProgress, completedCourses, inProgressCourses } = useUserProgress(user?.id);

  // Calculate team statistics
  const totalTeamMembers = teamMembers.length;
  
  // Personal course statistics
  const totalAssignedCourses = courseProgress.filter(course => course.progress).length;
  const personalCompletedCourses = completedCourses.length;
  const personalInProgressCourses = inProgressCourses.length;

  return (
    <div className="space-y-6">
      {/* Personal Learning Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>My Learning Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalAssignedCourses}</div>
              <div className="text-sm text-gray-600">Assigned Courses</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{personalInProgressCourses}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{personalCompletedCourses}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Management Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Management Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{totalTeamMembers}</div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">-</div>
              <div className="text-sm text-gray-600">Active Assignments</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">-</div>
              <div className="text-sm text-gray-600">Team Completions</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">-</div>
              <div className="text-sm text-gray-600">Average Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2">Continue Learning</h3>
              <p className="text-sm text-gray-600 mb-3">
                {personalInProgressCourses > 0 
                  ? `You have ${personalInProgressCourses} course${personalInProgressCourses > 1 ? 's' : ''} in progress`
                  : "No courses in progress"
                }
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2">Team Management</h3>
              <p className="text-sm text-gray-600 mb-3">
                {totalTeamMembers > 0 
                  ? `Manage ${totalTeamMembers} team member${totalTeamMembers > 1 ? 's' : ''}`
                  : "No team members assigned"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamOverviewTab;
