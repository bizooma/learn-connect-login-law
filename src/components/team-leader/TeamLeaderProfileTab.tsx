
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Calendar } from "lucide-react";

const TeamLeaderProfileTab = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Role</p>
              <p className="text-sm text-gray-600">Team Leader</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Leadership</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            As a Team Leader, you can monitor your team members' progress, 
            view their course completions, and help guide their learning journey.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">• View team member progress</p>
            <p className="text-sm text-gray-500">• Monitor course completions</p>
            <p className="text-sm text-gray-500">• Access learning analytics</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamLeaderProfileTab;
