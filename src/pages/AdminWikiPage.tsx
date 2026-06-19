import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWikiCategories, type WikiSubjectCategory } from "@/hooks/useWikiCategories";
import { useWikiArticles, WikiArticle, type WikiContentType } from "@/hooks/useWikiArticles";
import { SUBJECT_CATEGORIES, ALL_CONTENT_META } from "@/components/admin/wiki/subjectCategoryMeta";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import WikiSearchBar from "@/components/admin/wiki/WikiSearchBar";
import WikiCategoryList from "@/components/admin/wiki/WikiCategoryList";
import WikiCategoryDialog from "@/components/admin/wiki/WikiCategoryDialog";
import WikiArticleEditor from "@/components/admin/wiki/WikiArticleEditor";
import CreateContentMenu, { type CreateContentChoice } from "@/components/admin/wiki/CreateContentMenu";
import CreateContentDialog from "@/components/admin/wiki/CreateContentDialog";
import BubblesBanner from "@/components/admin/wiki/BubblesBanner";
import ButterfliesBanner from "@/components/admin/wiki/ButterfliesBanner";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";


const AdminWikiPage = () => {
  const location = useLocation();
  const navState = (location.state ?? {}) as { activeCategoryId?: string | null; openCreateCategory?: boolean };
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(navState.activeCategoryId ?? null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(!!navState.openCreateCategory);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingArticle, setEditingArticle] = useState<WikiArticle | null>(null);
  const [createContentType, setCreateContentType] = useState<WikiContentType | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<WikiSubjectCategory | "all">("all");


  useEffect(() => {
    if (navState.activeCategoryId !== undefined) setActiveCategoryId(navState.activeCategoryId);
    if (navState.openCreateCategory) setCategoryDialogOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useWikiCategories();
  const { updateArticle } = useWikiArticles();

  const baseCategories = activeCategoryId
    ? categories.filter((c) => c.id === activeCategoryId)
    : activeCategoryFilter === "all"
    ? categories
    : categories.filter((c) => c.category === activeCategoryFilter);

  const filteredCategories = searchQuery
    ? baseCategories.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : baseCategories;

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

  const handleCreateChoice = (choice: CreateContentChoice) => {
    if (choice === "subject") {
      handleCreateCategory();
    } else {
      setCreateContentType(choice);
    }
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
          />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  {activeCategoryId ? (
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => setActiveCategoryId(null)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        All Content
                      </button>
                      <span className="text-muted-foreground">/</span>
                      <span className="font-semibold text-foreground">
                        {categories.find((c) => c.id === activeCategoryId)?.title || "Category"}
                      </span>
                    </div>
                  ) : (
                    <h2 className="text-lg font-semibold text-foreground">All Content</h2>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {categories.length} {categories.length === 1 ? "subject" : "subjects"}
                  </p>
                </div>
              </div>
              <CreateContentMenu onSelect={handleCreateChoice} />
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
                  {!activeCategoryId && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { value: "all" as const, label: ALL_CONTENT_META.label, Icon: ALL_CONTENT_META.Icon, iconColor: ALL_CONTENT_META.iconColor },
                        ...SUBJECT_CATEGORIES.map((c) => ({
                          value: c.value,
                          label: c.pluralLabel,
                          Icon: c.Icon,
                          iconColor: c.iconColor,
                        })),
                      ].map((tab) => {
                        const isActive = activeCategoryFilter === tab.value;
                        return (
                          <button
                            key={tab.value}
                            type="button"
                            onClick={() => setActiveCategoryFilter(tab.value)}
                            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                              isActive
                                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                : "border-border bg-background hover:bg-muted/40"
                            }`}
                          >
                            <tab.Icon className={`h-5 w-5 ${tab.iconColor}`} />
                            <span className="text-sm font-medium text-foreground">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!activeCategoryId && <BubblesBanner />}

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

      <CreateContentDialog
        open={!!createContentType}
        onOpenChange={(o) => !o && setCreateContentType(null)}
        contentType={createContentType}
        categories={categories.map((c) => ({ id: c.id, title: c.title, category: c.category }))}
        defaultCategoryId={activeCategoryId}
      />

    </div>
  );
};

export default AdminWikiPage;
