
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserRoleSelect from "./UserRoleSelect";
import DeleteUserDialog from "./DeleteUserDialog";
import UserCourseAssignment from "./UserCourseAssignment";
import { UserProfile } from "./types";

interface UserCardProps {
  user: UserProfile;
  onRoleUpdate: (userId: string, newRole: string) => Promise<void>;
  onUserDeleted: () => void;
  onCourseAssigned?: () => void;
}

export const UserCard = ({ user, onRoleUpdate, onUserDeleted, onCourseAssigned }: UserCardProps) => {
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'owner':
        return 'default';
      case 'student':
        return 'secondary';
      case 'client':
        return 'outline';
      case 'free':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={user.profile_image_url || undefined} 
                alt={`${user.first_name} ${user.last_name}`} 
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              {user.law_firm_name && (
                <p className="text-xs text-gray-400 truncate">{user.law_firm_name}</p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {user.roles?.map((role, index) => (
            <Badge 
              key={index} 
              variant={getRoleBadgeVariant(role)}
              className="text-xs"
            >
              {role}
            </Badge>
          )) || (
            <Badge variant="outline" className="text-xs">No roles</Badge>
          )}
        </div>

        <div className="space-y-3">
          <UserRoleSelect 
            currentRole={user.roles?.[0] || ''} 
            onRoleChange={(newRole) => onRoleUpdate(user.id, newRole)}
            userId={user.id}
          />
          
          <div className="flex flex-col space-y-2">
            <UserCourseAssignment
              userId={user.id}
              userEmail={user.email}
              userName={`${user.first_name} ${user.last_name}`}
              onAssignmentComplete={onCourseAssigned}
            />
            
            <DeleteUserDialog 
              user={user} 
              onUserDeleted={onUserDeleted} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
