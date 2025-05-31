
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Shield } from "lucide-react";
import UserRoleSelect from "./UserRoleSelect";
import { getUserRole, getRoleBadgeColor } from "./userRoleUtils";
import { UserProfile } from "./types";

interface UserCardProps {
  user: UserProfile;
  onRoleUpdate: (userId: string, newRole: 'admin' | 'owner' | 'student' | 'client' | 'free') => void;
}

const UserCard = ({ user, onRoleUpdate }: UserCardProps) => {
  const userRole = getUserRole(user);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {user.first_name} {user.last_name}
            </CardTitle>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Mail className="h-4 w-4 mr-1" />
              {user.email}
            </div>
          </div>
          <Badge className={getRoleBadgeColor(userRole)}>
            {userRole}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Calendar className="h-4 w-4 mr-1" />
          Joined {new Date(user.created_at).toLocaleDateString()}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm font-medium">Role:</span>
          </div>
          <UserRoleSelect
            currentRole={userRole}
            onRoleChange={(newRole) => onRoleUpdate(user.id, newRole)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
