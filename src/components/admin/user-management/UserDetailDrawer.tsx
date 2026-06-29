import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Building2,
  Briefcase,
  Calendar,
  Activity,
  BookOpen,
  Users,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { UserProfile } from "./types";
import { getUserRole, getRoleBadgeColor } from "./userRoleUtils";

interface UserDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  isTester?: boolean;
  groupNames?: string[];
  lastLoginAt?: string | null;
  onOpenProgress?: (userId: string) => void;
}

interface SessionRow {
  session_start: string;
  session_end: string | null;
  session_type: string | null;
  entry_point: string | null;
}

interface RoleAuditRow {
  id: string;
  performed_at: string;
  old_role: string | null;
  new_role: string | null;
  reason: string | null;
}

interface WikiViewRow {
  viewed_at: string;
  article_id: string;
}

const Row = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm break-words">{value}</div>
    </div>
  </div>
);

const UserDetailDrawer = ({
  open,
  onOpenChange,
  user,
  isTester,
  groupNames = [],
  lastLoginAt,
  onOpenProgress,
}: UserDetailDrawerProps) => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [roleAudit, setRoleAudit] = useState<RoleAuditRow[]>([]);
  const [wikiViews, setWikiViews] = useState<number>(0);
  const [streak, setStreak] = useState<{ current: number; longest: number } | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [s, ra, wv, st] = await Promise.all([
          supabase
            .from("user_sessions")
            .select("session_start, session_end, session_type, entry_point")
            .eq("user_id", user.id)
            .order("session_start", { ascending: false })
            .limit(20),
          supabase
            .from("user_role_audit" as any)
            .select("id, performed_at, old_role, new_role, reason")
            .eq("target_user_id", user.id)
            .order("performed_at", { ascending: false })
            .limit(20),
          supabase
            .from("wiki_article_views" as any)
            .select("viewed_at, article_id", { count: "exact" })
            .eq("user_id", user.id),
          supabase
            .from("user_wiki_streaks" as any)
            .select("current_streak, longest_streak")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        setSessions((s.data || []) as SessionRow[]);
        setRoleAudit((ra.data || []) as RoleAuditRow[]);
        setWikiViews(wv.count || 0);
        if (st.data) {
          setStreak({
            current: (st.data as any).current_streak || 0,
            longest: (st.data as any).longest_streak || 0,
          });
        } else {
          setStreak({ current: 0, longest: 0 });
        }
      } catch (err) {
        console.error("drawer fetch error", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, user]);

  if (!user) return null;

  const role = getUserRole(user);
  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}` || user.email[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.profile_image_url || undefined} />
              <AvatarFallback className="text-lg">{initials.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">
                {user.first_name || user.last_name
                  ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
                  : user.email}
              </SheetTitle>
              <SheetDescription className="truncate">{user.email}</SheetDescription>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge className={getRoleBadgeColor(role)}>{role.replace("_", " ")}</Badge>
                {isTester && (
                  <Badge variant="outline" className="border-amber-400 text-amber-700">
                    Tester
                  </Badge>
                )}
                {user.is_deleted && <Badge variant="destructive">Inactive</Badge>}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-3 grid grid-cols-4 w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="lms">LMS</TabsTrigger>
            <TabsTrigger value="pnp">P&amp;P</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-6 pt-4">
              <TabsContent value="overview" className="mt-0 space-y-1">
                <Row icon={Mail} label="Email" value={user.email} />
                {user.job_title && (
                  <Row icon={Briefcase} label="Job title" value={user.job_title} />
                )}
                {user.law_firm_name && (
                  <Row icon={Building2} label="Law firm" value={user.law_firm_name} />
                )}
                <Row
                  icon={Calendar}
                  label="Joined"
                  value={format(new Date(user.created_at), "PPP")}
                />
                <Row
                  icon={Activity}
                  label="Last sign-in"
                  value={
                    lastLoginAt
                      ? `${formatDistanceToNow(new Date(lastLoginAt))} ago`
                      : "Never"
                  }
                />
                <Row
                  icon={Users}
                  label={`Groups (${groupNames.length})`}
                  value={
                    groupNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {groupNames.map((g) => (
                          <Badge key={g} variant="secondary" className="text-[11px]">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )
                  }
                />
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <h3 className="text-sm font-semibold mb-2">Recent sessions</h3>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    No sessions recorded yet.
                  </div>
                ) : (
                  <div className="divide-y border rounded-md">
                    {sessions.map((s, i) => (
                      <div key={i} className="px-3 py-2 text-sm flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {format(new Date(s.session_start), "MMM d, yyyy h:mm a")}
                          </div>
                          {s.entry_point && (
                            <div className="text-xs text-muted-foreground truncate max-w-[260px]">
                              {s.entry_point}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {s.session_type || "general"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <h3 className="text-sm font-semibold mt-6 mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Role changes
                </h3>
                {roleAudit.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-3">No role changes.</div>
                ) : (
                  <div className="divide-y border rounded-md">
                    {roleAudit.map((r) => (
                      <div key={r.id} className="px-3 py-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">{r.old_role || "—"}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium">{r.new_role || "—"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(r.performed_at), "MMM d, yyyy")} ·{" "}
                          {r.reason || "no reason"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="lms" className="mt-0 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Course progress, completions, and quiz results.
                </p>
                {onOpenProgress && (
                  <Button onClick={() => onOpenProgress(user.id)} className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Open full progress report
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="pnp" className="mt-0 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border p-3 text-center">
                    <div className="text-2xl font-bold">{wikiViews}</div>
                    <div className="text-xs text-muted-foreground">Articles viewed</div>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <div className="text-2xl font-bold">{streak?.current ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Current streak</div>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <div className="text-2xl font-bold">{streak?.longest ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Longest streak</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Streaks update each time the user opens a Policy or Procedure article.
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default UserDetailDrawer;
