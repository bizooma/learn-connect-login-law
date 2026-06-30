import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import UserManagementTabs from "@/components/admin/user-management/UserManagementTabs";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect } from "react";

const AdminWikiManageUsersPage = () => {
  const navigate = useNavigate();
  const { categories } = useWikiCategories();
  const { isAdmin, loading } = useUserRole();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/admin/wiki", { replace: true });
    }
  }, [isAdmin, loading, navigate]);

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
            onCategorySelect={(id) => navigate("/admin/wiki", { state: { activeCategoryId: id } })}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="border-b border-border px-6 py-3 flex items-center gap-3" style={{ backgroundColor: "#FFDA00" }}>
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Manage Users</h2>
                <p className="text-xs text-muted-foreground">Add, edit, and manage user accounts</p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-7xl mx-auto">
                {isAdmin && <UserManagementTabs />}
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminWikiManageUsersPage;
