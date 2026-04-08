import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { useWikiArticles, WikiArticle } from "@/hooks/useWikiArticles";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import WikiSearchBar from "@/components/admin/wiki/WikiSearchBar";
import WikiCategoryList from "@/components/admin/wiki/WikiCategoryList";
import WikiCategoryDialog from "@/components/admin/wiki/WikiCategoryDialog";
import WikiArticleEditor from "@/components/admin/wiki/WikiArticleEditor";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";

const AdminWikiPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingArticle, setEditingArticle] = useState<WikiArticle | null>(null);

  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useWikiCategories();
  const { updateArticle } = useWikiArticles();

  const filteredCategories = searchQuery
    ? categories.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeCategoryId
    ? categories.filter((c) => c.id === activeCategoryId)
    : categories;

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = (data: any) => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...data });
    } else {
      createCategory.mutate(data);
    }
    setEditingCategory(null);
  };

  const handleSaveArticle = (updates: any) => {
    updateArticle.mutate(updates);
    setEditingArticle(null);
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="relative z-50">
        <AdminDashboardHeader triggerDemo={() => {}} />
      </div>

      <SidebarProvider>
        <div className="flex flex-1 w-full" style={{ height: 'calc(100vh - 88px)' }}>
          <WikiSidebar
            categories={categories.map((c) => ({
              id: c.id,
              title: c.title,
              icon: c.icon_name,
              article_count: (c as any).article_count,
            }))}
            activeCategoryId={activeCategoryId}
            onCategorySelect={setActiveCategoryId}
            onCreateCategory={handleCreateCategory}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {activeCategoryId
                      ? categories.find((c) => c.id === activeCategoryId)?.title || "Category"
                      : "All Content"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {categories.length} categories
                  </p>
                </div>
              </div>
              <Button onClick={handleCreateCategory} className="gap-2" size="sm">
                <Plus className="h-4 w-4" /> New Category
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {editingArticle ? (
                <WikiArticleEditor
                  article={editingArticle}
                  onSave={handleSaveArticle}
                  onBack={() => setEditingArticle(null)}
                />
              ) : (
                <div className="max-w-5xl mx-auto space-y-6">
                  <WikiSearchBar value={searchQuery} onChange={setSearchQuery} />

                  {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading...</div>
                  ) : filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        No policies or procedures yet
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        Create your first category to start organizing your company's policies and process documentation.
                      </p>
                      <Button onClick={handleCreateCategory} className="gap-2">
                        <Plus className="h-4 w-4" /> Create First Category
                      </Button>
                    </div>
                  ) : (
                    <WikiCategoryList
                      categories={filteredCategories}
                      onEditCategory={handleEditCategory}
                      onDeleteCategory={(id) => deleteCategory.mutate(id)}
                      onTogglePublishCategory={(c) =>
                        updateCategory.mutate({ id: c.id, is_published: !c.is_published })
                      }
                      onEditArticle={setEditingArticle}
                      searchQuery={searchQuery}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarProvider>

      <WikiCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSave={handleSaveCategory}
        initialData={editingCategory || undefined}
        mode={editingCategory ? "edit" : "create"}
      />
    </div>
  );
};

export default AdminWikiPage;
