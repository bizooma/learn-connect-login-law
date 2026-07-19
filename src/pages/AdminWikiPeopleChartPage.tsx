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
import { Lock, Users, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { useUpdateUserDepartment } from "@/hooks/useUpdateUserDepartment";
import { useUserRole } from "@/hooks/useUserRole";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  job_title: string | null;
  profile_image_url: string | null;
  department: string | null;
}

const DEPARTMENTS = [
  "Legal",
  "Sales",
  "Marketing",
  "People & Culture",
  "Finance",
  "Operations",
] as const;

type Department = (typeof DEPARTMENTS)[number];

// Normalize incoming profiles.department strings to one of the 6 fixed departments.
const normalizeDepartment = (raw: string | null | undefined): Department | null => {
  if (!raw) return null;
  const k = raw.trim().toLowerCase();
  if (!k) return null;
  if (k.includes("legal")) return "Legal";
  if (k.includes("sales") && k.includes("marketing")) return "Marketing"; // rare hybrid; default group
  if (k.includes("sales") || k.includes("intake")) return "Sales";
  if (k.includes("marketing")) return "Marketing";
  if (k.includes("people") || k.includes("culture") || k.includes("hr")) return "People & Culture";
  if (k.includes("finance") || k.includes("accounting")) return "Finance";
  if (k.includes("operation") || k.includes("reception") || k.includes("office")) return "Operations";
  // Exact matches
  const exact = DEPARTMENTS.find((d) => d.toLowerCase() === k);
  return exact ?? null;
};

const usePeopleByDepartment = () => {
  return useQuery({
    queryKey: ["people-by-department"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, job_title, profile_image_url, department")
        .ilike("email", "%@newfrontier.us")
        .eq("is_deleted", false)
        .order("first_name", { ascending: true });
      if (error) throw error;

      const buckets: Record<string, Profile[]> = {
        Legal: [],
        Sales: [],
        Marketing: [],
        "People & Culture": [],
        Finance: [],
        Operations: [],
        Unassigned: [],
      };
      (data ?? []).forEach((p: any) => {
        const dept = normalizeDepartment(p.department);
        if (dept) buckets[dept].push(p as Profile);
        else buckets["Unassigned"].push(p as Profile);
      });
      return buckets;
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
  const { data: buckets, isLoading } = usePeopleByDepartment();

  const sections: Array<{ name: string; people: Profile[] }> = [
    ...DEPARTMENTS.map((d) => ({ name: d, people: buckets?.[d] ?? [] })),
    { name: "Unassigned", people: buckets?.["Unassigned"] ?? [] },
  ];

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
                <h2 className="text-lg font-semibold text-foreground">People by Department</h2>
                <p className="text-xs text-muted-foreground">
                  Active New Frontier staff grouped by department
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
                      People unavailable
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {settings.peopleChartEnabled
                        ? "Your group does not have access to this view."
                        : "This view has been disabled by an admin."}
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading…</div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section) => (
                      <Card key={section.name} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-foreground">{section.name}</div>
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {section.people.length}
                          </span>
                        </div>
                        {section.people.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {section.people.map((p) => (
                              <PersonChip key={p.id} p={p} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">
                            No one assigned yet
                          </div>
                        )}
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

export default AdminWikiPeopleChartPage;
