import { BookOpen, Home, FolderOpen, Plus, Users, UsersRound, BarChart3, UserCheck, Activity } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";


interface WikiCategory {
  id: string;
  title: string;
  icon: string | null;
  article_count?: number;
}

interface WikiSidebarProps {
  categories: WikiCategory[];
  activeCategoryId: string | null;
  onCategorySelect: (id: string | null) => void;
  onCreateCategory: () => void;
}

const WikiSidebar = ({ categories, activeCategoryId, onCategorySelect, onCreateCategory }: WikiSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const onHome = location.pathname === "/admin/wiki";
  const onContent = location.pathname.startsWith("/admin/wiki/content");
  const onDirectory = location.pathname.startsWith("/admin/wiki/directory");
  const onGroups = location.pathname.startsWith("/admin/wiki/groups");
  const onReports = location.pathname.startsWith("/admin/wiki/reports");
  const onReportsContent = location.pathname === "/admin/wiki/reports/content";
  const onReportsPeople = location.pathname === "/admin/wiki/reports/people";
  const onReportsActivity = location.pathname === "/admin/wiki/reports/activity";

  const goToCategory = (id: string | null) => {
    if (onContent) {
      onCategorySelect(id);
    } else {
      navigate("/admin/wiki/content", { state: { activeCategoryId: id } });
    }
  };


  return (
    <Sidebar collapsible="icon" className="border-r border-border top-0 h-full">
      <SidebarHeader className="p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Policies & Procedures</span>
          </div>
        )}
        {collapsed && <BookOpen className="h-5 w-5 text-primary mx-auto" />}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/admin/wiki")}
                  className={`${onHome ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                >
                  <Home className="h-4 w-4" />
                  {!collapsed && <span>Home</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && <span>Content</span>}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => goToCategory(null)}
                  className={`${onContent && !activeCategoryId ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                >
                  <FolderOpen className="h-4 w-4" />
                  {!collapsed && <span>All Content</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            {!collapsed && <span>Subjects</span>}
            {!collapsed && (
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onCreateCategory}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.length === 0 && !collapsed && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No categories yet</p>
              )}
              {categories.map((category) => (
                <SidebarMenuItem key={category.id}>
                  <SidebarMenuButton
                    onClick={() => goToCategory(category.id)}
                    className={`${onContent && activeCategoryId === category.id ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                  >
                    <FolderOpen className="h-4 w-4" />
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{category.title}</span>
                        {category.article_count !== undefined && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {category.article_count}
                          </span>
                        )}
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && <span>People</span>}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/admin/wiki/directory")}
                  className={`${onDirectory ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                >
                  <Users className="h-4 w-4" />
                  {!collapsed && <span>Directory</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/admin/wiki/groups")}
                  className={`${onGroups ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                >
                  <UsersRound className="h-4 w-4" />
                  {!collapsed && <span>Groups</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && <span>Reports</span>}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/admin/wiki/reports/content")}
                  className={`${onReportsContent ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                >
                  <BarChart3 className="h-4 w-4" />
                  {!collapsed && <span>Content Report</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/admin/wiki/reports/people")}
                  className={`${onReportsPeople ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                >
                  <UserCheck className="h-4 w-4" />
                  {!collapsed && <span>People Report</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/admin/wiki/reports/activity")}
                  className={`${onReportsActivity ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                >
                  <Activity className="h-4 w-4" />
                  {!collapsed && <span>Activity</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};


export default WikiSidebar;
