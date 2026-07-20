import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, FileText, ArrowLeft, LayoutList, Users, SlidersHorizontal } from "lucide-react";
import WikiFiltersSheet, {
  emptyFilters,
  activeFilterGroupCount,
  matchesFilters,
  parseFiltersFromParams,
  writeFiltersToParams,
  type WikiFilters,
} from "@/components/admin/wiki/WikiFiltersSheet";
import { useWikiAccess } from "@/hooks/useWikiAccess";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWikiCategories, type WikiSubjectCategory, type WikiCategory } from "@/hooks/useWikiCategories";
import { useWikiArticles, WikiArticle, type WikiContentType } from "@/hooks/useWikiArticles";
import { SUBJECT_CATEGORIES, ALL_CONTENT_META } from "@/components/admin/wiki/subjectCategoryMeta";
import WikiSidebar from "@/components/admin/wiki/WikiSidebar";
import WikiGlobalSearchBox from "@/components/admin/wiki/WikiGlobalSearchBox";
import WikiCategoryList from "@/components/admin/wiki/WikiCategoryList";
import WikiCategoryListByTeam from "@/components/admin/wiki/WikiCategoryListByTeam";
import WikiTagFilterBar, { useAllArticleTags } from "@/components/admin/wiki/WikiTagFilterBar";
import WikiCategoryDialog from "@/components/admin/wiki/WikiCategoryDialog";
import WikiArticleEditor from "@/components/admin/wiki/WikiArticleEditor";
import WikiDocumentSidebar from "@/components/admin/wiki/WikiDocumentSidebar";
import CreateContentMenu, { type CreateContentChoice } from "@/components/admin/wiki/CreateContentMenu";
import CreateContentDialog from "@/components/admin/wiki/CreateContentDialog";
import BubblesBanner from "@/components/admin/wiki/BubblesBanner";
import ButterfliesBanner from "@/components/admin/wiki/ButterfliesBanner";
import SnowBanner from "@/components/admin/wiki/SnowBanner";
import BunniesBanner from "@/components/admin/wiki/BunniesBanner";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import WikiFooter from "@/components/admin/wiki/WikiFooter";
import PreviewAsStaffBanner from "@/components/admin/wiki/PreviewAsStaffBanner";
import { usePreviewAsStaff, withPreviewAsStaffParam } from "@/hooks/usePreviewAsStaff";

type ViewMode = "training" | "team";
type SortMode = "training" | "az" | "updated" | "owner";


const AdminWikiPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const openArticle = (a: WikiArticle) => {
    if (a.content_type === "flowchart") {
      navigate(withPreviewAsStaffParam(`/admin/wiki/flowchart/${a.id}`));
    } else {
      setEditingArticle(a);
    }
  };
  const navState = (location.state ?? {}) as { activeCategoryId?: string | null; openCreateCategory?: boolean };
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(navState.activeCategoryId ?? null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(!!navState.openCreateCategory);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingArticle, setEditingArticle] = useState<WikiArticle | null>(null);
  const [createContentType, setCreateContentType] = useState<WikiContentType | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<WikiSubjectCategory | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("training");
  const [sortMode, setSortMode] = useState<SortMode>("training");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { enabled: previewAsStaff } = usePreviewAsStaff();


  useEffect(() => {
    if (navState.activeCategoryId !== undefined) setActiveCategoryId(navState.activeCategoryId);
    if (navState.openCreateCategory) setCategoryDialogOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Open a specific article when navigated with ?article=<id>
  const [searchParams, setSearchParams] = useSearchParams();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<WikiFilters>(() => parseFiltersFromParams(new URLSearchParams(window.location.search)));
  const { getAccess } = useWikiAccess();
  const activeFilterCount = activeFilterGroupCount(filters);


  const articleParam = searchParams.get("article");
  useEffect(() => {
    if (!articleParam) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("wiki_articles")
        .select("*")
        .eq("id", articleParam)
        .single();
      if (!active) return;
      if (error || !data) {
        toast.error("Could not open item");
        setSearchParams({}, { replace: true });
        return;
      }
      const a = data as unknown as WikiArticle;
      if (a.content_type === "flowchart") {
        navigate(withPreviewAsStaffParam(`/admin/wiki/flowchart/${a.id}`), { replace: true });
        return;
      }
      setActiveCategoryId(a.category_id);
      setEditingArticle(a);
      // clear the param so refresh/back behaves naturally
      setSearchParams({}, { replace: true });
    })();
    return () => {
      active = false;
    };
  }, [articleParam]);

  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useWikiCategories();
  const { updateArticle } = useWikiArticles();

  const { data: allArticleTags = [] } = useAllArticleTags();

  const categoriesWithMatchingTags = useMemo(() => {
    if (selectedTags.length === 0) return null;
    const set = new Set<string>();
    allArticleTags.forEach((a) => {
      const has = (a.tags || []).some((t) => selectedTags.includes(t));
      if (has) set.add(a.category_id);
    });
    return set;
  }, [allArticleTags, selectedTags]);

  const baseCategories = activeCategoryId
    ? categories.filter((c) => c.id === activeCategoryId)
    : activeCategoryFilter === "all"
    ? categories
    : categories.filter((c) => c.category === activeCategoryFilter);

  const searchFiltered = searchQuery
    ? baseCategories.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : baseCategories;

  const tagFiltered = categoriesWithMatchingTags
    ? searchFiltered.filter((c) => categoriesWithMatchingTags.has(c.id))
    : searchFiltered;

  const advancedFiltered = activeFilterCount > 0
    ? tagFiltered.filter((c) => matchesFilters(c, filters, getAccess))
    : tagFiltered;



  const sortedCategories = useMemo(() => {
    const arr = [...advancedFiltered];
    switch (sortMode) {
      case "az":
        return arr.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
      case "updated":
        return arr.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
      case "owner":
        return arr.sort((a, b) => {
          const ao = a.owner ? (a.owner.last_name || a.owner.first_name || a.owner.email || "") : "\uffff";
          const bo = b.owner ? (b.owner.last_name || b.owner.first_name || b.owner.email || "") : "\uffff";
          return ao.localeCompare(bo, undefined, { sensitivity: "base" });
        });
      case "training":
      default:
        return arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
  }, [advancedFiltered, sortMode]);


  const filteredCategories = sortedCategories;

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
      <PreviewAsStaffBanner />

      <SidebarProvider>
        <div className="flex flex-1 w-full" style={{ height: 'calc(100vh - 88px)' }}>
          {editingArticle ? (
            <WikiDocumentSidebar
              categoryId={editingArticle.category_id}
              activeArticleId={editingArticle.id}
            />
          ) : (
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
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <div className="border-b border-border px-6 py-3 flex items-center justify-between" style={{ backgroundColor: "#FFDA00" }}>
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
              {!previewAsStaff && <CreateContentMenu onSelect={handleCreateChoice} />}
            </div>




            <div className="flex-1 overflow-auto flex flex-col">
              <div className="flex-1 p-6">
              {editingArticle ? (
                <WikiArticleEditor
                  article={editingArticle}
                  onSave={handleSaveArticle}
                  onBack={() => setEditingArticle(null)}
                />
              ) : (
                <div className="w-full px-4 space-y-6">
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

                  {!activeCategoryId && (
                    activeCategoryFilter === "company" ? <ButterfliesBanner />
                    : activeCategoryFilter === "policy" ? <SnowBanner />
                    : activeCategoryFilter === "procedure" ? <BunniesBanner />
                    : <BubblesBanner />
                  )}

                  <WikiGlobalSearchBox value={searchQuery} onChange={setSearchQuery} />

                  {activeCategoryId && (
                    <Button
                      onClick={() => setActiveCategoryId(null)}
                      className="w-fit gap-2 bg-[#FFDA00] text-black hover:bg-[#FFDA00]/90 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to All Content
                    </Button>
                  )}

                  {!activeCategoryId && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex rounded-md border border-border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setViewMode("training")}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                            viewMode === "training" ? "text-black" : "bg-background text-foreground hover:bg-muted"
                          }`}
                          style={viewMode === "training" ? { backgroundColor: "#FFDA00" } : undefined}
                        >
                          <LayoutList className="h-4 w-4" /> Training order
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode("team")}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors border-l border-border ${
                            viewMode === "team" ? "text-black" : "bg-background text-foreground hover:bg-muted"
                          }`}
                          style={viewMode === "team" ? { backgroundColor: "#FFDA00" } : undefined}
                        >
                          <Users className="h-4 w-4" /> Filter by Department
                        </button>
                      </div>

                      {viewMode === "training" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Sort:</span>
                          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                            <SelectTrigger className="w-[180px] h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="training">Training order</SelectItem>
                              <SelectItem value="az">A–Z</SelectItem>
                              <SelectItem value="updated">Recently updated</SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {!activeCategoryId && (
                    <WikiTagFilterBar
                      articles={allArticleTags}
                      selected={selectedTags}
                      onChange={setSelectedTags}
                    />
                  )}

                  {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading...</div>
                  ) : filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        No matching content
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        Try adjusting your search, tag filter, or create a new subject.
                      </p>
                      <Button onClick={handleCreateCategory} className="gap-2">
                        <Plus className="h-4 w-4" /> Create First Category
                      </Button>
                    </div>
                  ) : viewMode === "team" && !activeCategoryId ? (
                    <WikiCategoryListByTeam
                      categories={filteredCategories}
                      onEditCategory={handleEditCategory}
                      onDeleteCategory={(id) => deleteCategory.mutate(id)}
                      onTogglePublishCategory={(c) =>
                        updateCategory.mutate({ id: c.id, is_published: !c.is_published })
                      }
                      onEditArticle={openArticle}
                      searchQuery={searchQuery}
                    />
                  ) : (
                    <WikiCategoryList
                      categories={filteredCategories}
                      onEditCategory={handleEditCategory}
                      onDeleteCategory={(id) => deleteCategory.mutate(id)}
                      onTogglePublishCategory={(c) =>
                        updateCategory.mutate({ id: c.id, is_published: !c.is_published })
                      }
                      onEditArticle={openArticle}
                      searchQuery={searchQuery}
                      selectedTags={selectedTags}
                    />
                  )}
                </div>
              )}
              </div>
              <WikiFooter />
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
