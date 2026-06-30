import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import WikiFooter from "@/components/admin/wiki/WikiFooter";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { useOrgPeopleSettings, useFeatureAccess } from "@/hooks/useOrgPeopleSettings";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Lock, Briefcase } from "lucide-react";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  job_title: string | null;
  profile_image_url: string | null;
}

const useProfiles = () => {
  return useQuery({
    queryKey: ["role-chart-profiles"],
    queryFn: async (): Promise<Profile[]> => {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, job_title, profile_image_url")
        .order("job_title", { ascending: true, nullsFirst: false });
      return (data ?? []) as Profile[];
    },
  });
};

const initials = (p: Profile) =>
  `${(p.first_name?.[0] ?? "").toUpperCase()}${(p.last_name?.[0] ?? "").toUpperCase()}` ||
  p.email[0]?.toUpperCase() ||
  "?";

const AdminWikiRoleChartPage = () => {
  const navigate = useNavigate();
  const { categories } = useWikiCategories();
  const { settings } = useOrgPeopleSettings();
  const { allowed, isLoading: accessLoading } = useFeatureAccess(
    settings.roleChartEnabled,
    settings.roleChartRestrictedGroups
  );
  const { data: profiles = [], isLoading } = useProfiles();

  const groupedByRole = useMemo(() => {
    const groups = new Map<string, Profile[]>();
    profiles.forEach((p) => {
      const role = p.job_title?.trim() || "Unassigned";
      if (!groups.has(role)) groups.set(role, []);
      groups.get(role)!.push(p);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return a.localeCompare(b);
    });
  }, [profiles]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="relative z-50">
        <AdminDashboardHeader triggerDemo={() => {}} />
      </div>

      <SidebarProvider>
        <div className="flex flex-1 w-full" style={{ height: "calc(100vh - 88px)" }}>
          <WikiSidebar
            categories={categories.map((c) => ({
              id: c.id,
              title: c.title,
              icon: c.icon_name,
              article_count: (c as any).article_count,
            }))}
            activeCategoryId={null}
            onCategorySelect={(id) =>
              navigate("/admin/wiki", { state: { activeCategoryId: id } })
            }
          />

          <div className="flex-1 flex flex-col min-w-0">
            <div
              className="border-b border-border px-6 py-3 flex items-center gap-3"
              style={{ backgroundColor: "#FFDA00" }}
            >
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Role Chart</h2>
                <p className="text-xs text-muted-foreground">
                  People grouped by job title
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex flex-col">
              <div className="flex-1 p-6">
              {!accessLoading && !allowed ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Role Chart unavailable
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {settings.roleChartEnabled
                      ? "Your group does not have access to the Role Chart."
                      : "The Role Chart has been disabled by an admin."}
                  </p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading chart…</div>
              ) : (
                <div className="space-y-4">
                  {groupedByRole.map(([role, people]) => (
                    <Card key={role} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold text-foreground">{role}</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {people.length} {people.length === 1 ? "person" : "people"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {people.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5"
                          >
                            <Avatar className="h-8 w-8">
                              {p.profile_image_url && <AvatarImage src={p.profile_image_url} />}
                              <AvatarFallback className="text-xs">{initials(p)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {p.first_name} {p.last_name}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {p.email}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              </div>
              <WikiFooter />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminWikiRoleChartPage;
