import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Briefcase, Activity, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { DirectoryUser } from "@/hooks/useDirectoryUsers";
import { useDirectoryUserDetail } from "@/hooks/useDirectoryUserDetail";
import { formatDistanceToNow } from "date-fns";

interface Props {
  user: DirectoryUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fullName = (u: DirectoryUser) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;

const initials = (u: DirectoryUser) => {
  const f = (u.first_name?.[0] ?? "").toUpperCase();
  const l = (u.last_name?.[0] ?? "").toUpperCase();
  return (f + l) || (u.email?.[0]?.toUpperCase() ?? "?");
};

const formatActivityType = (t: string) =>
  t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const DirectoryUserDrawer = ({ user, open, onOpenChange }: Props) => {
  const { data, isLoading } = useDirectoryUserDetail(user?.id ?? null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        {user && (
          <>
            <SheetHeader>
              <SheetTitle className="text-left">Employee Profile</SheetTitle>
            </SheetHeader>

            <div className="mt-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                {user.profile_image_url && (
                  <AvatarImage src={user.profile_image_url} alt={fullName(user)} />
                )}
                <AvatarFallback className="text-xl">{initials(user)}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold text-foreground">{fullName(user)}</h3>
              {user.job_title && (
                <p className="text-sm text-muted-foreground mt-1">{user.job_title}</p>
              )}
              <Badge variant="secondary" className="mt-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </Badge>
            </div>

            <Separator className="my-6" />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">About</h4>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground break-all">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{user.job_title || "—"}</span>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Summary
              </h4>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </div>
                      <div className="text-2xl font-semibold text-foreground mt-1">
                        {data?.coursesCompleted ?? 0}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        In Progress
                      </div>
                      <div className="text-2xl font-semibold text-foreground mt-1">
                        {data?.coursesInProgress ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Last Active
                    </div>
                    <div className="text-sm font-medium text-foreground mt-1">
                      {data?.lastActiveAt
                        ? formatDistanceToNow(new Date(data.lastActiveAt), { addSuffix: true })
                        : "No activity yet"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data?.totalActivities ?? 0} total activities
                    </div>
                  </div>

                  {data && data.recentActivities.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-2">
                        Recent Activity
                      </h5>
                      <ul className="space-y-2">
                        {data.recentActivities.slice(0, 5).map((a) => (
                          <li
                            key={a.id}
                            className="flex items-start justify-between gap-3 text-sm border-l-2 border-primary/40 pl-3"
                          >
                            <span className="text-foreground">
                              {formatActivityType(a.activity_type)}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DirectoryUserDrawer;
