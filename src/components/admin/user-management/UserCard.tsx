
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "./types";
import UserRoleSelect from "./UserRoleSelect";

interface UserCardProps {
  user: UserProfile;
  onRoleUpdate: (userId: string, newRole: 'admin' | 'owner' | 'student' | 'client' | 'free') => void;
}

const UserCard = ({ user, onRoleUpdate }: UserCardProps) => {
  const currentRole = user.roles?.[0]?.role || 'free';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          {user.first_name} {user.last_name}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {user.email}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Current Role
            </label>
            <UserRoleSelect
              currentRole={currentRole as 'admin' | 'owner' | 'student' | 'client' | 'free'}
              onRoleChange={(newRole) => onRoleUpdate(user.id, newRole)}
            />
          </div>
          
          {user.roles && user.roles.length > 1 && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Additional Roles
              </label>
              <div className="flex flex-wrap gap-1 mt-1">
                {user.roles.slice(1).map((role, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {role.role}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            <p>User ID: {user.id.substring(0, 8)}...</p>
            <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
