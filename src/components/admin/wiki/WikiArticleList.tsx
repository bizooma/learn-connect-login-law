import { useState, useRef } from "react";
import { Plus, FileText, ScrollText, Upload, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWikiArticles, WikiArticle, WikiContentType } from "@/hooks/useWikiArticles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import WikiArticleRow from "./WikiArticleRow";

interface WikiArticleListProps {
  categoryId: string;
  onEditArticle: (article: WikiArticle) => void;
  searchQuery?: string;
}

const WikiArticleList = ({ categoryId, onEditArticle, searchQuery }: WikiArticleListProps) => {
  const { articles, isLoading, createArticle, deleteArticle, updateArticle } = useWikiArticles(categoryId);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show all articles when expanded; the parent category already matched the search.
  const filtered = articles;

  const handleCreate = (contentType: WikiContentType) => {
    const title = `New ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
    createArticle.mutate({ category_id: categoryId, title, content_type: contentType });
  };


  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `wiki-documents/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-resources")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("admin-resources")
        .getPublicUrl(filePath);

      createArticle.mutate({
        category_id: categoryId,
        title: file.name.replace(/\.[^/.]+$/, ""),
        content_type: "file",
        file_url: urlData.publicUrl,
        file_name: file.name,
      });

    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.pptx,.ppt"
      />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" disabled={uploading}>
                  <Plus className="h-4 w-4 mr-1" /> {uploading ? "Uploading..." : "Add new..."}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleCreate("document")}>
                  <Shield className="h-4 w-4 mr-2" /> New Document
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreate("procedure")}>
                  <ScrollText className="h-4 w-4 mr-2" /> New Procedure
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleUploadClick}>
                  <Upload className="h-4 w-4 mr-2" /> Upload File
                </DropdownMenuItem>
              </DropdownMenuContent>

            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
};

export default WikiArticleList;
