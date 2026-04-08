import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWikiCategories } from "@/hooks/useWikiCategories";
import { useWikiArticles, WikiArticle } from "@/hooks/useWikiArticles";
import WikiSearchBar from "./WikiSearchBar";
import WikiCategoryList from "./WikiCategoryList";
import WikiCategoryDialog from "./WikiCategoryDialog";
import WikiArticleEditor from "./WikiArticleEditor";

const WikiManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingArticle, setEditingArticle] = useState<WikiArticle | null>(null);

  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useWikiCategories();
  const { updateArticle } = useWikiArticles();

  const filteredCategories = searchQuery
    ? categories.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
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

  if (editingArticle) {
    return (
      <WikiArticleEditor
        article={editingArticle}
        onSave={handleSaveArticle}
        onBack={() => setEditingArticle(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Policies & Procedures</h2>
            <p className="text-sm text-muted-foreground">Manage your company's policies and process documentation</p>
          </div>
        </div>
        <Button onClick={() => { setEditingCategory(null); setCategoryDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      <WikiSearchBar value={searchQuery} onChange={setSearchQuery} />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading categories...</div>
      ) : (
        <WikiCategoryList
          categories={filteredCategories}
          onEditCategory={handleEditCategory}
          onDeleteCategory={(id) => deleteCategory.mutate(id)}
          onTogglePublishCategory={(c) => updateCategory.mutate({ id: c.id, is_published: !c.is_published })}
          onEditArticle={setEditingArticle}
          searchQuery={searchQuery}
        />
      )}

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

export default WikiManagement;
