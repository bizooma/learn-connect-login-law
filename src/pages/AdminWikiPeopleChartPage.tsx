import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { useOrgPeopleSettings, useFeatureAccess } from "@/hooks/useOrgPeopleSettings";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Lock, Users } from "lucide-react";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  job_title: string | null;
  profile_image_url: string | null;
}

const usePeopleChartData = () => {
  return useQuery({
    queryKey: ["people-chart"],
    queryFn: async () => {
      const [{ data: groups }, { data: members }, { data: managers }, { data: profiles }] =
        await Promise.all([
          supabase.from("groups").select("id, name, type, description").order("name"),
          supabase.from("group_members").select("group_id, user_id"),
          supabase.from("group_managers").select("group_id, user_id"),
          supabase
            .from("profiles")
            .select("id, first_name, last_name, email, job_title, profile_image_url"),
        ]);

      const profileMap = new Map<string, Profile>(
        (profiles ?? []).map((p: any) => [p.id, p as Profile])
      );

      return (groups ?? []).map((g: any) => {
        const mgrIds = (managers ?? []).filter((m: any) => m.group_id === g.id).map((m: any) => m.user_id);
        const memberIds = (members ?? [])
          .filter((m: any) => m.group_id === g.id)
          .map((m: any) => m.user_id);
        return {
          ...g,
          managers: mgrIds.map((id) => profileMap.get(id)).filter(Boolean) as Profile[],
          members: memberIds.map((id) => profileMap.get(id)).filter(Boolean) as Profile[],
        };
      });
    },
  });
};

const initials = (p: Profile) =>
  `${(p.first_name?.[0] ?? "").toUpperCase()}${(p.last_name?.[0] ?? "").toUpperCase()}` ||
  p.email[0]?.toUpperCase() ||
  "?";

const PersonChip = ({ p }: { p: Profile }) => (
  <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
    <Avatar className="h-7 w-7">
      {p.profile_image_url && <AvatarImage src={p.profile_image_url} />}
      <AvatarFallback className="text-[10px]">{initials(p)}</AvatarFallback>
    </Avatar>
    <div className="min-w-0">
      <div className="text-xs font-medium text-foreground truncate">
        {p.first_name} {p.last_name}
      </div>
      {p.job_title && (
        <div className="text-[10px] text-muted-foreground truncate">{p.job_title}</div>
      )}
    </div>
  </div>
);

const AdminWikiPeopleChartPage = () => {
  const navigate = useNavigate();
  const { categories } = useWikiCategories();
  const { settings } = useOrgPeopleSettings();
  const { allowed, isLoading: accessLoading } = useFeatureAccess(
    settings.peopleChartEnabled,
    settings.peopleChartRestrictedGroups
  );
  const { data: nodes = [], isLoading } = usePeopleChartData();

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
                <h2 className="text-lg font-semibold text-foreground">People Chart</h2>
                <p className="text-xs text-muted-foreground">
                  Groups, managers, and members
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {!accessLoading && !allowed ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    People Chart unavailable
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {settings.peopleChartEnabled
                      ? "Your group does not have access to the People Chart."
                      : "The People Chart has been disabled by an admin."}
                  </p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading chart…</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {nodes.map((g: any) => (
                    <Card key={g.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground">{g.name}</div>
                          {g.description && (
                            <div className="text-xs text-muted-foreground">{g.description}</div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {g.members.length}
                        </span>
                      </div>

                      {g.managers.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            Managers
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {g.managers.map((p: Profile) => (
                              <PersonChip key={p.id} p={p} />
                            ))}
                          </div>
                        </div>
                      )}

                      {g.members.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            Members
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {g.members.map((p: Profile) => (
                              <PersonChip key={p.id} p={p} />
                            ))}
                          </div>
                        </div>
                      )}

                      {g.managers.length === 0 && g.members.length === 0 && (
                        <div className="text-xs text-muted-foreground italic">Empty group</div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminWikiPeopleChartPage;
