
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserRoleSelect } from "./UserRoleSelect";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UserCourseAssignment } from "./UserCourseAssignment";
import { UserProfile } from "./types";
import { getUserRole, getRoleBadgeColor } from "./userRoleUtils";
import { useUserRole } from "@/hooks/useUserRole";
import { Trash2, BookOpen, BarChart3 } from "lucide-react";

interface UserCardProps {
  user: UserProfile;
  onRoleUpdate: (userId: string, newRole: string) => Promise<void>;
  onUserDeleted: () => void;
  onCourseAssigned?: () => void;
  onViewProgress?: (userId: string) => void;
}

export const UserCard = ({ 
  user, 
  onRoleUpdate, 
  onUserDeleted, 
  onCourseAssigned,
  onViewProgress 
}: UserCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const { isAdmin } = useUserRole();
  
  const userRole = getUserRole(user);
  const roleBadgeColor = getRoleBadgeColor(userRole);

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.profile_image_url || undefined} />
              <AvatarFallback>
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.email
                  }
                </h3>
                <Badge className={roleBadgeColor}>
                  {userRole}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 truncate">
                {user.email}
              </p>
              
              <div className="space-y-3">
                <UserRoleSelect
                  userId={user.id}
                  currentRole={userRole}
                  onRoleUpdate={onRoleUpdate}
                />
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCourseDialog(true)}
                    className="flex items-center gap-1"
                  >
                    <BookOpen className="h-3 w-3" />
                    Assign Course
                  </Button>
                  
                  {onViewProgress && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewProgress(user.id)}
                      className="flex items-center gap-1"
                    >
                      <BarChart3 className="h-3 w-3" />
                      View Progress
                    </Button>
                  )}
                  
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteUserDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        user={user}
        onDeleted={onUserDeleted}
      />

      <UserCourseAssignment
        isOpen={showCourseDialog}
        onClose={() => setShowCourseDialog(false)}
        userId={user.id}
        userName={`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
        onCourseAssigned={onCourseAssigned}
      />
    </>
  );
};
