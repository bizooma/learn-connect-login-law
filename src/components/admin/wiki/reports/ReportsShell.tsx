import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import { useWikiCategories } from "@/hooks/useWikiCategories";

interface ReportsShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const ReportsShell = ({ title, subtitle, actions, children }: ReportsShellProps) => {
  const navigate = useNavigate();
  const { categories } = useWikiCategories();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="relative z-50">
        <AdminDashboardHeader triggerDemo={() => {}} />
      </div>

      <SidebarProvider>
        <div className="flex flex-1 w-full" style={{ height: "calc(100vh - 88px)" }}>
          <WikiSidebar
            categories={categories.map((c: any) => ({
              id: c.id,
              title: c.title,
              icon: c.icon_name,
              article_count: c.article_count,
            }))}
            activeCategoryId={null}
            onCategorySelect={(id) =>
              navigate("/admin/wiki/content", { state: { activeCategoryId: id } })
            }
            onCreateCategory={() =>
              navigate("/admin/wiki/content", { state: { openCreateCategory: true } })
            }
          />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="border-b border-border bg-background px-6 py-3 flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
              {actions}
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-6xl mx-auto space-y-4">{children}</div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default ReportsShell;
