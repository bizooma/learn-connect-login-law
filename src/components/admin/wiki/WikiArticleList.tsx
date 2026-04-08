import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWikiArticles, WikiArticle } from "@/hooks/useWikiArticles";
import WikiArticleRow from "./WikiArticleRow";

interface WikiArticleListProps {
  categoryId: string;
  onEditArticle: (article: WikiArticle) => void;
  searchQuery?: string;
}

const WikiArticleList = ({ categoryId, onEditArticle, searchQuery }: WikiArticleListProps) => {
  const { articles, isLoading, createArticle, deleteArticle, updateArticle } = useWikiArticles(categoryId);

  const filtered = searchQuery
    ? articles.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : articles;

  const handleAddArticle = () => {
    createArticle.mutate({ category_id: categoryId, title: "New Article" });
  };

  return (
    <div>
      {isLoading ? (
        <div className="px-4 py-3 pl-12 text-sm text-muted-foreground">Loading...</div>
      ) : (
        <>
          {filtered.map((article) => (
            <WikiArticleRow
              key={article.id}
              article={article}
              onEdit={onEditArticle}
              onDelete={(id) => deleteArticle.mutate(id)}
              onTogglePublish={(a) => updateArticle.mutate({ id: a.id, is_published: !a.is_published })}
            />
          ))}
          <div className="px-4 py-2 pl-12">
            <Button variant="ghost" size="sm" onClick={handleAddArticle} className="text-muted-foreground hover:text-foreground">
              <Plus className="h-4 w-4 mr-1" /> Add article
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default WikiArticleList;
