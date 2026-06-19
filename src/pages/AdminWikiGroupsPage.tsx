import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreVertical, Search, Users } from "lucide-react";

type GroupType = "Role" | "Department" | "Team";

interface Group {
  name: string;
  type: GroupType;
}

const GROUPS: Group[] = [
  { name: "Associate Attorney", type: "Role" },
  { name: "Attorney", type: "Role" },
  { name: "Declaration Drafter", type: "Role" },
  { name: "Department", type: "Department" },
  { name: "Director of Sales & Marketing", type: "Role" },
  { name: "Docketing Specialist", type: "Role" },
  { name: "Dragon", type: "Team" },
  { name: "Everyone", type: "Team" },
  { name: "Finance Team", type: "Team" },
  { name: "Glendale & Phoenix Office Team", type: "Team" },
  { name: "Head of Operations", type: "Role" },
  { name: "Law Clerk", type: "Role" },
  { name: "Lawyer", type: "Role" },
  { name: "Legal", type: "Department" },
  { name: "Legal Assistant", type: "Role" },
  { name: "Legal Assistant Lead", type: "Role" },
  { name: "Legal/Case Project Manager", type: "Role" },
  { name: "Legal Support Team", type: "Team" },
  { name: "Legal Team", type: "Team" },
  { name: "Marketing & Sales", type: "Department" },
  { name: "Marketing & Sales Team", type: "Team" },
  { name: "Operations", type: "Department" },
  { name: "Operations Team", type: "Team" },
  { name: "Paralegal", type: "Role" },
  { name: "People & Culture Team", type: "Team" },
  { name: "Reception Captain", type: "Role" },
  { name: "Receptionist", type: "Role" },
  { name: "Sales & Intake", type: "Department" },
  { name: "Sales Supervisor (Captain)", type: "Role" },
  { name: "Sales Trainer/QA", type: "Role" },
  { name: "Senior Associate Attorney", type: "Role" },
  { name: "Support Staff", type: "Team" },
  { name: "The A-Team", type: "Team" },
];

const AdminWikiGroupsPage = () => {
  const navigate = useNavigate();
  const { categories } = useWikiCategories();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.type.toLowerCase().includes(q)
    );
  }, [search]);

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
            <div className="border-b border-border bg-background px-6 py-3 flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Groups</h2>
                <p className="text-xs text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "group" : "groups"}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-6xl mx-auto space-y-4">
                <div className="rounded-lg border border-border bg-accent/40 p-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Keep your account organized with groups
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bulk-share content by role, department, team and more.
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-primary shrink-0" />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="rounded-lg border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Group managers</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((g) => (
                        <TableRow key={g.name} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground">
                            {g.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">None</TableCell>
                          <TableCell className="text-muted-foreground">None</TableCell>
                          <TableCell className="text-muted-foreground">{g.type}</TableCell>
                          <TableCell className="text-muted-foreground">0</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminWikiGroupsPage;
