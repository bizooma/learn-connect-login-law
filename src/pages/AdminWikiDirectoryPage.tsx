import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import DirectorySearchBar from "@/components/admin/wiki/directory/DirectorySearchBar";
import DirectoryTable from "@/components/admin/wiki/directory/DirectoryTable";
import DirectoryUserDrawer from "@/components/admin/wiki/directory/DirectoryUserDrawer";
import { useDirectoryUsers, DirectoryUser } from "@/hooks/useDirectoryUsers";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

const PAGE_SIZE = 20;

const AdminWikiDirectoryPage = () => {
  const { data: users = [], isLoading } = useDirectoryUsers();
  const { categories } = useWikiCategories();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DirectoryUser | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
      return (
        name.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.job_title ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

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
            onCategorySelect={() => {}}
            onCreateCategory={() => {}}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="border-b border-border bg-background px-6 py-3 flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Directory</h2>
                <p className="text-xs text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "person" : "people"}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-6xl mx-auto space-y-4">
                <DirectorySearchBar
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                />

                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading directory…</div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      No people found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Try a different search term.
                    </p>
                  </div>
                ) : (
                  <>
                    <DirectoryTable users={pageRows} onSelect={setSelected} />

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of{" "}
                        {filtered.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={currentPage === 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-3">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={currentPage === totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>

      <DirectoryUserDrawer
        user={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
};

export default AdminWikiDirectoryPage;
