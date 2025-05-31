
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
  const isIncompleteProfile = !user.hasCompleteProfile || user.email.includes('missing-profile');

  return (
    <Card className={`${isIncompleteProfile ? 'border-yellow-200 bg-yellow-50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          {user.first_name} {user.last_name}
          {isIncompleteProfile && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Incomplete Profile
            </Badge>
          )}
        </CardTitle>
        <p className={`text-sm ${isIncompleteProfile ? 'text-yellow-700' : 'text-gray-600'}`}>
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
          
          <div className="text-xs text-gray-500">
            <p>User ID: {user.id.substring(0, 8)}...</p>
            <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
            {isIncompleteProfile && (
              <p className="text-yellow-600 font-medium mt-1">
                ⚠️ Missing profile data
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
