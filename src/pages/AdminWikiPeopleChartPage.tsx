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

const PersonChip = ({ p, draggable = false }: { p: Profile; draggable?: boolean }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: p.id,
    data: { profile: p },
    disabled: !draggable,
  });
  return (
    <div
      ref={setNodeRef}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
      className={`flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-40" : ""}`}
    >
      {draggable && <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />}
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
};

const DepartmentDropZone = ({
  name,
  count,
  children,
  enabled,
}: {
  name: string;
  count: number;
  children: React.ReactNode;
  enabled: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `dept:${name}`, data: { department: name } });
  return (
    <Card
      ref={enabled ? setNodeRef : undefined}
      className={`p-4 space-y-3 transition-all ${
        isOver && enabled ? "ring-2 ring-offset-2" : ""
      }`}
      style={isOver && enabled ? { boxShadow: "0 0 0 2px #FFDA00" } : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-foreground">{name}</div>
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Users className="h-3 w-3" />
          {count}
        </span>
      </div>
      {children}
    </Card>
  );
};

const AdminWikiPeopleChartPage = () => {
  const navigate = useNavigate();
  const { categories } = useWikiCategories();
  const { settings } = useOrgPeopleSettings();
  const { allowed, isLoading: accessLoading } = useFeatureAccess(
    settings.peopleChartEnabled,
    settings.peopleChartRestrictedGroups
  );
  const { data: buckets, isLoading } = usePeopleByDepartment();
  const { isAdmin } = useUserRole();
  const updateDept = useUpdateUserDepartment();
  const [activeDrag, setActiveDrag] = useState<Profile | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const sections: Array<{ name: string; people: Profile[] }> = [
    ...DEPARTMENTS.map((d) => ({ name: d, people: buckets?.[d] ?? [] })),
    { name: "Unassigned", people: buckets?.["Unassigned"] ?? [] },
  ];

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDrag((e.active.data.current as any)?.profile ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    const profile = (e.active.data.current as any)?.profile as Profile | undefined;
    const target = (e.over?.data.current as any)?.department as string | undefined;
    if (!profile || !target) return;
    const currentDept = profile.department ?? "Unassigned";
    if (currentDept === target) return;
    updateDept.mutate({
      userId: profile.id,
      department: target === "Unassigned" ? null : target,
    });
  };

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
                  {isAdmin
                    ? "Drag staff cards between departments to reassign them"
                    : "Active New Frontier staff grouped by department"}
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
                  <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActiveDrag(null)}
                  >
                    <div className="space-y-4">
                      {sections.map((section) => (
                        <DepartmentDropZone
                          key={section.name}
                          name={section.name}
                          count={section.people.length}
                          enabled={isAdmin}
                        >
                          {section.people.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {section.people.map((p) => (
                                <PersonChip key={p.id} p={p} draggable={isAdmin} />
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic">
                              {isAdmin ? "Drop staff here" : "No one assigned yet"}
                            </div>
                          )}
                        </DepartmentDropZone>
                      ))}
                    </div>
                    <DragOverlay>
                      {activeDrag ? <PersonChip p={activeDrag} /> : null}
                    </DragOverlay>
                  </DndContext>
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
