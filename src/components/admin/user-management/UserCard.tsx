
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SafeDeleteUserDialog from "./SafeDeleteUserDialog";
import SafeRoleUpdateDialog from "./SafeRoleUpdateDialog";
import UserCourseAssignment from "./UserCourseAssignment";
import UserEmailEditDialog from "./UserEmailEditDialog";
import UserPasswordResetDialog from "./UserPasswordResetDialog";
import TeamAssignmentDialog from "./TeamAssignmentDialog";
import { UserProfile } from "./types";
import { getUserRole, getRoleBadgeColor } from "./userRoleUtils";
import { useUserRole } from "@/hooks/useUserRole";
import { BookOpen, BarChart3, Mail, Lock, AlertTriangle, Calendar } from "lucide-react";
import { formatUserJoinDate } from "@/utils/dateUtils";

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
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const { isAdmin } = useUserRole();
  
  const userRole = getUserRole(user);
  const roleBadgeColor = getRoleBadgeColor(userRole);

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  const handleRoleUpdated = () => {
    if (onCourseAssigned) {
      onCourseAssigned();
    }
  };

  const handleEmailUpdated = () => {
    if (onCourseAssigned) {
      onCourseAssigned();
    }
  };

  const handlePasswordReset = () => {
    if (onCourseAssigned) {
      onCourseAssigned();
    }
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
              
              <p className="text-sm text-gray-600 mb-2 truncate">
                {user.email}
              </p>

              {user.law_firm_name && (
                <p className="text-sm text-gray-500 mb-2 truncate">
                  {user.law_firm_name}
                </p>
              )}

              {user.team_leader_id && (
                <p className="text-sm text-orange-600 mb-2">
                  Assigned to team leader
                </p>
              )}

              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <Calendar className="h-3 w-3" />
                <span>Joined: {formatUserJoinDate(user.created_at)}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-600 font-medium">Protected User Management</span>
                </div>
                
                <SafeRoleUpdateDialog
                  user={user}
                  currentRole={userRole}
                  onRoleUpdated={handleRoleUpdated}
                />
                
                <div className="flex flex-wrap gap-2 mt-3">
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
                    <TeamAssignmentDialog
                      user={user}
                      onAssignmentComplete={handleRoleUpdated}
                    />
                  )}

                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmailDialog(true)}
                      className="flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      Edit Email
                    </Button>
                  )}

                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordDialog(true)}
                      className="flex items-center gap-1"
                    >
                      <Lock className="h-3 w-3" />
                      Reset Password
                    </Button>
                  )}
                  
                  {isAdmin && (
                    <SafeDeleteUserDialog
                      user={user}
                      onUserDeleted={onUserDeleted}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showCourseDialog && (
        <UserCourseAssignment
          userId={user.id}
          userEmail={user.email}
          userName={`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
          onAssignmentComplete={() => {
            setShowCourseDialog(false);
            if (onCourseAssigned) {
              onCourseAssigned();
            }
          }}
        />
      )}

      {showEmailDialog && (
        <UserEmailEditDialog
          user={user}
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          onEmailUpdated={handleEmailUpdated}
        />
      )}

      {showPasswordDialog && (
        <UserPasswordResetDialog
          user={user}
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          onPasswordReset={handlePasswordReset}
        />
      )}
    </>
  );
};
