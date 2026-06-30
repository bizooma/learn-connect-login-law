import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OwnerPicker from "@/components/admin/wiki/OwnerPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEPARTMENTS = ["CEO", "Legal", "Legal Support", "Marketing & Sales", "Operations", "Sales & Intake", "Support Staff"] as const;


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
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatUserJoinDate } from "@/utils/dateUtils";


interface UserCardProps {
  user: UserProfile;
  onRoleUpdate: (userId: string, newRole: string) => Promise<void>;
  onUserDeleted: () => void;
  onCourseAssigned?: () => void;
  onViewProgress?: (userId: string) => void;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onOpenDetail?: (userId: string) => void;
}

export const UserCard = ({
  user,
  onUserDeleted,
  onCourseAssigned,
  onViewProgress,
  selected,
  onSelectedChange,
  onOpenDetail,
}: UserCardProps) => {
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showGroupsDialog, setShowGroupsDialog] = useState(false);
  const [isTester, setIsTester] = useState(false);
  const [testerSaving, setTesterSaving] = useState(false);
  const [jobTitle, setJobTitle] = useState(user.job_title || "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(user.job_title || "");
  const [titleSaving, setTitleSaving] = useState(false);
  const [managerId, setManagerId] = useState<string | null>(user.manager_id ?? null);
  const [managerDisplay, setManagerDisplay] = useState<{ id: string; first_name: string | null; last_name: string | null; email: string; profile_image_url?: string | null } | null>(null);
  const [department, setDepartment] = useState<string | null>((user as any).department ?? null);
  const { isAdmin } = useUserRole();

  const { toast } = useToast();
  const navigate = useNavigate();


  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "tester")
        .maybeSingle();
      if (active) setIsTester(!!data);
    })();
    return () => {
      active = false;
    };
  }, [user.id]);

  useEffect(() => {
    let active = true;
    if (!managerId) {
      setManagerDisplay(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, profile_image_url")
        .eq("id", managerId)
        .maybeSingle();
      if (active) setManagerDisplay(data as any);
    })();
    return () => {
      active = false;
    };
  }, [managerId]);

  const saveManager = async (newId: string | null) => {
    const prev = managerId;
    setManagerId(newId);
    const { error } = await supabase
      .from("profiles")
      .update({ manager_id: newId } as any)
      .eq("id", user.id);
    if (error) {
      setManagerId(prev);
      toast({
        title: "Update failed",
        description: error.message || "Could not update manager.",
        variant: "destructive",
      });
    } else {
      toast({ title: newId ? "Manager assigned" : "Manager cleared" });
    }
  };

  const saveDepartment = async (value: string) => {
    const next = value === "__none__" ? null : value;
    const prev = department;
    setDepartment(next);
    const { error } = await supabase
      .from("profiles")
      .update({ department: next } as any)
      .eq("id", user.id);
    if (error) {
      setDepartment(prev);
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: next ? `Department set to ${next}` : "Department cleared" });
    }
  };


  const toggleTester = async (next: boolean) => {
    setTesterSaving(true);
    try {
      if (next) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: "tester" });
        if (error && !`${error.message}`.includes("duplicate")) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.id)
          .eq("role", "tester");
        if (error) throw error;
      }
      setIsTester(next);
      toast({
        title: next ? "Tester access granted" : "Tester access removed",
        description: next
          ? "User can now see the Policies & Procedures button."
          : "User no longer has Policies & Procedures access.",
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Could not update tester access.",
        variant: "destructive",
      });
    } finally {
      setTesterSaving(false);
    }
  };
  const saveTitle = async () => {
    const newTitle = titleDraft.trim();
    setTitleSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ job_title: newTitle || null })
        .eq("id", user.id);
      if (error) throw error;
      setJobTitle(newTitle);
      setEditingTitle(false);
      toast({ title: "Title updated", description: newTitle || "Title cleared." });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Could not update title.",
        variant: "destructive",
      });
    } finally {
      setTitleSaving(false);
    }
  };



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
      <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${selected ? "ring-2 ring-primary" : ""}`}>
        {/* Identity Header */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3 min-w-0">
              {onSelectedChange && (
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={(e) => onSelectedChange(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary cursor-pointer"
                  aria-label="Select user"
                />
              )}
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                <AvatarImage src={user.profile_image_url || undefined} />
                <AvatarFallback className="bg-muted text-[#213C82] font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenDetail?.(user.id)}
                  className="text-left text-base font-bold text-foreground leading-tight truncate hover:text-primary hover:underline"
                  disabled={!onOpenDetail}
                >
                  {displayName}
                </button>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {editingTitle ? (
                  <div className="mt-1 flex items-center gap-1">
                    <Input
                      autoFocus
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTitle();
                        if (e.key === "Escape") {
                          setEditingTitle(false);
                          setTitleDraft(jobTitle);
                        }
                      }}
                      placeholder="Job title"
                      className="h-7 text-xs"
                      disabled={titleSaving}
                    />
                    <button
                      onClick={saveTitle}
                      disabled={titleSaving}
                      className="p-1 rounded hover:bg-muted text-green-600"
                      aria-label="Save title"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTitle(false);
                        setTitleDraft(jobTitle);
                      }}
                      disabled={titleSaving}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                      aria-label="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => isAdmin && setEditingTitle(true)}
                    disabled={!isAdmin}
                    className={`mt-0.5 flex items-center gap-1 text-xs truncate ${
                      jobTitle ? "text-foreground" : "text-muted-foreground italic"
                    } ${isAdmin ? "hover:text-primary" : "cursor-default"}`}
                  >
                    <span className="truncate">{jobTitle || "Add title"}</span>
                    {isAdmin && <Pencil className="h-3 w-3 opacity-60" />}
                  </button>
                )}
              </div>

            </div>
            <Badge className={`${roleBadgeColor} text-[10px] uppercase tracking-wider`}>
              {userRole}
            </Badge>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground shrink-0">Manager:</span>
            {isAdmin ? (
              <OwnerPicker
                value={managerId}
                ownerDisplay={managerDisplay as any}
                onChange={saveManager}
              />
            ) : (
              <span className="text-foreground truncate">
                {managerDisplay
                  ? `${managerDisplay.first_name ?? ""} ${managerDisplay.last_name ?? ""}`.trim() ||
                    managerDisplay.email
                  : "—"}
              </span>
            )}
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
                <div className="[&>button]:w-full [&>button]:justify-start [&>button]:bg-background [&>button]:border [&>button]:border-border [&>button]:rounded-lg [&>button]:shadow-sm [&>button]:text-[12px] [&>button]:font-semibold [&>button]:text-foreground [&>button]:hover:border-[#213C82] [&>button]:hover:text-[#213C82]">
                  <TeamAssignmentDialog user={user} onAssignmentComplete={() => {}} />
                </div>
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
              {isAdmin && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-background border border-border rounded-lg shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-foreground">
                      Tester
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Grants P&P button access
                    </span>
                  </div>
                  <Switch
                    checked={isTester}
                    disabled={testerSaving}
                    onCheckedChange={toggleTester}
                  />
                </div>
              )}
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
              <div className="[&>button]:h-auto [&>button]:px-2 [&>button]:py-0 [&>button]:text-[10px] [&>button]:font-bold [&>button]:text-destructive [&>button]:bg-transparent [&>button]:hover:bg-transparent [&>button]:hover:text-destructive/80 [&>button]:uppercase [&>button]:tracking-wider [&>button]:shadow-none [&>button]:border-0">
                <SafeDeleteUserDialog user={user} onUserDeleted={onUserDeleted} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[90px] [&>button]:w-full [&>button]:px-3 [&>button]:py-1.5 [&>button]:text-[11px] [&>button]:font-bold [&>button]:text-foreground [&>button]:bg-background [&>button]:border [&>button]:border-border [&>button]:rounded [&>button]:shadow-sm [&>button]:hover:bg-muted/50">
              <SafeRoleUpdateDialog
                user={user}
                currentRole={userRole}
                onRoleUpdated={() => {}}
              />
            </div>
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
