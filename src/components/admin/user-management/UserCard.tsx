import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SafeDeleteUserDialog from "./SafeDeleteUserDialog";
import SafeRoleUpdateDialog from "./SafeRoleUpdateDialog";
import UserCourseAssignment from "./UserCourseAssignment";
import UserEmailEditDialog from "./UserEmailEditDialog";
import UserPasswordResetDialog from "./UserPasswordResetDialog";
import TeamAssignmentDialog from "./TeamAssignmentDialog";
import UserGroupsDialog from "./UserGroupsDialog";
import { UserProfile } from "./types";
import { getUserRole, getRoleBadgeColor } from "./userRoleUtils";
import { useUserRole } from "@/hooks/useUserRole";
import {
  BookOpen,
  BarChart3,
  Mail,
  Lock,
  AlertTriangle,
  Users,
  UserPlus,
  Star,
  BookMarked,
  ChevronRight,
} from "lucide-react";
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
  onUserDeleted,
  onCourseAssigned,
  onViewProgress,
}: UserCardProps) => {
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showGroupsDialog, setShowGroupsDialog] = useState(false);
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  const userRole = getUserRole(user);
  const roleBadgeColor = getRoleBadgeColor(userRole);
  const displayName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.email;

  const getInitials = () => {
    const first = user.first_name?.charAt(0) || "";
    const last = user.last_name?.charAt(0) || "";
    return (first + last).toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  const isTeamLeader = userRole === "team_leader" || !!user.team_leader_id;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Identity Header */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3 min-w-0">
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                <AvatarImage src={user.profile_image_url || undefined} />
                <AvatarFallback className="bg-muted text-[#213C82] font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground leading-tight truncate">
                  {displayName}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Badge className={`${roleBadgeColor} text-[10px] uppercase tracking-wider`}>
              {userRole}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {isTeamLeader && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FFDA00]/15 text-amber-900 text-[10px] font-bold uppercase tracking-wider border border-[#FFDA00]/40">
                <Star className="h-3 w-3" />
                Team Leader
              </span>
            )}
            {user.law_firm_name && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                {user.law_firm_name}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground/80 font-medium ml-auto">
              Joined {formatUserJoinDate(user.created_at)}
            </span>
          </div>
        </div>

        {/* Protected Strip */}
        <div className="px-5 py-2 bg-amber-50/60 border-y border-amber-100 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
            Protected User Management
          </span>
        </div>

        {/* Platform Actions Split */}
        <div className="grid grid-cols-2 bg-muted/20">
          {/* LMS */}
          <div className="p-4 border-r border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3.5 bg-[#213C82] rounded-full" />
              <h4 className="text-[10px] font-extrabold text-[#213C82] uppercase tracking-[0.1em]">
                LMS
              </h4>
            </div>
            <div className="flex flex-col gap-2">
              <ZoneButton
                icon={<BookOpen className="h-3.5 w-3.5" />}
                label="Assign Course"
                onClick={() => setShowCourseDialog(true)}
                accent="blue"
              />
              {onViewProgress && (
                <ZoneButton
                  icon={<BarChart3 className="h-3.5 w-3.5" />}
                  label="View Progress"
                  onClick={() => onViewProgress(user.id)}
                  accent="blue"
                />
              )}
              {isAdmin && (
                <TeamAssignmentDialog
                  user={user}
                  onAssignmentComplete={() => {}}
                  trigger={
                    <button className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[12px] font-semibold text-foreground bg-background border border-border rounded-lg hover:border-[#213C82] hover:text-[#213C82] transition-all shadow-sm">
                      <span className="flex items-center gap-2">
                        <UserPlus className="h-3.5 w-3.5" />
                        Assign Team
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </button>
                  }
                />
              )}
            </div>
          </div>

          {/* P&P */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3.5 bg-muted-foreground/60 rounded-full" />
              <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.1em]">
                Policies & Proc
              </h4>
            </div>
            <div className="flex flex-col gap-2">
              <ZoneButton
                icon={<Users className="h-3.5 w-3.5" />}
                label="Manage Groups"
                onClick={() => setShowGroupsDialog(true)}
                accent="slate"
                disabled={!isAdmin}
              />
              <ZoneButton
                icon={<BookMarked className="h-3.5 w-3.5" />}
                label="Wiki Access"
                onClick={() => navigate(`/admin/wiki/directory?user=${user.id}`)}
                accent="slate"
              />
            </div>
          </div>
        </div>

        {/* Account Controls */}
        <div className="p-4 bg-muted/40 border-t border-border/60">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              Account Controls
            </h4>
            {isAdmin && (
              <SafeDeleteUserDialog
                user={user}
                onUserDeleted={onUserDeleted}
                trigger={
                  <button className="text-[10px] font-bold text-destructive hover:text-destructive/80 uppercase tracking-wider">
                    Delete User
                  </button>
                }
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <SafeRoleUpdateDialog
              user={user}
              currentRole={userRole}
              onRoleUpdated={() => {}}
              trigger={
                <button className="flex-1 min-w-[90px] px-3 py-1.5 text-[11px] font-bold text-foreground bg-background border border-border rounded shadow-sm hover:bg-muted/50">
                  Change Role
                </button>
              }
            />
            {isAdmin && (
              <button
                onClick={() => setShowEmailDialog(true)}
                className="flex-1 min-w-[90px] px-3 py-1.5 text-[11px] font-bold text-foreground bg-background border border-border rounded shadow-sm hover:bg-muted/50 inline-flex items-center justify-center gap-1"
              >
                <Mail className="h-3 w-3" />
                Edit Email
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowPasswordDialog(true)}
                className="flex-1 min-w-[90px] px-3 py-1.5 text-[11px] font-bold text-foreground bg-background border border-border rounded shadow-sm hover:bg-muted/50 inline-flex items-center justify-center gap-1"
              >
                <Lock className="h-3 w-3" />
                Reset PWD
              </button>
            )}
          </div>
        </div>
      </Card>

      {showCourseDialog && (
        <UserCourseAssignment
          userId={user.id}
          userEmail={user.email}
          userName={displayName}
          onAssignmentComplete={() => {
            setShowCourseDialog(false);
            onCourseAssigned?.();
          }}
        />
      )}

      {showEmailDialog && (
        <UserEmailEditDialog
          user={user}
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          onEmailUpdated={() => {}}
        />
      )}

      {showPasswordDialog && (
        <UserPasswordResetDialog
          user={user}
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          onPasswordReset={() => {}}
        />
      )}

      <UserGroupsDialog
        open={showGroupsDialog}
        onOpenChange={setShowGroupsDialog}
        userId={user.id}
        userName={displayName}
      />
    </>
  );
};

interface ZoneButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent: "blue" | "slate";
  disabled?: boolean;
}

const ZoneButton = ({ icon, label, onClick, accent, disabled }: ZoneButtonProps) => {
  const hoverClass =
    accent === "blue"
      ? "hover:border-[#213C82] hover:text-[#213C82]"
      : "hover:border-muted-foreground/60";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[12px] font-semibold text-foreground bg-background border border-border rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${hoverClass}`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
    </button>
  );
};
