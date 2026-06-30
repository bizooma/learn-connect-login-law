import { BookOpen, Home, FolderOpen, Users, UsersRound, BarChart3, UserCheck, Activity, UserCog, Settings, Route as RouteIcon, Network, Briefcase } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrgPeopleSettings, useFeatureAccess } from "@/hooks/useOrgPeopleSettings";


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
}

const WikiSidebar = ({ categories, activeCategoryId, onCategorySelect }: WikiSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const { settings: peopleSettings } = useOrgPeopleSettings();
  const { allowed: showDirectory } = useFeatureAccess(
    peopleSettings.directoryEnabled,
    peopleSettings.directoryRestrictedGroups
  );

  const onHome = location.pathname === "/admin/wiki";
  const onContent = location.pathname.startsWith("/admin/wiki/content");
  const onTrainingPaths = location.pathname.startsWith("/admin/wiki/training-paths");
  const onDirectory = location.pathname.startsWith("/admin/wiki/directory");
  const onGroups = location.pathname.startsWith("/admin/wiki/groups");
  const onReports = location.pathname.startsWith("/admin/wiki/reports");
  const onReportsContent = location.pathname === "/admin/wiki/reports/content";
  const onReportsPeople = location.pathname === "/admin/wiki/reports/people";
  const onReportsActivity = location.pathname === "/admin/wiki/reports/activity";
  const onManageUsers = location.pathname === "/admin/wiki/account/users";
  const onSettings = location.pathname === "/admin/wiki/account/settings";

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

      <SidebarContent className="pt-12">
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
              {!collapsed && (
                <div className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70">Content</div>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => goToCategory(null)}
                  className={`${onContent && !activeCategoryId ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                >
                  <FolderOpen className="h-4 w-4" />
                  {!collapsed && <span>All Content</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/admin/wiki/training-paths")}
                  className={`${onTrainingPaths ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                >
                  <RouteIcon className="h-4 w-4" />
                  {!collapsed && <span>Training Paths</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && <span>People</span>}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {showDirectory && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/admin/wiki/directory")}
                    className={`${onDirectory ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                  >
                    <Users className="h-4 w-4" />
                    {!collapsed && <span>Directory</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

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

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{!collapsed && <span>Account</span>}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/admin/wiki/account/users")}
                    className={`${onManageUsers ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                  >
                    <UserCog className="h-4 w-4" />
                    {!collapsed && <span>Manage Users</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/admin/wiki/account/settings")}
                    className={`${onSettings ? 'bg-accent text-accent-foreground font-medium' : ''}`}
                  >
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};


export default WikiSidebar;
